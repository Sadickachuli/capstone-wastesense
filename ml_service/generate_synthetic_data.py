import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

np.random.seed(42)

waste_types = ['plastic', 'metal', 'organic', 'paper', 'glass']
districts = ['Ablekuma North', 'Ayawaso West']
dumping_sites = ['North Dumping Site', 'West Dumping Site']

# Load existing data if present
csv_path = 'synthetic_waste_data.csv'
if os.path.exists(csv_path):
    df = pd.read_csv(csv_path, parse_dates=['date'])
else:
    df = pd.DataFrame()

# Determine the last date in the file
if not df.empty:
    last_date = df['date'].max()
    start_date = pd.to_datetime(last_date) + timedelta(days=1)
else:
    # If no data, start 90 days ago
    start_date = datetime.now() - timedelta(days=90)

# Only generate for today if not already present
new_date = datetime.now().date()
if not df.empty and (df['date'] == pd.Timestamp(new_date)).any():
    print(f"Data for {new_date} already exists. No new data added.")
else:
    records = []
    for district in districts:
        site = dumping_sites[0] if district == 'Ablekuma North' else dumping_sites[1]
        total_waste = np.random.normal(25 if district == 'Ablekuma North' else 20, 3)
        composition = np.random.dirichlet(np.ones(len(waste_types)), 1)[0]
        waste_breakdown = {wt: round(total_waste * frac, 2) for wt, frac in zip(waste_types, composition)}
        record = {
            'date': new_date,
            'district': district,
            'dumping_site': site,
            'total_waste_tonnes': round(total_waste, 2),
        }
        for wt in waste_types:
            record[f'{wt}_tonnes'] = waste_breakdown[wt]
            record[f'{wt}_percent'] = round(100 * waste_breakdown[wt] / total_waste, 1)
        records.append(record)
    new_df = pd.DataFrame(records)
    df = pd.concat([df, new_df], ignore_index=True)
    df.to_csv(csv_path, index=False)
    print(f"Appended new data for {new_date} to {csv_path}")

if __name__ == "__main__":
    pass  # Allows running as a script 