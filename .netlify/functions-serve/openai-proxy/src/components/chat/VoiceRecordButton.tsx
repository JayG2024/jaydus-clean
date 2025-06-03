import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface VoiceRecordButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  className?: string;
}

const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({ 
  onRecordingComplete, 
  className = '' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Request mic permission when component mounts
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        // Just check if we can get access, don't actually start recording
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    };
    
    requestMicPermission();
  }, []);
  
  // Timer for recording duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (timer) {
      clearInterval(timer);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);
  
  // Format seconds as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      });
      
      recorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setRecordingBlob(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      });
      
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      toast.info('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.info('Recording stopped');
    }
  };
  
  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioChunks([]);
      toast.info('Recording cancelled');
    }
  };
  
  const submitRecording = () => {
    if (recordingBlob) {
      setIsProcessing(true);
      
      // In a real app, you might want to send this to a server for transcription
      setTimeout(() => {
        onRecordingComplete(recordingBlob);
        setRecordingBlob(null);
        setIsProcessing(false);
        toast.success('Voice recording processed successfully');
      }, 1500); // Simulate processing time
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ${
          isRecording ? 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400' : ''
        }`}
        aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
      >
        {isRecording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 w-64"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-error-500 rounded-full animate-pulse mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Recording</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{formatTime(recordingDuration)}</span>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-error-500 animate-pulse" style={{ width: `${Math.min((recordingDuration / 120) * 100, 100)}%` }}></div>
              </div>
              
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelRecording}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={stopRecording}
                  className="flex-1 bg-error-600 hover:bg-error-700"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Stop
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {recordingBlob && !isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 w-64"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Recording complete</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(recordingDuration)}</span>
              </div>
              
              <audio
                controls
                src={URL.createObjectURL(recordingBlob)}
                className="w-full h-8"
              />
              
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecordingBlob(null)}
                  className="flex-1"
                >
                  Discard
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={submitRecording}
                  className="flex-1"
                >
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 w-64"
          >
            <div className="flex justify-center items-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600 mr-2" />
              <span className="text-sm text-gray-900 dark:text-white">Processing audio...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRecordButton;