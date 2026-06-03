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
Your task is to write a production-grade, optimized Python script for automated machine learning.

Dataset Location: '/app/data/engineered/engineered_data.csv'
Data Profile: {data_profile}

Write a robust script that follows this architecture:

1. Data Loading & Target Selection:
   - Load the CSV.
   - Print `df.columns.tolist()` for clear debugging.
   - Detect Target:
     - Priority 1: Use '{state.get('target_column')}' (case-insensitive search).
     - Priority 2: Look for common target keywords: 'price', 'target', 'label', 'class', 'prediction'.
     - Priority 3: Default to the LAST column.
   - Task Detection: Determine if it's Classification (discrete targets) or Regression (continuous targets).

2. Preprocessing & Splitting:
   - Handle Infinities/NaNs.
   - High-Dimensionality Check: If features > 100, use PCA (n_components=0.95). 
     CRITICAL: `fit_transform()` returns a SINGLE value (the transformed array). DO NOT attempt to unpack it into multiple variables.
   - For Classification: Use LabelEncoder on Target. Compute class weights if imbalanced.
   - Split 80/20 with random_state=42.

3. Elite Model Competition (LazyPredict):
   - Use `LazyClassifier` for classification or `LazyRegressor` for regression.
   - CRITICAL: `clf.fit()` returns exactly TWO items: (models, predictions).
   - Sort models by 'Accuracy' (Classification) or 'R-Squared' (Regression).

4. Best Model Training & Evaluation:
   - CRITICAL: To retrain the best model, use a robust mapping from LazyPredict names to sklearn/xgboost/lightgbm/catboost classes.
   - Example Mapping: 'XGBRegressor' -> `xgb.XGBRegressor`, 'LGBMRegressor' -> `lightgbm.LGBMRegressor`, 'LassoCV' -> `sklearn.linear_model.LassoCV`.
   - Loop through the leaderboard and try to instantiate/train until one succeeds.
   - If Classification: Use the computed `class_weight` if available.
   - Calculate performance metrics:
     - Classification: Accuracy, Precision, Recall, F1, Confusion Matrix.
     - Regression: R-Squared, MAE, MSE, RMSE.

5. Production Artifacts (MUST EXACTLY FOLLOW THIS):
   - Save eval metrics to '/app/data/engineered/metrics.json'.
     - MUST contain: 'accuracy' (or 'r2_score'), 'mae', 'leaderboard' (array of {{'model_name', 'score'}}), and 'model_file_base64'.
     - CRITICAL: When building 'leaderboard' from the LazyPredict DataFrame (`models`), use:
       `leaderboard = [{{'model_name': str(idx), 'score': float(row.iloc[0])}} for idx, row in models.iterrows()]`
       NEVER pass a Series to `float()`. Cast all metrics to standard Python types.
   - Save the winning model using joblib to '/app/data/models/trained_model.pkl'.
   - Read the .pkl file in binary mode, encode to base64, and inject into the metrics.json.

Ensure the script:
- Creates required directories.
- Handles missing libraries or instantiation failures gracefully.
- Contains NO markdown formatting OUTSIDE the code block.
- OUTPUT ONLY the Python code inside a single ```python block.
- NO PREAMBLE. NO EXPLANATION. NO CONCLUSION.
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
        
        # Clean up output using a more robust regex to extract ONLY the code block if present
        import re
        code_match = re.search(r"```python\n(.*?)\n```", response.content, re.DOTALL)
        if not code_match:
            code_match = re.search(r"```\n(.*?)\n```", response.content, re.DOTALL)
        
        if code_match:
            code = code_match.group(1).strip()
        else:
            # Fallback: remove markdown markers manually and strip
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
