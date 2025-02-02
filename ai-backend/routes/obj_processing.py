from fastapi import APIRouter, File, UploadFile
import tempfile
import os
from services.openai_service import chat_with_message
from fastapi.responses import FileResponse
from gtts import gTTS

router = APIRouter()

@router.post("/process_obj")
async def process_obj(file: UploadFile = File(...)):
    # Read and decode the OBJ file (assumed to be a text file)
    contents = await file.read()
    obj_text = contents.decode("utf-8")
    
    # Create a prompt for ChatGPT to summarize the OBJ mapping details.
    prompt = (
        "Please analyze the following OBJ file mapping and provide a detailed summary of its contents, "
        "including geometry, materials, and any mapping information:\n\n" + obj_text
    )
    summary = chat_with_message(prompt, model="gpt-3.5-turbo")
    
    # Convert the summary to speech using gTTS.
    tts = gTTS(summary)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tts.save(tmp.name)
        audio_path = tmp.name
    
    # Return the generated audio file as a response.
    return FileResponse(audio_path, media_type="audio/mpeg", filename="summary.mp3")
