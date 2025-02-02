from fastapi import APIRouter
from services.openai_service import chat_with_message

router = APIRouter()

@router.post("/chat")
async def chat_with_gpt(message: str):
    # You can change the model parameter as needed.
    response_text = chat_with_message(message, model="gpt-4o-mini")
    return {"response": response_text}
