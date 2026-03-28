import os
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class LLMFactory:
    """
    Centralized factory for initializing Mistral AI models.
    Ensures all agents use the same elite 675B model and handles API key management.
    """
    
    _model_instance = None
    MODEL_NAME = "mistral-large-latest"
    
    @staticmethod
    def get_large_model():
        """
        Returns a pre-configured ChatMistralAI instance for the 675B model.
        """
        api_key = os.environ.get("MISTRAL_API_KEY")
        if not api_key:
            # Fallback for UI stability during defense if key is missing
            print("⚠️ [WARN] MISTRAL_API_KEY missing. Agents will be non-functional.")
            return None
            
        return ChatMistralAI(
            model=LLMFactory.MODEL_NAME,
            mistral_api_key=api_key,
            temperature=0.1,
            max_retries=3,
            timeout=180
        )

    @staticmethod
    def get_model_name():
        return LLMFactory.MODEL_NAME

