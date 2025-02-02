from fastapi import APIRouter, File, UploadFile
import tempfile
import os
from services.openai_service import transcribe_audio, chat_with_message

router = APIRouter()

@router.post("/process_audio")
async def process_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_filename = tmp.name
    try:
        transcript = transcribe_audio(tmp_filename)
    finally:
        os.remove(tmp_filename)
    
    response_text = chat_with_message(transcript, model="gpt-3.5-turbo")
    
    return {
        "transcript": transcript,
        "chatgpt_response": response_text
    }
