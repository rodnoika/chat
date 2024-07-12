import base64

from openai import OpenAI
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated,List, Dict

from pydantic import BaseModel





client = OpenAI(api_key="API")

app = FastAPI()
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def encode_image(image):
    return base64.b64encode(image).decode('utf-8')
conversation_history: List[Dict[str, str]] = []

@app.post("/chat/")
async def chat(message: Annotated[str, Form()], file: UploadFile = File(None)):
    try:
        global conversation_history
        conversation_history.append({"sender": "User", "message": message})

        messages = [{"role": "system", "content": "Ты хороший собеседник, который пытается понравится человеку"},
                    {"role": "user", "content": message}]
        for entry in conversation_history:
            role = "user" if entry["sender"] == "User" else "assistant"
            messages.append({"role": role, "content": entry["message"]})
        
        if file:
            image = await file.read()
            base64_image = encode_image(image)
            messages.append(
                {"role": "user", "content": f"data:image/jpeg;base64,{base64_image}"}
            )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=500,
        )
        
        
        result = response.choices[0].message.content
        conversation_history.append({"sender": "Rodnoi", "message": result})

        return JSONResponse(content={"answer": result})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/history/")
async def get_history():
    return conversation_history

@app.post("/clear_history/")
async def clear_history():
    global conversation_history
    conversation_history = []
    return JSONResponse(content={"message": "History cleared"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
