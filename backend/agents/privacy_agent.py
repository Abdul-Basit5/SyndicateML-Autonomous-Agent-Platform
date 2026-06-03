import os
import pandas as pd
from pydantic import BaseModel, Field
from langchain_mistralai import ChatMistralAI
from utils.llm_factory import LLMFactory
from typing import List

from state.state import AgentState

class PIIColumn(BaseModel):
    column_name: str = Field(description="Name of the column containing PII")
    masking_type: str = Field(description="Type of masking required (e.g., [REDACTED_NAME], [REDACTED_EMAIL])")

class PIIDetectionResult(BaseModel):
    sensitive_columns: List[PIIColumn] = Field(description="List of columns containing sensitive PII data to mask")

def run_privacy_shield(state: AgentState) -> dict:
    dataset_path = state.get("dataset_path")
    if not dataset_path or not os.path.exists(dataset_path):
        return {"agent_logs": ["Privacy Shield: No dataset found at path."]}

    current_cost = state.get("total_token_cost", 0.0)

    try:
        df = pd.read_csv(dataset_path)
    except Exception as e:
        return {"agent_logs": ["[Privacy Shield] → Error reading dataset."]}

    headers = df.columns.tolist()
    sample_data = df.head(3).to_dict(orient="records")

    prompt = f"""
    You are the SyndicateML Privacy Shield Agent. Your job is to strictly analyze dataset columns and a small data sample to identify Personally Identifiable Information (PII) such as Names, Email Addresses, Phone Numbers, SSNs, or physical addresses.
    
    Dataset Columns: {headers}
    Sample Data (First 3 rows):
    {sample_data}
    
    Identify which columns contain PII and suggest a masking type string (e.g. '[REDACTED_NAME]', '[REDACTED_PHONE]').
    If no columns contain PII, return an empty list.
    """

    # Use centralized LLM factory
    llm = LLMFactory.get_large_model()
    structured_llm = llm.with_structured_output(PIIDetectionResult)
    
    try:
        response = None
        retry_count = 0
        for attempt in range(2):
            try:
                response = structured_llm.invoke(prompt)
                break
            except Exception as e:
                retry_count += 1
                if attempt == 0:
                    continue
                raise e
        
        masked_columns = []
        for pii in response.sensitive_columns:
            if pii.column_name in df.columns:
                df[pii.column_name] = pii.masking_type
                masked_columns.append(pii.column_name)
        
        if masked_columns:
            sanitized_dir = "data/sanitized"
            os.makedirs(sanitized_dir, exist_ok=True)
            filename = os.path.basename(dataset_path)
            new_path = os.path.join(sanitized_dir, f"masked_{filename}")
            df.to_csv(new_path, index=False)
            
            data_prof = state.get("data_profile", {})
            data_prof["pii_masked_count"] = len(masked_columns)
            return {
                "dataset_path": new_path,
                "data_profile": data_prof,
                "privacy_masking_active": True,
                "agent_logs": [f"[Privacy Shield] → Masked: {', '.join(masked_columns) if masked_columns else 'None'}"],
                "total_token_cost": current_cost + 0.002,
                "current_active_agent": "Privacy Shield",
                "retry_count": retry_count,
                "masked_pii_columns": masked_columns
            }
        else:
            data_prof = state.get("data_profile", {})
            data_prof["pii_masked_count"] = 0
            return {
                "data_profile": data_prof,
                "privacy_masking_active": False,
                "agent_logs": ["[Privacy Shield] → Masking complete. No PII detected."],
                "total_token_cost": current_cost + 0.002,
                "current_active_agent": "Privacy Shield",
                "retry_count": retry_count
            }
            
    except Exception as e:
        return {"agent_logs": [f"Privacy Shield: Error during Mistral AI analysis - {str(e)}"]}
