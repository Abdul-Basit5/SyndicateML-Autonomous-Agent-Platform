import docker
import os
import tempfile
import logging
import socket
from state.state import AgentState

logger = logging.getLogger("SyndicateML")

def get_host_path_for_mount(container_path: str) -> str:
    """
    Attempts to find the host source path for a given container mount point.
    Useful for Docker-in-Docker scenarios.
    """
    try:
        client = docker.from_env()
        hostname = socket.gethostname()
        container = client.containers.get(hostname)
        for mount in container.attrs.get('Mounts', []):
            if mount.get('Destination') == container_path:
                return mount.get('Source')
    except Exception as e:
        logger.warning(f"Could not dynamically discover host path for {container_path}: {e}")
    return None

def execute_sandbox_code(state: AgentState) -> dict:
    code = state.get("generated_code")
    retry_count = state.get("retry_count", 0)
    
    if not code:
        return {"agent_logs": ["Sandbox: No code to execute."]}
        
    # Standard paths inside the backend container
    container_data_dir = "/app/data"
    
    # Discovery logic for host paths
    host_project_path = os.getenv("HOST_PROJECT_PATH")
    
    # Try dynamic discovery first if we are likely in a container
    host_data_dir = get_host_path_for_mount(container_data_dir)
    
    if not host_data_dir:
        if host_project_path:
            # Fallback to env var
            host_data_dir = os.path.join(host_project_path, "backend", "data")
        else:
            # Fallback for local execution (outside docker)
            host_data_dir = os.path.abspath("data")

    # Volume mapping for the sandbox container
    # We only need the data volume now because we use 'python -c' for the script
    volumes = {
        host_data_dir: {'bind': '/app/data', 'mode': 'rw'}
    }
    
    active_agent = state.get("current_active_agent", "")
    is_architect = "Architect" in active_agent
    
    try:
        client = docker.from_env()
        # Use python -c to avoid script mounting issues
        # We wrap the code to ensure it can handle multi-line strings safely
        # Note: For very large scripts, this might hit shell limits, but for AI-gen code it's usually fine.
        container = client.containers.run(
            "sandbox-env",
            command=["python", "-c", code],
            volumes=volumes,
            remove=True, # Auto-remove sandbox after execution
            detach=False,
            stdout=True,
            stderr=True,
            working_dir="/app"
        )
        
        logs = container.decode('utf-8') if isinstance(container, bytes) else "Execution finished."
        
        # Format logs cleanly
        if is_architect:
            winning_model = "Unknown"
            model_file_base64 = None
            if os.path.exists("data/engineered/metrics.json"):
                import json
                try:
                    with open("data/engineered/metrics.json", "r") as f:
                        metrics_data = json.load(f)
                        if "leaderboard" in metrics_data and len(metrics_data["leaderboard"]) > 0:
                            winning_model = metrics_data["leaderboard"][0]["model_name"]
                        model_file_base64 = metrics_data.get("model_file_base64")
                except:
                    pass
            agent_log_output = f"[ML Architect] → Selected Winning Model: {winning_model}"
            return {
                "execution_error": None,
                "agent_logs": [agent_log_output],
                "engineered_dataset_path": state.get("engineered_dataset_path"),
                "current_active_agent": "ML Architect Done",
                "model_file_base64": model_file_base64
            }
        else:
            agent_log_output = f"[Sandbox] → Execution Output: {logs[:100].strip()}..."
            return {
                "execution_error": None,
                "agent_logs": [agent_log_output],
                "engineered_dataset_path": "data/engineered/engineered_data.csv",
                "current_active_agent": "Feature Engineer Done"
            }
    except docker.errors.ContainerError as e:
        error_log = e.stderr.decode('utf-8') if e.stderr else str(e)
        logger.error(f"Sandbox Execution Traceback: {error_log}")
        return {
            "execution_error": error_log,
            "retry_count": retry_count + 1,
            "agent_logs": [f"Sandbox: Critical failure. Code {e.exit_status}.", f"Error: {error_log[:200]}"]
        }
    except Exception as e:
        logger.error(f"Sandbox Unhandled Error: {str(e)}")
        return {
            "execution_error": str(e),
            "retry_count": retry_count + 1,
            "agent_logs": [f"Sandbox: Unhandled Host Docker error - {str(e)}"]
        }
