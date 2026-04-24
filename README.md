# OneMinute – AI-Powered Emotional Journal

## 1. Overview
OneMinute is a serverless full-stack web application that enables users to record short audio journals, analyze emotions using AI, and track mental well-being over time.

The system converts speech into text, detects mood and sentiment, and securely stores both raw audio and processed insights in the cloud.

---

## 2. Features

### 2.1 Audio Journaling
- Record voice entries directly from the browser  
- Lightweight and quick interaction  

### 2.2 AI-Based Emotion Analysis
- Speech-to-text conversion  
- Mood detection (Happy, Sad, etc.)  
- Sentiment scoring (-1 to 1)  

### 2.3 Mood Visualization
- Graphical representation of emotional trends  
- Calendar-based tracking  

### 2.4 Secure Data Storage
- Private journals protected with strict access rules  
- User-based data isolation  

### 2.5 Community Chat
- Anonymous message sharing  
- Read-all, post-authenticated system  

### 2.6 Serverless Architecture
- No traditional backend server  
- Direct frontend-to-cloud communication  

---

## 3. Tech Stack

### 3.1 Frontend
- React 18  
- Vite  
- TypeScript  

### 3.2 UI & Styling
- Tailwind CSS  
- Framer Motion  

### 3.3 Backend (Serverless)
- Firebase Authentication  
- Cloud Firestore  
- Firebase Storage  

### 3.4 AI Integration
- Google Gemini 3 Flash  
- @google/genai SDK  

---

## 4. Firebase Architecture

### 4.1 Authentication
- Supports Google login and Email/Password  
- Generates a unique UID for each user  
- Used for secure data access  

---

### 4.2 Cloud Firestore (Database)

#### 4.2.1 `/journals/` (Private Collection)
Stores:
- Transcriptions  
- Mood labels  
- Sentiment scores  
- AI insights  

