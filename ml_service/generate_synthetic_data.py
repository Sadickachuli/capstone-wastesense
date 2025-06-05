import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)

waste_types = ['plastic', 'metal', 'organic', 'paper', 'glass']
districts = ['Ablekuma North', 'Ayawaso West']
dumping_sites = ['North Dumping Site', 'West Dumping Site']

records = []
start_date = datetime.now() - timedelta(days=90)
for day in range(91):
    date = (start_date + timedelta(days=day)).date()
    for district in districts:
        site = dumping_sites[0] if district == 'Ablekuma North' else dumping_sites[1]
        total_waste = np.random.normal(25 if district == 'Ablekuma North' else 20, 3)
        composition = np.random.dirichlet(np.ones(len(waste_types)), 1)[0]
        waste_breakdown = {wt: round(total_waste * frac, 2) for wt, frac in zip(waste_types, composition)}
        record = {
            'date': date,
            'district': district,
            'dumping_site': site,
            'total_waste_tonnes': round(total_waste, 2),
        }
        for wt in waste_types:
            record[f'{wt}_tonnes'] = waste_breakdown[wt]
            record[f'{wt}_percent'] = round(100 * waste_breakdown[wt] / total_waste, 1)
        records.append(record)
df = pd.DataFrame(records)
df.to_csv('synthetic_waste_data.csv', index=False)
print('Synthetic data generated: synthetic_waste_data.csv') 