from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
from typing import Dict, List

from ..models import (
    OrderInput,
    ProductCatalogEntry,
    RecommendationItem,
    RecommendationRequest,
    RecommendationResponse,
)
from . import utils


class RecommendationEngine:
    """Scores products using collaborative + behavioral signals."""

    def recommend(self, payload: RecommendationRequest) -> RecommendationResponse:
        customer_stats = self._customer_stats(payload.customerOrders)
        peer_counts = self._peer_product_counts(payload.peerOrders)

        inventory = payload.context.inventory or {}

        candidate_products = [
            product for product in payload.catalog if product.isActive
        ]

        scored: List[RecommendationItem] = []
        for product in candidate_products:
            if product.id in customer_stats["purchased_products"]:
                # Skip products recently purchased unless inventory is high and peers demand
                days_since = customer_stats["recency"].get(product.id)
                if days_since is not None and days_since < 30:
                    continue

            popularity = self._popularity_score(product.id, peer_counts)
            inventory_factor = self._inventory_score(product.id, inventory)
            price_alignment = self._price_alignment(product.unitPrice, customer_stats["avg_item_value"])
            novelty = self._novelty_score(product.category, customer_stats["category_mix"])

            score = (
                0.45 * popularity
                + 0.25 * inventory_factor
                + 0.2 * price_alignment
                + 0.1 * novelty
            )

            reason_parts = []

            if popularity >= 0.5:
                reason_parts.append("Trending with similar customers")
            elif popularity >= 0.2:
                reason_parts.append("Growing demand in your segment")

            if inventory_factor >= 0.6:
                reason_parts.append("Ready to ship (healthy stock)")

            if price_alignment >= 0.6:
                reason_parts.append("Aligned with your typical spend")

            if not reason_parts:
                reason_parts.append("Complements your recent purchases")

            scored.append(
                RecommendationItem(
                    productId=product.id,
                    sku=product.sku,
                    name=product.name,
                    category=product.category,
                    unitPrice=product.unitPrice,
                    reason="; ".join(reason_parts),
                    score=round(score, 4),
                )
            )

        scored.sort(key=lambda item: item.score, reverse=True)
        return RecommendationResponse(
            data=scored[: payload.limit],
            model="hybrid-collaborative-filter",
        )

    def _customer_stats(self, orders: List[OrderInput]) -> Dict[str, any]:
        purchased_products = set()
        recency: Dict[str, float] = {}
        category_mix = Counter()
        total_value = 0.0
        total_items = 0

        now = datetime.utcnow()

        for order in orders:
            for item in order.items:
                purchased_products.add(item.productId)
                category_mix[item.category or "uncategorized"] += 1
                total_value += item.unitPrice * item.quantity
                total_items += item.quantity
                days = (now - order.orderDate).days
                recency[item.productId] = min(recency.get(item.productId, days), days)

        avg_item_value = total_value / total_items if total_items else 0.0
        category_norm = {
            category: count / sum(category_mix.values())
            for category, count in category_mix.items()
        } if category_mix else {}

        return {
            "purchased_products": purchased_products,
            "recency": recency,
            "category_mix": category_norm,
            "avg_item_value": avg_item_value,
        }

    def _peer_product_counts(self, orders: List[OrderInput]) -> Dict[str, int]:
        counts: Dict[str, int] = defaultdict(int)
        for order in orders:
            seen_in_order = set()
            for item in order.items:
                if item.productId in seen_in_order:
                    continue
                seen_in_order.add(item.productId)
                counts[item.productId] += 1
        return counts

    def _popularity_score(self, product_id: str, peer_counts: Dict[str, int]) -> float:
        if not peer_counts:
            return 0.3
        max_count = max(peer_counts.values())
        return peer_counts.get(product_id, 0) / max_count if max_count else 0.0

    def _inventory_score(self, product_id: str, inventory: Dict[str, int]) -> float:
        if not inventory:
            return 0.5
        quantity = inventory.get(product_id, 0)
        if quantity <= 0:
            return 0.1
        capped = min(quantity, 100)
        return capped / 100

    def _price_alignment(self, price: float, avg_item_value: float) -> float:
        if avg_item_value == 0:
            return 0.5
        diff = abs(price - avg_item_value)
        return max(0.0, 1 - diff / (avg_item_value + 1e-6))

    def _novelty_score(self, category: str | None, category_mix: Dict[str, float]) -> float:
        if not category:
            return 0.4
        # Encourage categories the customer under-indexes in
        weight = category_mix.get(category, 0.0)
        return 1 - weight

