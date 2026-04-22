import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transcribeAndAnalyze } from '../services/geminiService';
import { storage, db } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface VoiceRecorderProps {
  onSave: (entry: { content: string; mood: string; score: number; insight: string }) => void;
}

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Speech Recognition for real-time feedback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob, mimeType);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      recognitionRef.current?.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
  };

  const processAudio = async (audioBlob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setProcessStatus('Reading audio...');
    setError(null);
    try {
      console.log('VoiceRecorder: Processing audio blob...', audioBlob.size, mimeType);
      
      // 1. Convert to base64 for Gemini (Do this first as it's most critical)
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Reading audio timed out')), 10000);
        reader.onloadend = () => {
          clearTimeout(timeout);
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to read audio file'));
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;
      console.log('VoiceRecorder: Audio converted to base64');

      // 2. Transcribe and Analyze with Gemini
      setProcessStatus('AI Analysis (this can take 5-10s)...');
      const analysis = await transcribeAndAnalyze(base64Audio, mimeType.split(';')[0]);
      console.log('VoiceRecorder: Analysis received', analysis);

      // 3. Attempt to upload to Firebase Storage (Optional)
      setProcessStatus('Saving recording...');
      let downloadURL = null;
      try {
        console.log('VoiceRecorder: Attempting storage upload...');
        const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
        const fileName = `journals/${user?.uid}/${Date.now()}.${extension}`;
        const storageRef = ref(storage, fileName);
        
        // Add a timeout for storage upload
        const uploadTask = uploadBytes(storageRef, audioBlob);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage upload timed out')), 8000)
        );
        
        await Promise.race([uploadTask, timeoutPromise]);
        downloadURL = await getDownloadURL(storageRef);
        console.log('VoiceRecorder: Storage upload successful');
      } catch (storageErr: any) {
        console.warn('Firebase Storage upload skipped or failed:', storageErr.message);
      }

      // 4. Save metadata to Firestore
      setProcessStatus('Finalizing...');
      await addDoc(collection(db, 'journals'), {
        userId: user?.uid,
        content: analysis.transcription || 'No transcription available',
        mood: analysis.mood || 'Neutral',
        emoji: analysis.emoji || '😐',
        sentiment_score: analysis.score || 0,
        insight: analysis.insight || 'Note saved.',
        audio_url: downloadURL,
        created_at: serverTimestamp()
      });
      console.log('VoiceRecorder: Firestore save complete');

      onSave({
        content: analysis.transcription || '',
        mood: analysis.mood || 'Neutral',
        score: analysis.score || 0,
        insight: analysis.insight || ''
      });
    } catch (err: any) {
      console.error('Processing error', err);
      setError(`Failed to process: ${err.message || 'Unknown error'}. Your recording was lost. Please try again.`);
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6 card rounded-3xl shadow-xl">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Voice Journal</h2>
        <p className="text-xs opacity-60">Speak your mind, we'll listen and understand.</p>
      </div>

      <div className="relative">
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.2 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
              className="absolute inset-0 accent-bg rounded-full"
            />
          )}
        </AnimatePresence>
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`
            relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl
            ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'accent-bg hover:scale-105'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin text-white" size={32} />
          ) : isRecording ? (
            <Square className="text-white fill-white" size={28} />
          ) : (
            <Mic className="text-white" size={32} />
          )}
        </button>
      </div>

      {isRecording && (
        <div className="w-full max-w-md p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center">
          <p className="text-sm italic opacity-70">"{transcript || 'Listening...'}"</p>
        </div>
      )}

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-3 p-4 bg-[var(--accent)]/5 border border-[var(--border)] rounded-2xl w-full"
        >
          <div className="flex items-center space-x-3 accent-text font-medium">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">{processStatus || 'Processing...'}</span>
          </div>
          <p className="text-[10px] opacity-50 text-center">
            Your recording is being analyzed and saved to your cloud journal.
          </p>
        </motion.div>
      )}

      {error && (
        <p className="text-red-500 text-xs font-medium text-center">{error}</p>
      )}
    </div>
  );
}
