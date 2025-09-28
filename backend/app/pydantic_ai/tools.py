from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic_ai.toolsets.function import FunctionToolset

toolset: FunctionToolset[None] = FunctionToolset()


@toolset.tool
def get_stock_price(stock_symbol: str) -> dict[str, Any]:
    mock_stock_data = {
        "AAPL": {
            "symbol": "AAPL",
            "company_name": "Apple Inc.",
            "current_price": 173.50,
            "change": 2.35,
            "change_percent": 1.37,
            "volume": 52_436_789,
            "market_cap": "2.73T",
            "pe_ratio": 28.5,
            "fifty_two_week_high": 198.23,
            "fifty_two_week_low": 124.17,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
    }

    return mock_stock_data.get(stock_symbol.upper(), mock_stock_data["AAPL"])


__all__ = ["toolset"]

@toolset.tool
def get_econ_data(country: Literal["us", "vn"]) -> list[dict[str, Any]]:
    """Return macro-economic indicators for the requested country."""

    records = {
        "us": [
            {
                "country": "us",
                "indicator": "gdp",
                "period": "2023",
                "value": 27_360.0,
                "unit": "USD Billions",
            },
            {
                "country": "us",
                "indicator": "inflation_rate",
                "period": "2023",
                "value": 4.1,
                "unit": "percent",
            },
            {
                "country": "us",
                "indicator": "unemployment_rate",
                "period": "2023",
                "value": 3.7,
                "unit": "percent",
            },
        ],
        "vn": [
            {
                "country": "vn",
                "indicator": "gdp",
                "period": "2023",
                "value": 430.0,
                "unit": "USD Billions",
            },
            {
                "country": "vn",
                "indicator": "inflation_rate",
                "period": "2023",
                "value": 3.2,
                "unit": "percent",
            },
            {
                "country": "vn",
                "indicator": "unemployment_rate",
                "period": "2023",
                "value": 2.3,
                "unit": "percent",
            },
        ],
    }

    return records[country]
