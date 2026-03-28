import pandas as pd
from state.state import AgentState

def run_profiler(state: AgentState) -> dict:
    dataset_path = state.get("dataset_path")
    if not dataset_path:
        return {"agent_logs": ["Profiler: No dataset found."]}
        
    try:
        df = pd.read_csv(dataset_path)
    except Exception as e:
        return {"agent_logs": [f"Profiler: Error reading CSV - {str(e)}"]}
        
    num_cols = df.select_dtypes(include='number').columns.tolist()
    cat_cols = df.select_dtypes(exclude='number').columns.tolist()
    missing_vals = df.isnull().sum().to_dict()
    
    missing_vals = {k: v for k, v in missing_vals.items() if v > 0}
    missing_logs = list(missing_vals.keys())
    
    data_profile = state.get("data_profile", {})
    data_profile.update({
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "numerical_columns": num_cols,
        "categorical_columns": cat_cols,
        "missing_values": missing_vals
    })
    
    current_cost = state.get("total_token_cost", 0.0)
    
    log_msg = f"Profiler Activated: Analyzed {len(df)} rows. "
    if missing_logs:
        log_msg += f"Found missing values in {missing_logs}."
    else:
        log_msg = f"[Data Profiler] → Rows: {len(df)} | Missing: {missing_vals}"
        
    # Dynamic target detection
    target_keywords = ['target', 'price', 'label', 'class', 'outcome', 'churn', 'status', 'result']
    detected_target = None
    for col in df.columns:
        if col.lower() in target_keywords:
            detected_target = col
            break
            
    if not detected_target and len(df.columns) > 0:
        detected_target = df.columns[-1]
        
    log_msg += f" | Target Detected: {detected_target}"
        
    return {
        "data_profile": data_profile,
        "agent_logs": [log_msg],
        "total_token_cost": current_cost + 0.001,
        "current_active_agent": "Data Profiler",
        "target_column": detected_target
    }
