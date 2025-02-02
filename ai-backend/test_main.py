# test_main.py
import os
import tempfile
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_chat_with_gpt():
    # Use a dummy message for testing ChatGPT endpoint.
    dummy_message = "Hello, how are you?"
    # Patch the OpenAI ChatCompletion API call to return a predictable response.
    with patch("openai.ChatCompletion.create") as mock_chat:
        mock_chat.return_value = type("obj", (object,), {
            "choices": [type("obj", (object,), {"message": type("obj", (object,), {"content": "I am fine, thank you."})})]
        })()
        response = client.post("/chat", json={"message": dummy_message})
        assert response.status_code == 200
        json_response = response.json()
        assert "response" in json_response
        assert json_response["response"] == "I am fine, thank you."

def test_transcribe_audio():
    # Patch the OpenAI Audio.transcribe API call.
    with patch("openai.Audio.transcribe") as mock_transcribe:
        mock_transcribe.return_value = {"text": "This is a test transcript."}
        # Create a temporary dummy audio file.
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            tmp.write(b"dummy audio data")
            tmp.seek(0)
            files = {"file": (tmp.name, tmp, "audio/wav")}
            response = client.post("/transcribe", files=files)
            assert response.status_code == 200
            json_response = response.json()
            assert "transcript" in json_response
            assert json_response["transcript"] == "This is a test transcript."

def test_process_audio():
    # Patch both the Whisper and ChatGPT API calls.
    with patch("openai.Audio.transcribe") as mock_transcribe, \
         patch("openai.ChatCompletion.create") as mock_chat:
        mock_transcribe.return_value = {"text": "Test audio transcript."}
        mock_chat.return_value = type("obj", (object,), {
            "choices": [type("obj", (object,), {"message": type("obj", (object,), {"content": "Processed response."})})]
        })()

        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            tmp.write(b"dummy audio data")
            tmp.seek(0)
            files = {"file": (tmp.name, tmp, "audio/wav")}
            response = client.post("/process_audio", files=files)
            assert response.status_code == 200
            json_response = response.json()
            assert "transcript" in json_response
            assert "chatgpt_response" in json_response
            assert json_response["transcript"] == "Test audio transcript."
            assert json_response["chatgpt_response"] == "Processed response."
