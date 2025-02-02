from fastapi import APIRouter, File, UploadFile
import tempfile
import os
from services.openai_service import transcribe_audio

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_filename = tmp.name
    try:
        transcript = transcribe_audio(tmp_filename)
        return {"transcript": transcript}
    finally:
        os.remove(tmp_filename)
