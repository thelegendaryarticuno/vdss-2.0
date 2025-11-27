from __future__ import annotations

from datetime import datetime
from typing import List

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from ..models import ForecastPoint, ForecastRequest, ForecastResponse
from . import utils


class SalesForecaster:
    """Hybrid statistical forecaster that combines regression + seasonality."""

    MIN_POINTS = 3

    def forecast(self, payload: ForecastRequest) -> ForecastResponse:
        series = self._build_series(payload)

        if len(series) < 2:
            forecast = self._repeat_or_zero(series, payload.forecastMonths)
            return ForecastResponse(
                history=series,
                forecast=forecast,
                model="naive-average",
                confidence=0.35,
            )

        df = pd.DataFrame([point.model_dump() for point in series])
        df["index"] = np.arange(len(df))
        seasonal = [utils.seasonal_features(period) for period in df["period"]]
        df["month_sin"] = [s for s, _ in seasonal]
        df["month_cos"] = [c for _, c in seasonal]

        feature_cols = ["index", "month_sin", "month_cos"]
        X = df[feature_cols].values
        y = df["amount"].values

        if len(series) < self.MIN_POINTS:
            forecast_values = self._moving_average(y, payload.forecastMonths)
            model_name = "moving-average"
            confidence = 0.45
        else:
            model = LinearRegression()
            model.fit(X, y)

            last_period = series[-1].period
            future_points = []
            last_index = df["index"].iloc[-1]

            for step in range(1, payload.forecastMonths + 1):
                period_date = utils.add_months(_period_to_date(last_period), step)
                period = utils.month_key(period_date)
                idx = last_index + step
                sin_feat, cos_feat = utils.seasonal_features(period)
                features = np.array([[idx, sin_feat, cos_feat]])
                prediction = float(model.predict(features)[0])
                future_points.append((period, max(0.0, prediction)))

            residuals = y - model.predict(X)
            mae = float(np.abs(residuals).mean()) if len(residuals) else 0.0
            avg_y = float(np.mean(y)) if len(y) else 1.0
            confidence = float(
                max(0.4, min(0.95, 1 - mae / (avg_y + 1e-6)))
            )

            forecast_values = [
                ForecastPoint(period=period, amount=round(value, 2))
                for period, value in future_points
            ]
            model_name = "linear-regression-seasonal"

            return ForecastResponse(
                history=series,
                forecast=forecast_values,
                model=model_name,
                confidence=confidence,
            )

        forecast_points = [
            ForecastPoint(
                period=utils.month_key(utils.add_months(_period_to_date(series[-1].period), idx + 1)),
                amount=round(value, 2),
            )
            for idx, value in enumerate(forecast_values)
        ]

        return ForecastResponse(
            history=series,
            forecast=forecast_points,
            model=model_name,
            confidence=confidence,
        )

    def _build_series(self, payload: ForecastRequest) -> List[ForecastPoint]:
        bucket: dict[str, float] = {}

        for order in payload.orders:
            period = utils.month_key(order.orderDate)
            bucket[period] = bucket.get(period, 0.0) + float(order.totalAmount)

        for summary in payload.salesSummaries:
            bucket[summary.period] = max(
                bucket.get(summary.period, 0.0),
                float(summary.totalSalesAmount),
            )

        periods: List[str] = []
        if payload.stats.months > 0:
            now = datetime.utcnow().replace(day=1)
            start = utils.add_months(now, -payload.stats.months + 1)
            periods = [utils.month_key(utils.add_months(start, i)) for i in range(payload.stats.months)]
        else:
            periods = sorted(bucket.keys())

        return [
            ForecastPoint(period=period, amount=round(bucket.get(period, 0.0), 2))
            for period in periods
        ]

    def _moving_average(self, values: np.ndarray, horizon: int) -> List[float]:
        if not len(values):
            return [0.0] * horizon
        window = values[-3:]
        avg = float(np.mean(window))
        return [avg for _ in range(horizon)]

    def _repeat_or_zero(self, series: List[ForecastPoint], horizon: int) -> List[ForecastPoint]:
        last_amount = series[-1].amount if series else 0.0
        last_period = series[-1].period if series else utils.month_key(datetime.utcnow())
        return [
            ForecastPoint(
                period=utils.month_key(utils.add_months(_period_to_date(last_period), idx + 1)),
                amount=round(last_amount, 2),
            )
            for idx in range(horizon)
        ]


def _period_to_date(period: str) -> datetime:
    year, month = map(int, period.split("-"))
    return datetime(year, month, 1)

