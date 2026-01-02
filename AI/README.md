# PRET Project

## Description
This project collects food and oil waste from restaurants and cafes, aggregates them, and sends them to factories. The AI module predicts when the required quantity is reached and handles auction decisions for selling the waste to factories.

## Structure
- `backend/`: NodeJS backend APIs
- `ai_service/`: Python AI service (Prediction + Auction + Bid Evaluation)
- `frontend/`: Dashboard (optional)
- `data/`: Sample data

## How to Run
1. Start AI Service:
   ```bash
   cd ai_service
   pip install -r requirements.txt
   python app.py
