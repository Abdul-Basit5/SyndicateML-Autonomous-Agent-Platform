import os
from pydantic import BaseModel, Field
from langchain_mistralai import ChatMistralAI
from utils.llm_factory import LLMFactory
from state.state import AgentState

class GeneratedCode(BaseModel):
    python_code: str = Field(description="Pure, executable python script using pandas and scikit-learn.")
    explanation: str = Field(description="Brief explanation of the engineering steps chosen.")

def run_feature_engineer(state: AgentState) -> dict:
    data_profile = state.get("data_profile", {})
    dataset_path = state.get("dataset_path")
    execution_error = state.get("execution_error")
    retry_count = state.get("retry_count", 0)
    current_cost = state.get("total_token_cost", 0.0)
    
    if not data_profile or not dataset_path:
        return {"agent_logs": ["Feature Engineer: Data profile or path missing."]}
        
    prompt = f"""
    You are the Mistral 675B model, an elite Senior Data Engineer specialized in production-grade MLOps. 
    Your reasoning is elite and grounded in mathematical rigor. Do not write boilerplate; write optimized, high-performance Python code using pandas and scikit-learn.
    
    Perform Advanced Feature Engineering (e.g., interaction terms, polynomial features, and complex scaling). 
    Provide a mathematical justification in the explanation for each engineering step chosen, ensuring it specifically targets predictive performance for this dataset.
    
    Task: Write a robust, self-healing Python script that:
    1. Start by importing pandas as pd and numpy as np. Load the CSV file from `/app/{dataset_path.replace(os.sep, '/')}`.
    2. The dataframe has already been dynamically sanitized. Explicitly drop any non-numeric columns to enforce mathematical compliance: `df = df.select_dtypes(include=["number"])`. Explicitly DROP the column 'random_noise_feature' completely if it exists, as it provides no predictive value.
    3. Drop any rows where the target variable ('{state.get('target_column')}') has missing values (NaN/null).
    4. Do NOT drop rows for missing feature values. Instead, apply an imputer strategy (e.g., `SimpleImputer(strategy='median')` or `'mean'`) to fill missing values in numeric columns such as 'market_volatility'.
    5. Encode categorical variables using Label Encoding or One-Hot Encoding where appropriate.
    6. As the absolute final step before saving, enforce strict type checking: `df = df.select_dtypes(include=['number'])` to guarantee no text columns leak into the XAI auditor.
    7. Save the transformed dataframe to `/app/data/engineered/engineered_data.csv`. Ensure the parent directory `/app/data/engineered/` is created.
    
    Dataset Profile:
    {data_profile}
    """
    
    if execution_error:
        prompt += f"""
        CRITICAL ERROR FROM PREVIOUS RUN:
        The previous code failed with the following traceback:
        {execution_error}
        
        Analyze the exact traceback and strictly fix the errors in your new Python script. 
        """
        
    llm = LLMFactory.get_large_model()
    structured_llm = llm.with_structured_output(GeneratedCode)
    
    response = None
    error_occurred = False
    
    for attempt in range(2):
        try:
            response = structured_llm.invoke(prompt)
            break
        except Exception as e:
            error_occurred = True
            if attempt == 0:
                # Silently retry once at the agent level
                continue
            return {
                "execution_error": str(e),
                "agent_logs": [f"Feature Engineer: Mistral AI code generation error - {str(e)}"]
            }
        
    return {
        "generated_code": response.python_code,
        "agent_logs": ["[Feature Engineer] → Applied normalization & imputation"],
        "total_token_cost": current_cost + 0.005,
        "current_active_agent": "Feature Engineer",
        "retry_count": retry_count
    }
