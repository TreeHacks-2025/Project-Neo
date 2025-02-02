import openai

def transcribe_audio(file_path: str) -> str:
    transcript_response = openai.audio.transcribe(
        model="whisper-1",
        file=open(file_path, "rb")
    )
    return transcript_response.get("text", "")

def chat_with_message(message: str, model: str = "gpt-3.5-turbo") -> str:
    chat_response = openai.ChatCompletion.create(
        model=model,
        messages=[{"role": "user", "content": message}]
    )
    return chat_response.choices[0].message.content
