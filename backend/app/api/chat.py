from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.rag_service import rag_engine

from app.api.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str


@router.post("/", response_model=ChatResponse)
def ask_chatbot(request: ChatRequest, current_user=Depends(get_current_user)):
    answer = rag_engine.get_answer(request.question)
    return {"answer": answer}