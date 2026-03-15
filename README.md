#  DebateMate AI

DebateMate AI is an AI-powered debate simulator where users can practice argumentation and critical thinking by debating with a large language model in real time.

Instead of static learning, users engage in interactive debates with AI, receive logical feedback, and improve their reasoning skills through structured argument evaluation.

# Live Demo  
Check it out at : https://debate-mate-ai.netlify.app/



#  Features

##  1. AI Counterarguments
The AI automatically takes the opposite stance and generates logical counterarguments.

## 2. Timed Debate Sessions
Users can select debate duration:
- 3 minutes
- 5 minutes
- 10 minutes

The debate ends automatically when the timer expires.

##  3. Voice Input Support
Users can speak their arguments using the browser microphone via the Web Speech API.

##  4. Argument Evaluation
After the debate, AI evaluates arguments based on:
- Logical reasoning
- Clarity
- Supporting evidence
- Persuasiveness

##  5. Debate Reports
Each debate session generates a performance report highlighting strengths and areas for improvement.

##  6. Debate History
All past debate reports are stored locally using the browser Local Storage API.

---

#  System Architecture

The application follows a client-server architecture.

## Frontend (Netlify)
HTML5 + CSS3 + Vanilla JavaScript  
Web Speech API  
Local Storage API  

## Backend (Render)
Python  
FastAPI  
Pydantic  
Async Processing  

## AI Layer
Groq API  
Llama-3.3-70B Model  

---

# Tech Stack

## Frontend
- HTML5
- CSS3
- Vanilla JavaScript (ES6)

APIs:
- Web Speech API
- Local Storage API

Hosting:
- Netlify

## Backend
- Python
- FastAPI
- Pydantic
- Async request handling

Hosting:
- Render

## AI Stack
Inference Engine:
Groq API

Model:
Llama-3.3-70b-versatile

The 70B parameter model allows the AI to sustain deep logical arguments and maintain debate context.

---

#  How It Works

## 1️⃣ Select Debate Topic
Users choose a predefined debate topic or enter a custom topic.

## 2️⃣ Choose Debate Duration
Users select a session length:
- 3 minutes
- 5 minutes
- 10 minutes

## 3️⃣ AI Takes Opposing Stance
The AI automatically adopts the opposite viewpoint.

## 4️⃣ Debate Session Begins
Users present arguments through:
- text input
- voice input

## 5️⃣ AI Generates Counterarguments
The AI responds with logical counterpoints to maintain the debate.

## 6️⃣ Debate Evaluation
When the timer ends, the system generates a debate performance report & you can download it too.

---

#  Example Evaluation

Debate Summary

Logic Score: 8/10  
Clarity: 7/10  
Evidence: 6/10  
Persuasiveness: 7/10  

Overall Score: 7/10  

Strengths
- Clear reasoning
- Good argument structure

Improvements
- Provide stronger evidence
- Add real-world examples

---

#  Project Structure

debate-ai/

frontend/  
index.html  
styles.css  
script.js  

backend/  
main.py  
api_routes.py  
models.py  

README.md

---

#  Future Improvements

- Logical fallacy detection
- AI follow-up questions during debates
- Debate difficulty levels
- User authentication
- Debate leaderboard
- Analytics dashboard
- Multiplayer debate mode

---

#  Motivation

Most debate learning tools are static and lack real-time feedback.

DebateMate AI creates a dynamic AI-powered environment where users can sharpen reasoning skills through structured argumentation with an intelligent AI opponent.

---

# CREDITS

PURNIKA MALHOTRA
