import pandas as pd
import numpy as np

# Simulate LazyPredict leaderboard
data = {
    'Adjusted R-Squared': [0.996660, 0.996656, 0.996654],
    'R-Squared': [0.996660, 0.996656, 0.996654],
    'RMSE': [0.01, 0.02, 0.03],
    'Time Taken': [0.07, 0.03, 0.04]
}
# Index is model names
models = pd.DataFrame(data, index=['HuberRegressor', 'Ridge', 'RidgeCV'])

print("Leaderboard Index (Model Names):", models.index.tolist())
print("Leaderboard Columns:", models.columns.tolist())

# The common mistake logic
try:
    print("\nAttempting bad logic: float(row)")
    leaderboard_bad = [{"model_name": name, "score": float(row)} for name, row in models.iterrows()]
    print("Bad logic worked (unexpected)")
except TypeError as e:
    print(f"Bad logic failed as expected: {e}")

# The fixed logic
print("\nAttempting fixed logic: float(row.iloc[0])")
leaderboard_good = [{"model_name": name, "score": float(row.iloc[0])} for name, row in models.iterrows()]
print("Fixed logic result:", leaderboard_good)

# Verify single metric extraction
print("\nVerifying single metric extraction")
best_r2 = float(models.iloc[0, 0]) # First row, first column
print("Best R2:", best_r2)
