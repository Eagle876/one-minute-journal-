#📘 OneMinute – AI-Powered Emotional Journal
📌 Overview
OneMinute is a serverless full-stack web application that allows users to record short audio journals, analyze emotions using AI, and visualize their mental well-being over time.
The app converts speech to text, detects sentiment and mood, and stores both audio and insights securely in the cloud.
🚀 Features
🎙️ Audio Journaling – Record short voice entries directly from the browser
🤖 AI Analysis – Converts speech to text and detects emotions in real-time
📊 Mood Tracking – Visualize emotional trends using charts
🔒 Secure Storage – Private journals protected with strict access rules
💬 Community Chat – Anonymous shared support space
☁️ Serverless Architecture – No backend server required
🏗️ Tech Stack
Frontend
React 18
Vite
TypeScript
Styling & UI
Tailwind CSS
Framer Motion
Backend (Serverless)
Firebase Authentication
Cloud Firestore
Firebase Storage
AI Integration
Google Gemini 3 Flash
@google/genai SDK
🔥 Firebase Usage
1. Authentication
Supports Google login and Email/Password
Generates unique UID for each user
Used for secure data ownership
2. Cloud Firestore (Database)
📁 /journals/ (Private)
Stores:
Transcriptions
Mood (Happy, Sad, etc.)
Sentiment score (-1 to 1)
AI insights
🔐 Security:
Only accessible if:
request.auth.uid == resource.data.userId
📁 /chat_messages/ (Public)
Stores:
Anonymous community messages
🔐 Rules:
Anyone logged in → can read
Only authenticated users → can post
No edit/delete allowed
3. Cloud Storage
Stores recorded audio files (.webm)
Each file linked to a Firestore journal entry
4. Security Rules
Ensures:
✅ Data integrity (valid inputs only)
🔒 User isolation (private journals stay private)
🚫 Immutability (no editing after save)
🔄 Data Flow
Record
User records audio via browser
Analyze
Audio sent to Gemini AI
Returns:
Transcription
Mood
Sentiment
Store
Audio → Firebase Storage
Metadata → Firestore
Visualize
Data fetched for:
Charts
Calendar insights
📊 Visualization
Built using Recharts
Displays:
Emotional trends
Mood distribution
Timeline insights
🧠 Use Cases
Mental health tracking
Daily journaling
Self-reflection
Emotional awareness

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
