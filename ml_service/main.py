from fastapi import FastAPI, Query
from typing import List
import pandas as pd
from model import load_data, train_and_forecast, get_historical, WASTE_TYPES

app = FastAPI()
df = load_data()

districts = df['district'].unique().tolist()

def get_overall_forecast():
    forecasts = [train_and_forecast(df, d) for d in districts]
    total = sum(f['total_waste_tonnes'] for f in forecasts)
    comp_tonnes = {wt: sum(f['composition_tonnes'][wt] for f in forecasts) for wt in WASTE_TYPES}
    comp_percent = {wt: round(100 * comp_tonnes[wt] / total, 1) if total > 0 else 0 for wt in WASTE_TYPES}
    return {
        'total_waste_tonnes': total,
        'composition_tonnes': comp_tonnes,
        'composition_percent': comp_percent,
        'districts': [
            {'district': d, **f} for d, f in zip(districts, forecasts)
        ]
    }

@app.get('/forecast/next-day')
def forecast_next_day():
    """Forecast for tomorrow for all districts and overall."""
    return get_overall_forecast()

@app.get('/forecast/history')
def forecast_history(district: str = Query(None)):
    """Return historical data for charting."""
    if district and district in districts:
        return get_historical(df, district)
    # Return all
    return df.to_dict(orient='records')

@app.get('/forecast/details')
def forecast_details(date: str):
    """Return breakdown for a selected day (per district, per site)."""
    day_df = df[df['date'] == date]
    if day_df.empty:
        return {'error': 'No data for this date'}
    return day_df.to_dict(orient='records') 