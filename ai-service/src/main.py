from fastapi import FastAPI, HTTPException

from .models import (
    ForecastRequest,
    ForecastResponse,
    RecommendationRequest,
    RecommendationResponse,
)
from .services.forecast import SalesForecaster
from .services.recommendations import RecommendationEngine

app = FastAPI(
    title="AI Service",
    version="0.1.0",
    description="Predictive services for Truethat backend",
)

forecaster = SalesForecaster()
recommender = RecommendationEngine()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/forecast", response_model=ForecastResponse)
async def forecast(payload: ForecastRequest) -> ForecastResponse:
    try:
        return forecaster.forecast(payload)
    except Exception as exc:  # pragma: no cover - surfaced to caller
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/recommendations", response_model=RecommendationResponse)
async def recommendations(payload: RecommendationRequest) -> RecommendationResponse:
    try:
        return recommender.recommend(payload)
    except Exception as exc:  # pragma: no cover - surfaced to caller
        raise HTTPException(status_code=400, detail=str(exc))

