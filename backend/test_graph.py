import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from agents.graph import syndicate_graph
from state.state import AgentState

def run_test():
    # Setup test file path
    test_file_path = "test.csv"
    if not os.path.exists(test_file_path):
        print(f"Test file not found at {test_file_path}")
        return
        
    initial_state = {
        "dataset_path": test_file_path,
        "dataset_metadata": {"filename": "test.csv"},
        "agent_logs": ["System: Starting local graph test."],
        "privacy_masking_active": False,
        "total_token_cost": 0.0,
        "current_active_agent": "None",
        "data_profile": {},
        "generated_code": None,
        "execution_error": None,
        "engineered_dataset_path": None,
        "retry_count": 0,
        "model_metrics": None,
        "model_path": None,
        "finops_approved": None,
        "xai_report": None,
        "deployment_status": False
    }
    
    print("Invoking graph...")
    try:
        final_state = syndicate_graph.invoke(initial_state)
        print("\n=== FINAL STATE ===")
        print(f"Data Profile: {final_state.get('data_profile')}")
        print(f"Engineered Code:\n{final_state.get('engineered_code')}")
        print(f"Execution Result:\n{final_state.get('execution_result')}")
        print(f"Engineered Dataset Path: {final_state.get('engineered_dataset_path')}")
        print("Agent Logs:")
        for log in final_state.get("agent_logs", []):
            print(log)
    except Exception as e:
        print(f"Error executing graph: {e}")

if __name__ == "__main__":
    if "MISTRAL_API_KEY" not in os.environ:
        print("WARNING: MISTRAL_API_KEY environment variable is missing!")
    run_test()
