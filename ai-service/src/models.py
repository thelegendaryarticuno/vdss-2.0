from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CustomerProfile(BaseModel):
    id: str
    code: Optional[str] = None
    name: Optional[str] = None
    segment: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    isActive: Optional[bool] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class OrderItemInput(BaseModel):
    productId: str
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    unitPrice: float
    discountPercent: Optional[float] = 0.0
    total: Optional[float] = None


class OrderInput(BaseModel):
    id: str
    status: str
    salesRepId: Optional[str] = None
    quoteId: Optional[str] = None
    orderDate: datetime
    totalAmount: float
    items: List[OrderItemInput] = Field(default_factory=list)


class SalesSummaryInput(BaseModel):
    period: str  # YYYY-MM
    totalSalesAmount: float
    totalOrders: int


class DerivedOrderStats(BaseModel):
    months: int
    totalAmount: float
    totalOrders: int
    avgOrderValue: float
    recencyDays: Optional[float] = None
    frequencyPerMonth: Optional[float] = None
    monetaryValue: Optional[float] = None


class ForecastRequest(BaseModel):
    customer: CustomerProfile
    orders: List[OrderInput]
    salesSummaries: List[SalesSummaryInput] = Field(default_factory=list)
    stats: DerivedOrderStats
    forecastMonths: int = Field(default=3, ge=1, le=12)


class ForecastPoint(BaseModel):
    period: str
    amount: float


class ForecastResponse(BaseModel):
    history: List[ForecastPoint]
    forecast: List[ForecastPoint]
    model: str
    confidence: float


class RecommendationContext(BaseModel):
    inventory: Optional[dict[str, int]] = None
    avgSellingPrice: Optional[float] = None


class ProductCatalogEntry(BaseModel):
    id: str
    sku: str
    name: str
    category: Optional[str] = None
    unitPrice: float
    description: Optional[str] = None
    unit: Optional[str] = None
    isActive: bool = True


class RecommendationRequest(BaseModel):
    customer: CustomerProfile
    customerOrders: List[OrderInput]
    peerOrders: List[OrderInput]
    catalog: List[ProductCatalogEntry]
    context: RecommendationContext = Field(default_factory=RecommendationContext)
    limit: int = Field(default=10, ge=1, le=25)


class RecommendationItem(BaseModel):
    productId: str
    sku: str
    name: str
    category: Optional[str]
    unitPrice: float
    reason: str
    score: float


class RecommendationResponse(BaseModel):
    data: List[RecommendationItem]
    model: str

