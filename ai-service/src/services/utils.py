from __future__ import annotations

from datetime import datetime
from math import cos, pi, sin
from typing import Iterable, List


def month_key(date: datetime) -> str:
    return f"{date.year}-{date.month:02d}"


def add_months(date: datetime, months: int) -> datetime:
    year = date.year + (date.month - 1 + months) // 12
    month = (date.month - 1 + months) % 12 + 1
    return date.replace(year=year, month=month, day=1)


def month_position(period: str) -> int:
    year, month = period.split("-")
    return int(year) * 12 + int(month)


def seasonal_features(period: str) -> tuple[float, float]:
    _, month = period.split("-")
    month_num = int(month)
    angle = 2 * pi * (month_num / 12)
    return sin(angle), cos(angle)


def normalize(values: Iterable[float]) -> List[float]:
    vals = list(values)
    if not vals:
        return []
    min_v = min(vals)
    max_v = max(vals)
    if min_v == max_v:
        return [1.0 for _ in vals]
    return [(v - min_v) / (max_v - min_v) for v in vals]

