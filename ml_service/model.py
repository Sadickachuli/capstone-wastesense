import pandas as pd
from prophet import Prophet
from typing import Dict

WASTE_TYPES = ['plastic', 'metal', 'organic', 'paper', 'glass']

def load_data(path='synthetic_waste_data.csv'):
    return pd.read_csv(path, parse_dates=['date'])

def train_and_forecast(df: pd.DataFrame, district: str):
    results = {}
    df_district = df[df['district'] == district]
    # Forecast total waste
    m_total = Prophet()
    total_df = df_district[['date', 'total_waste_tonnes']].rename(columns={'date': 'ds', 'total_waste_tonnes': 'y'})
    m_total.fit(total_df)
    future = m_total.make_future_dataframe(periods=1)
    forecast_total = m_total.predict(future).iloc[-1]
    results['total_waste_tonnes'] = float(forecast_total['yhat'])
    # Forecast each waste type
    composition = {}
    for wt in WASTE_TYPES:
        m = Prophet()
        wt_df = df_district[['date', f'{wt}_tonnes']].rename(columns={'date': 'ds', f'{wt}_tonnes': 'y'})
        m.fit(wt_df)
        future = m.make_future_dataframe(periods=1)
        forecast = m.predict(future).iloc[-1]
        composition[wt] = float(forecast['yhat'])
    # Normalize to get percentages
    total = sum(composition.values())
    for wt in composition:
        composition[wt] = max(0, composition[wt])
    percent = {wt: round(100 * composition[wt] / total, 1) if total > 0 else 0 for wt in composition}
    results['composition_tonnes'] = composition
    results['composition_percent'] = percent
    return results

def get_historical(df: pd.DataFrame, district: str):
    df_district = df[df['district'] == district].copy()
    df_district['date'] = df_district['date'].astype(str)
    return df_district.to_dict(orient='records') 