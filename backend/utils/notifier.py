import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

def send_whatsapp_alert(message: str):
    """
    Sends a real-time notification to the human operator via Twilio WhatsApp API.
    Fails gracefully without interrupting the LangGraph swarm.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_NUMBER") # e.g., 'whatsapp:+14155238886'
    to_number = os.getenv("TARGET_WHATSAPP_NUMBER")     # e.g., 'whatsapp:+92300...'

    if not all([account_sid, auth_token, from_number, to_number]):
        print("⚠️ Twilio credentials missing in .env. Skipping alert.")
        return False

    try:
        client = Client(account_sid, auth_token)
        client.messages.create(
            from_=from_number,
            body=message,
            to=to_number
        )
        print(f"✨ WhatsApp Alert Dispatched: {message[:50]}...")
        return True
    except Exception as e:
        # Secure logging without crashing the graph
        print(f"❌ Twilio Alert Failure: {str(e)}")
        return False
