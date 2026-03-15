from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
from openai import OpenAI
from dotenv import load_dotenv
import json

# Try to load .env from parent directory or current directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()

app = FastAPI(title="AI Debate Partner API")

# Allow CORS so the frontend can quickly communicate with it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client():
    api_key = os.getenv("GROQ_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured in backend.")
    
    if os.getenv("GROQ_API_KEY"):
        return OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1"), "llama-3.3-70b-versatile"
    else:
        return OpenAI(api_key=api_key), "gpt-4o-mini"

class EvaluateRequest(BaseModel):
    argument: str
    topic: str

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    topic: str

class ReportRequest(BaseModel):
    evaluations: List[Dict[str, Any]]
    topic: str

@app.post("/evaluate")
async def evaluate_argument(req: EvaluateRequest):
    client, model = get_client()
    system_prompt = f"""You are an expert debate judge. Evaluate the following argument presented by a human user in a debate about: "{req.topic}".
Evaluate based on:
- Logical reasoning
- Clarity of explanation
- Supporting evidence
- Persuasiveness
- Structure of argument

Return your evaluation EXACTLY in the following JSON format without any markdown or extra text:
{{
    "score": <number 1-10>,
    "strengths": ["string", "string"],
    "improvements": ["string", "string"],
    "logic_score": <number 1-10>,
    "clarity_score": <number 1-10>,
    "evidence_score": <number 1-10>,
    "persuasiveness_score": <number 1-10>
}}"""
    try:
        is_openai = model.startswith("gpt")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.argument}
            ],
            response_format={"type": "json_object"} if is_openai else None,
            temperature=0.2
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        return json.loads(content)
    except Exception as e:
        # Fallback values if API call fails
        return {"error": str(e), "score": 0, "logic_score": 0, "clarity_score": 0, "evidence_score": 0, "persuasiveness_score": 0, "strengths": [], "improvements": []}

@app.post("/chat")
async def generate_counterargument(req: ChatRequest):
    client, model = get_client()
    system_prompt = f"""You are a skilled and logical debater. You are debating the human user on the topic: "{req.topic}".
You MUST strongly take the OPPOSITE stance of whatever the user is arguing.
Your goal is to provide logical counterarguments, challenge weak reasoning, and encourage deeper thinking.
Keep your counterarguments concise (under 150 words), sharp, and directly addressing the user's points. Do not repeat previous arguments."""
    
    api_messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        api_messages.append({"role": msg["role"], "content": msg["content"]})
        
    try:
        response = client.chat.completions.create(
            model=model,
            messages=api_messages,
            temperature=0.7
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/report")
async def generate_final_report(req: ReportRequest):
    client, model = get_client()
    if not req.evaluations:
        return {"report": "No arguments were presented to evaluate."}
    
    avg_logic = sum(e.get("logic_score", 0) for e in req.evaluations) / len(req.evaluations)
    avg_clarity = sum(e.get("clarity_score", 0) for e in req.evaluations) / len(req.evaluations)
    avg_evidence = sum(e.get("evidence_score", 0) for e in req.evaluations) / len(req.evaluations)
    avg_persuasion = sum(e.get("persuasiveness_score", 0) for e in req.evaluations) / len(req.evaluations)
    avg_overall = sum(e.get("score", 0) for e in req.evaluations) / len(req.evaluations)
    
    all_strengths = []
    all_improvements = []
    for e in req.evaluations:
        all_strengths.extend(e.get("strengths", []))
        all_improvements.extend(e.get("improvements", []))
    
    prompt = f"""Generate a brief final debate report summary.
Topic: {req.topic}
Overall Score: {avg_overall:.1f}/10
Logic: {avg_logic:.1f}/10
Clarity: {avg_clarity:.1f}/10
Evidence: {avg_evidence:.1f}/10
Persuasiveness: {avg_persuasion:.1f}/10
Aggregate Strengths: {all_strengths}
Aggregate Improvements: {all_improvements}

Format it nicely using HTML layout tags (headings, p, ul, strong) so that it can be injected safely inside an HTML container. Give an overall verdict of the debater's performance, and highlight 2-3 key suggestions for future debates. DO NOT USE MARKDOWN (`**` or `##`), use pure HTML."""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        return {"report": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
