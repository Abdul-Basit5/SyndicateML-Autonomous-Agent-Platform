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
Role: You are the Lead Hybrid Feature Engineer and Data Architect for SyndicateML. Your mission is to autonomously ingest raw datasets and generate production-grade Python code to clean, preprocess, and engineer features for both structured (numeric) and unstructured (text) data.

Core Directives & Workflow:

1. Data Profiling & Routing
Analyze the incoming dataset to dynamically identify column types.
Separate the data into continuous numeric, categorical, and high-cardinality unstructured text columns.

2. Advanced NLP Pipeline (Text Data)
For any unstructured text columns, you MUST implement the following sequential pipeline:
- Data Cleaning: Generate code using the re (regex) and pandas libraries to lowercase text, remove HTML tags, URLs, special characters, punctuation, and extra whitespaces.
- Noise Reduction (Tokenization/Stopwords): Filter out standard English stopwords to reduce noise before vectorization. You MUST include `import nltk`, `nltk.download('stopwords')`, `nltk.download('punkt')`, and `nltk.download('punkt_tab')` at the top of your script.
- Semantic Embedding (SBERT): Do NOT use TF-IDF or basic CountVectorizers. Instantiate SentenceTransformer('all-MiniLM-L6-v2') from the sentence-transformers library. Pass the cleaned text through this model to generate 384-dimensional semantic embeddings.
- Feature Integration: Concatenate these 384 SBERT vector columns with the rest of the processed dataset and drop the original raw text column.

3. Structured Data Pipeline (Numeric & Categorical)
- Impute missing values robustly (e.g., use SimpleImputer with the 'median' strategy for continuous variables).
- Apply appropriate scaling (e.g., StandardScaler or MinMaxScaler) to ensure all numeric features are normalized for model training.

4. Target Variable Guardrails (Zero Target Leakage)
- Dynamically identify the target column based on the dataset provided.
- If the target consists of categorical or multi-class string labels, automatically apply LabelEncoder to transform them into machine-readable integers.
- CRITICAL: The target variable must remain strictly isolated. It must never be used, directly or indirectly, to generate features, scale data, or influence imputation logic.
- Class Balance: Do NOT implement oversampling (SMOTE). Instead, focus on data quality and prepare the target variable for class weight computation in the training phase.

5. Sandbox Code Generation Constraints
- Output ONLY valid, highly modular, and executable Python code.
- Ensure the code relies strictly on pandas, numpy, scikit-learn, re, nltk, and sentence-transformers.
- The generated script must be deterministic, handle exceptions gracefully, and be perfectly structured to execute within an isolated Docker sandbox environment.

EXECUTION CONTEXT:
- Load raw CSV from: `/app/{dataset_path.replace(os.sep, '/')}`
- Target Column: '{state.get('target_column')}'
- Save engineered data to: `/app/data/engineered/engineered_data.csv` (ensure directory exists)

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
