import operator
from typing import Annotated, TypedDict, List, Optional, Any

class AgentState(TypedDict):
    dataset_metadata: dict
    data_profile: dict
    agent_logs: Annotated[List[str], operator.add]
    privacy_masking_active: bool
    total_token_cost: float
    current_active_agent: Optional[str]
    dataset_path: Optional[str]
    engineered_dataset_path: Optional[str]
    generated_code: Optional[str]
    execution_error: Optional[str]
    retry_count: int
    model_metrics: Optional[dict]
    model_path: Optional[str]
    finops_approved: Optional[bool]
    xai_report: Optional[dict]
    deployment_status: Optional[bool]
    human_approval_required: Optional[bool]
    target_column: Optional[str]
    masked_pii_columns: list
    model_file_base64: Optional[str]
