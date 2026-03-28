from langchain_mistralai import ChatMistralAI
from utils.llm_factory import LLMFactory
from state.state import AgentState

def run_ml_architect(state: AgentState) -> dict:
    state["current_active_agent"] = "ML Architect"
    state["agent_logs"].append("ML Architect: Analyzing engineered data for model training.")
    
    engineered_path = state.get("engineered_dataset_path") or state.get("dataset_path")
    data_profile = state.get("data_profile", {})
    
    if not engineered_path:
        state["execution_error"] = "No dataset path available for ML Architect."
        state["agent_logs"].append("ML Architect: Error - No dataset path provided.")
        return state
        
    prompt = f"""
You are the Mistral 675B model, an elite ML Architect for SyndicateML. Your reasoning is elite and you are obsessed with model performance.
Your task is to write a production-grade, optimized Python script.

CRITICAL: You MUST ONLY use Machine Learning algorithms available in 'scikit-learn' (e.g., RandomForestRegressor). You are STRICTLY FORBIDDEN from using 'xgboost' or 'lightgbm'. The execution sandbox does not have these libraries installed.

Dataset Location: '/app/data/engineered/engineered_data.csv'
Data Profile: {data_profile}

Write a robust script that:
1. Load the CSV data using pandas. CRITICAL: This is the engineered dataset. DO NOT validate its columns, and DO NOT hardcode any column names. Right after loading `df`, you MUST EXACTLY inject this code:
```python
import numpy as np
import warnings
warnings.filterwarnings('ignore')
# Handle infinities
df.replace([np.inf, -np.inf], np.nan, inplace=True)
df.fillna(df.mean(), inplace=True)
print("Handled invalid values and missing data.")

# Dynamically fetch target column from state
target_col = "{state.get('target_column')}"

# If somehow not in state, fallback to the last column
if target_col == "None" or target_col not in df.columns:
    target_col = df.columns[-1]

# Safely split features and target
y = df[target_col]
X = df.drop(columns=[target_col])

# Enforce PII & Text Drop
X = X.select_dtypes(include=['number'])
```
2. You MUST explicitly patch any remaining missing values in X (e.g., `X = X.fillna(X.median())` or `SimpleImputer`).
3. Splits the data into Train/Test sets (80/20) with a fixed random seed for reproducibility using the safe `X` and `y`.
4. Perform an 'Elite Model Competition': Compare different models from scikit-learn using 5-fold cross-validation.
5. Select the absolute best performer based on precision-recall curves or R2 scores.
6. Train the best model on the training set, then calculate Mean Absolute Error (MAE) and other relevant metrics.
8. Save the evaluation metrics as a JSON dictionary to '/app/data/engineered/metrics.json'.
   It MUST contain:
   - 'accuracy' or 'r2_score' (max 1.0)
   - 'mae'
   - 'leaderboard' (an array of dictionaries, each with 'model_name' and 'score') representing all evaluated models and their CV scores.
8. Saves the winning trained model using joblib to '/app/data/models/trained_model.pkl'.

Ensure the script:
- Creates required directories if they don't exist.
- Contains NO markdown formatting, JUST production-ready, highly-commented Python code.
"""
    try:
        import os
        llm = LLMFactory.get_large_model()
        
        response = None
        error_occurred = False
        for attempt in range(2):
            try:
                response = llm.invoke(prompt)
                break
            except Exception as e:
                error_occurred = True
                if attempt == 0:
                    continue
                raise e
        
        # Clean up output
        code = response.content.replace("```python", "").replace("```", "").strip()
        code = "import warnings; warnings.simplefilter(action='ignore', category=FutureWarning); warnings.simplefilter(action='ignore', category=UserWarning)\n" + code
        
        # Add a tiny bit of token estimation
        cost = len(prompt) * 0.000002 + len(code) * 0.000006
        
        # Read engineered dataset to capture engineered_features_count optionally?
        # Actually this logic happens BEFORE code execution.
        # Wait, the prompt says "Update the backend state object to explicitly capture total_rows and engineered_features_count".
        # Let's modify the prompt to save data_profile.json or we can just count it after execution.
        # It's better to update it after execution. But in ml_architect we don't execute it.
        # Actually I can just add it to ml_architect_agent by adding code to parse dataframe if it exists?
        # No, engineered_data.csv is created BEFORE ml_architect is called? Let's check.
        import os
        if os.path.exists('/app/data/engineered/engineered_data.csv'):
            import pandas as pd
            try:
                df_eng = pd.read_csv('/app/data/engineered/engineered_data.csv')
                state.setdefault("data_profile", {})["engineered_features_count"] = len(df_eng.columns)
            except:
                pass
        
        return {
            "current_active_agent": "ML Architect Docker Executor",
            "generated_code": code,
            "agent_logs": [f"ML Architect: Generated model training script {'(Retried)' if error_occurred else ''} and routing to sandbox for execution."],
            "total_token_cost": state.get("total_token_cost", 0.0) + cost,
            "execution_error": None  # Reset error state for new execution
        }
    except Exception as e:
        return {
            "execution_error": str(e),
            "agent_logs": [f"ML Architect: Error during code generation - {str(e)}"]
        }
