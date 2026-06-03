import warnings
warnings.filterwarnings('ignore')

from utils.llm_factory import LLMFactory
from state.state import AgentState
import json
import os
import pandas as pd
from utils.docker_executor import execute_sandbox_code

def run_xai_agent(state: AgentState) -> dict:
    state["current_active_agent"] = "XAI Agent"
    state["agent_logs"].append("XAI Auditor: Initiating model interpretability analysis.")

    model_path = state.get("model_path")
    data_profile = state.get("data_profile", {})
    target_col = state.get("target_column", "target")
    engineered_path = "data/engineered/engineered_data.csv"

    if not model_path:
        state["agent_logs"].append("XAI Auditor: Error - No model path provided.")
        return {
            "execution_error": "No model path available for XAI Agent.",
            "agent_logs": state["agent_logs"]
        }

    # ── Step 1: Build Dynamic Exclusion List ─────────────────────────────
    exclusion_list = [target_col]

    # From Privacy Shield state
    masked_columns = state.get("masked_pii_columns", [])
    exclusion_list += masked_columns

    # Scan CSV for REDACTED values dynamically
    try:
        df_check = pd.read_csv(engineered_path, nrows=5)
        redacted_cols = [
            col for col in df_check.columns
            if df_check[col].astype(str).str.contains(
                "REDACTED", case=False, na=False
            ).any()
        ]
        exclusion_list += redacted_cols
    except Exception:
        pass

    exclusion_list = list(set(exclusion_list))
    # ─────────────────────────────────────────────────────────────────────

    # ── Step 2: Clean CSV BEFORE LLM call ────────────────────────────────
    # This guarantees LLM generated code cannot access PII columns
    try:
        df = pd.read_csv(engineered_path)

        cols_to_drop = [
            col for col in df.columns
            if col in exclusion_list
            or any(ex.lower() in col.lower() for ex in exclusion_list)
            or df[col].astype(str).str.contains(
                "REDACTED", case=False, na=False
            ).any()
        ]

        df.drop(columns=cols_to_drop, inplace=True, errors='ignore')

        # Keep only numeric columns
        df = df.select_dtypes(include=['float64', 'int64', 'float32', 'int32'])

        # Save cleaned CSV back
        df.to_csv(engineered_path, index=False)

        clean_feature_cols = df.columns.tolist()

    except Exception as e:
        state["agent_logs"].append(f"XAI Auditor: CSV cleaning warning - {str(e)}")
        clean_feature_cols = []
    # ─────────────────────────────────────────────────────────────────────

    prompt = f"""
You are the XAI (Explainable AI) Auditor for SyndicateML.
Extract feature importance from a trained scikit-learn model.

Model path: '{model_path}'
Engineered data path: '{engineered_path}'
Available feature columns: {clean_feature_cols}

STRICT RULES:
1. Use ONLY these columns as features: {clean_feature_cols}
2. Do NOT add any other columns.
3. Normalize all importance values to sum exactly 1.0.

Write a Python script that:
1. import warnings; warnings.filterwarnings('ignore')
2. import pandas as pd, numpy as np, joblib, json, os
3. Loads model from '{model_path}' using joblib.
4. Loads dataset from '{engineered_path}'.
5. Uses ONLY these feature columns: {clean_feature_cols}
6. Extracts importance:
   - Tree models: .feature_importances_
   - Linear models: abs(.coef_).flatten()
   - Fallback: equal weight 1/n
7. Normalizes to sum 1.0.
8. Saves to 'data/engineered/xai_report.json' as:
   {{"feature_name": float}}
9. Creates directories if missing.
10. NO markdown — ONLY executable Python code.
"""

    try:
        llm = LLMFactory.get_large_model()

        response = None
        for attempt in range(2):
            try:
                response = llm.invoke(prompt)
                break
            except Exception as e:
                if attempt == 0:
                    continue
                raise e

        code = response.content.replace("```python", "").replace("```", "").strip()
        cost = len(prompt) * 0.000002 + len(code) * 0.000006

        sandbox_state = {
            "generated_code": code,
            "current_active_agent": "XAI Agent",
            "retry_count": 0
        }
        result = execute_sandbox_code(sandbox_state)

        if result.get("execution_error"):
            return {
                "execution_error": result["execution_error"],
                "agent_logs": state["agent_logs"] + result.get("agent_logs", []),
                "total_token_cost": state.get("total_token_cost", 0.0) + cost
            }

        xai_path = "data/engineered/xai_report.json"
        if not os.path.exists(xai_path):
            return {
                "execution_error": "XAI report file not generated.",
                "agent_logs": state["agent_logs"] + ["XAI Auditor: Report file missing."],
                "total_token_cost": state.get("total_token_cost", 0.0) + cost
            }

        with open(xai_path, "r") as f:
            xai_report = json.load(f)

        # ── Step 3: Final Python Safety Net ──────────────────────────────
        cleaned_report = {}
        for k, v in xai_report.items():
            if k not in clean_feature_cols:
                continue
            if k in exclusion_list:
                continue
            try:
                cleaned_report[k] = float(v)
            except (ValueError, TypeError):
                continue

        # Re-normalize
        total = sum(cleaned_report.values())
        if total > 0:
            cleaned_report = {
                k: round(v / total, 6)
                for k, v in cleaned_report.items()
            }

        # Sort descending
        cleaned_report = dict(
            sorted(cleaned_report.items(), key=lambda x: x[1], reverse=True)
        )

        # Save final clean report
        with open(xai_path, "w") as f:
            json.dump(cleaned_report, f, indent=2)
        # ─────────────────────────────────────────────────────────────────

        top_feature = list(cleaned_report.keys())[0] if cleaned_report else "N/A"
        top_value = round(list(cleaned_report.values())[0] * 100, 2) if cleaned_report else 0

        return {
            "current_active_agent": "XAI Agent Done",
            "xai_report": cleaned_report,
            "agent_logs": state["agent_logs"] + [
                "XAI Audit Complete: Model decision factors extracted successfully.",
                f"XAI Auditor: Top driver → {top_feature} ({top_value}%)"
            ],
            "total_token_cost": state.get("total_token_cost", 0.0) + cost,
            "execution_error": None
        }

    except Exception as e:
        return {
            "execution_error": str(e),
            "agent_logs": state["agent_logs"] + [f"XAI Auditor: Error - {str(e)}"]
        }