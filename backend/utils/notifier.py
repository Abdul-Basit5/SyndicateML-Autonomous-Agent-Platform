import os
from dotenv import load_dotenv

load_dotenv()

def send_whatsapp_alert(message: str):
    """
    Sends a real-time notification to the human operator.
    Fails gracefully without interrupting the LangGraph swarm.
    """
    # Twilio logic removed as per user request
    print(f"📢 INTERNAL ALERT: {message}")
    return True
