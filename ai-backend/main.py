from fastapi import FastAPI
from routes import root, predict, transcribe, chat, process_audio, obj_processing
import config  # Ensures that configuration (e.g. API key) is loaded

app = FastAPI()

app.include_router(root.router)
app.include_router(predict.router)
app.include_router(transcribe.router)
app.include_router(chat.router)
app.include_router(process_audio.router)
app.include_router(obj_processing.router)
