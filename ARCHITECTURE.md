# SyndicateML: System Architecture

The following diagram illustrates the autonomous multi-agent orchestration within SyndicateML, leveraging LangGraph, Mistral AI, and Docker.

```mermaid
graph TD
    %% User/Frontend Layer
    subgraph Frontend ["React UI (Command Center)"]
        UI["Drag & Drop Upload"] --> |Ingest Request| API
        WS_SUB["Live Intelligence stream"] <--> |WebSocket Telemetry| WS_END
        CHAT["Syndicate Lead Chat"] <--> |Interrogation API| CHAT_API
        MODAL["Triage Modal (HITL)"] --> |Approval/Rejection| APP_API
    end

    %% Backend Layer
    subgraph Backend ["FastAPI Backend Orchestrator"]
        API["/api/ingest"] --> GRAPH
        APP_API["/api/approve-deployment"] --> |Resume/Abort| GRAPH
        CHAT_API["/api/syndicate-chat"] --> |Contextual Reasoning| MISTRAL
        WS_END["/ws/stream"]
    end

    %% LangGraph Orchestration Layer
    subgraph Orchestration ["LangGraph Agent Swarm"]
        GRAPH{{"Syndicate Graph"}}
        CHECK["MemorySaver (Checkpoint)"] <--> GRAPH
        
        GRAPH --> PRIV["Privacy Shield"]
        PRIV --> PROF["Data Profiler"]
        PROF --> FE["Feature Engineer"]
        
        FE --> |Self-Healing Loop| FE_CODE["Docker Sandbox"]
        FE_CODE --> FE
        
        FE --> ARCH["ML Architect"]
        ARCH --> |Self-Healing Loop| ARCH_CODE["Docker Sandbox"]
        ARCH_CODE --> ARCH
        
        ARCH --> FIN["FinOps Auditor"]
        FIN --> XAI["XAI Auditor"]
        
        XAI --> TRIAGE{"Triage Logic"}
        TRIAGE --> |Accuracy < 85%| HITL["HITL State (Pause)"]
        TRIAGE --> |Accuracy >= 85%| MLOPS["MLOps Lead (Auto-Deploy)"]
        
        HITL --> |Manual Approval| MLOPS
        HITL -.-> |Websocket Event| WS_END
    end

    %% Infrastructure Layer
    subgraph Infrastructure ["Infrastrucure & Models"]
        FE_CODE -.-> DOCKER["Docker Daemon"]
        ARCH_CODE -.-> DOCKER
        MISTRAL["Mistral-Large-3:675B"]
        DATA["/app/data (Volumes)"]
    end

    %% Signaling
    MLOPS --> |Generate serving_api.py| DEPLOY["deployment/"]
    WS_END -.-> |Broadcasting| UI
```

## Key Architectural Principles:
1. **Event-Driven**: The system uses WebSockets for real-time telemetry, ensuring the user is never out of the loop.
2. **Privacy-First**: The `Privacy Shield` is the first line of defense, scanning and masking PII before any further analysis.
3. **Self-Healing**: Agents utilize an isolated `Docker Sandbox` for code execution, automatically retrying and refining code upon failure.
4. **HITL Triage**: A safety threshold ensures that only high-performing models proceed to production without manual sign-off.
5. **Contextual Explainability**: The `XAI Auditor` and `Syndicate Lead Chat` provide granular transparency into every automated decision.
