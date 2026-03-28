import pandas as pd
import numpy as np
import os

def generate_demo_data():
    """
    Generates tailored datasets for SyndicateML Phase 8 demonstrations.
    """
    output_dir = "demo_data"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🚀 Generating SyndicateML Demo Datasets...")

    # 1. Clean Housing Data (>90% Accuracy Target - Auto-Deployment Demo)
    # Strong correlation: Size and Location vs Price
    n_samples = 1000
    sqft = np.random.normal(2000, 500, n_samples)
    bedrooms = (sqft / 600 + np.random.normal(0, 0.5, n_samples)).astype(int).clip(1, 5)
    location_score = np.random.randint(1, 10, n_samples)
    
    # Mathematical Price: Price = 150*sqft + 10000*location + noise
    price = (150 * sqft) + (10000 * location_score) + np.random.normal(0, 5000, n_samples)
    
    clean_df = pd.DataFrame({
        'square_feet': sqft,
        'bedrooms': bedrooms,
        'location_score': location_score,
        'owner_name': ['REDACTED_NAME_' + str(i) for i in range(n_samples)], # PII for Privacy Shield
        'owner_email': ['test' + str(i) + '@example.com' for i in range(n_samples)], # PII for Privacy Shield
        'target_price': price
    })
    
    clean_path = os.path.join(output_dir, "1_clean_housing_data.csv")
    clean_df.to_csv(clean_path, index=False)
    print(f"✅ Created: {clean_path} (High correlation, contains PII)")

    # 2. Noisy Financial Data (Low Accuracy Target - HITL Triage Demo)
    # Random variables with weak/no correlation to target
    n_samples_noisy = 800
    market_volatility = np.random.uniform(0, 1, n_samples_noisy)
    sentiment_index = np.random.normal(0, 1, n_samples_noisy)
    random_noise = np.random.uniform(0, 100, n_samples_noisy)
    
    # Target is mostly random noise
    stock_return = (0.05 * sentiment_index) + np.random.normal(0, 2, n_samples_noisy)
    
    # Add heavy missing values
    noisy_df = pd.DataFrame({
        'market_volatility': market_volatility,
        'sentiment_index': sentiment_index,
        'random_noise_feature': random_noise,
        'stock_return': stock_return
    })
    
    # Induce 30% missing values in volatility
    noisy_df.loc[noisy_df.sample(frac=0.3).index, 'market_volatility'] = np.nan
    
    noisy_path = os.path.join(output_dir, "2_noisy_financial_data.csv")
    noisy_df.to_csv(noisy_path, index=False)
    print(f"✅ Created: {noisy_path} (High noise, mission values, low signal)")
    
    print("\n✨ Demo datasets are ready in /demo_data")

if __name__ == "__main__":
    generate_demo_data()
