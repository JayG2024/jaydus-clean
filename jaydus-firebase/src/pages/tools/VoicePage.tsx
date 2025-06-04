import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mic, Play, Pause, Volume2, VolumeX, Download, RefreshCw, ChevronDown, Upload, FileAudio, MessagesSquare, AlertCircle, Copy, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { useAuth } from "../../context/FirebaseAuthContext";
// OpenAI integration removed - using OpenRouter only
// import OpenAIWithUsage from '../../openai/openaiWithUsage';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { logApiError, logError, ErrorSeverity } from '../../utils/errorLogger';

type VoiceForm = {
  text: string;
};

type Voice = {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  description?: string;
};

type GeneratedVoice = {
  id: string;
  text: string;
  audioUrl: string;
  voiceName: string;
  timestamp: Date;
  duration?: number;
};

const voices: Voice[] = [
  { id: 'alloy', name: 'Alloy', language: 'English (US)', gender: 'neutral', description: 'Versatile, neutral voice suitable for a wide range of content.' },
  { id: 'echo', name: 'Echo', language: 'English (US)', gender: 'male', description: 'Deep and authoritative masculine voice ideal for narration.' },
  { id: 'fable', name: 'Fable', language: 'English (US)', gender: 'male', description: 'Warm masculine voice that\'s especially good for storytelling.' },
  { id: 'onyx', name: 'Onyx', language: 'English (US)', gender: 'male', description: 'Authoritative and professional masculine voice.' },
  { id: 'nova', name: 'Nova', language: 'English (US)', gender: 'female', description: 'Energetic and bright feminine voice suitable for explanations.' },
  { id: 'shimmer', name: 'Shimmer', language: 'English (US)', gender: 'female', description: 'Clear and elegant feminine voice perfect for creative content.' }
];

// Sample texts for text-to-speech
const sampleTexts = [
  "Welcome to the future of AI-powered voice technology. Our advanced models can generate natural-sounding speech for a variety of applications, from audiobooks to podcasts to voice assistants.",
  "The lake sparkled in the morning sunlight, casting reflections of the surrounding mountains. Birds called to one another across the still air, their songs carrying over the water.",
  "In this tutorial, we'll explore how to effectively use voice generation APIs to create dynamic audio content for your applications, ensuring an accessible and engaging user experience.",
  "Thank you for choosing our service! We're excited to help you bring your content to life through voice. Let us know if you need any assistance with implementation.",
  "The quantum computer processed the complex algorithm in seconds, achieving what would have taken traditional systems years. Scientists celebrated the breakthrough as a new era in computing."
];

const VoicePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('text-to-speech');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [generatedVoices, setGeneratedVoices] = useState<GeneratedVoice[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  
  // Initialize OpenAI service
  // OpenAI service removed - voice features disabled for OpenRouter-only setup
  // const openAIService = new OpenAIWithUsage();
  
  // Set user ID if available
  useEffect(() => {
    if (currentUser) {
      openAIService.setUserId(currentUser.id);
    }
  }, [currentUser]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, watch, setValue, reset } = useForm<VoiceForm>({
    defaultValues: {
      text: '',
    }
  });
  
  const textValue = watch('text');
  
  // Load saved voices from localStorage on component mount
  useEffect(() => {
    const savedVoices = localStorage.getItem('generatedVoices');
    if (savedVoices) {
      try {
        const parsedVoices = JSON.parse(savedVoices);
        setGeneratedVoices(parsedVoices.map((voice: any) => ({
          ...voice,
          timestamp: new Date(voice.timestamp)
        })));
      } catch (error) {
        console.error('Failed to parse saved voices:', error);
      }
    }
  }, []);
  
  // Save voices to localStorage when they change
  useEffect(() => {
    if (generatedVoices.length > 0) {
      localStorage.setItem('generatedVoices', JSON.stringify(generatedVoices));
    }
  }, [generatedVoices]);
  
  // Handle audio playback end
  useEffect(() => {
    const handleEnded = () => {
      setCurrentlyPlaying(null);
    };
    
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener('ended', handleEnded);
      
      // Update audio element when volume or mute changes
      audioElement.volume = isMuted ? 0 : volume;
    }
    
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('ended', handleEnded);
      }
    };
  }, [isMuted, volume]);
  
  const onSubmit = async (data: VoiceForm) => {
    if (!data.text.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Check if current mode is production and OpenAI API is available
      if (import.meta.env.VITE_ENABLE_MOCK_MODE === 'true') {
        console.log('Using mock audio generation - real API would be called in production');
      }
      
      // Call OpenAI API to generate speech
      const response: Response = await openAIService.generateSpeech({
        model: 'tts-1', // OpenAI's text-to-speech model
        voice: selectedVoice.id,
        input: data.text,
      });
      
      // Get the audio blob
      const audioBlob = await response.blob();
      
      // Create an audio URL
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Estimate duration (approximately 150 words per minute)
      const wordCount = data.text.split(/\s+/).length;
      const estimatedDuration = Math.max(1, Math.ceil(wordCount / 150 * 60));
      
      // Create voice object
      const newVoice: GeneratedVoice = {
        id: `voice-${Date.now()}-${uuidv4()}`,
        text: data.text,
        audioUrl: audioUrl,
        voiceName: selectedVoice.name,
        timestamp: new Date(),
        duration: estimatedDuration, // In seconds
      };
      
      setGeneratedVoices((prev) => [newVoice, ...prev]);
      toast.success('Voice generated successfully');
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Log the error
      logApiError('openai.audio.speech.create', error, {
        model: 'tts-1',
        voice: selectedVoice.id,
        inputLength: data.text.length
      });
      
      // Show user-friendly error message
      if (error instanceof Error) {
        let errorMessage = 'Failed to generate speech';
        
        if (error.message.includes('content_policy_violation')) {
          errorMessage = 'Your text may violate content policy. Please modify and try again.';
        } else if (error.message.includes('rate_limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        } else if (error.message.includes('input_too_long')) {
          errorMessage = 'Text is too long. Please shorten your input and try again.';
        }
        
        toast.error(errorMessage);
      } else {
        toast.error('Failed to generate speech');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const togglePlayPause = (voiceId: string, audioUrl: string) => {
    if (currentlyPlaying === voiceId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      // Stop any currently playing audio
      if (currentlyPlaying && audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play the selected audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.playbackRate = speed;
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          logError(
            error instanceof Error ? error : new Error('Failed to play audio'),
            {
              message: 'Error playing audio file',
              context: { voiceId },
              tags: ['audio', 'playback']
            },
            ErrorSeverity.WARNING
          );
          toast.error('Failed to play audio');
        });
        setCurrentlyPlaying(voiceId);
      }
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current && currentlyPlaying) {
      audioRef.current.playbackRate = newSpeed;
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Check file size (25MB max for OpenAI's API)
      if (files[0].size > 25 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 25MB.');
        return;
      }
      
      // Check file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/webm', 'audio/ogg'];
      if (!validTypes.includes(files[0].type)) {
        toast.error('Unsupported file type. Please upload MP3, MP4, WAV, WebM, or OGG audio file.');
        return;
      }
      
      setUploadedFile(files[0]);
      
      // Clear previous transcription when a new file is uploaded
      setTranscription(null);
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const transcribeAudio = async () => {
    if (!uploadedFile) {
      toast.error('Please upload an audio file first');
      return;
    }
    
    setIsTranscribing(true);
    
    try {
      // Check if we're using the real API or mock mode
      if (import.meta.env.VITE_ENABLE_MOCK_MODE === 'true') {
        console.log('Using mock transcription - real API would be called in production');
      }
      
      // Call OpenAI API to transcribe
      const response: { text: string } = await openAIService.transcribe({
        file: uploadedFile,
        model: 'whisper-1',
      });
      
      setTranscription(response.text);
      toast.success('Audio transcribed successfully');
    } catch (error) {
      console.error('Error transcribing audio:', error);
      
      // Log the error
      logApiError('openai.audio.transcriptions.create', error, {
        model: 'whisper-1',
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size
      });
      
      // Show user-friendly error message
      if (error instanceof Error) {
        let errorMessage = 'Failed to transcribe audio';
        
        if (error.message.includes('file_too_large')) {
          errorMessage = 'File is too large. Maximum size is 25MB.';
        } else if (error.message.includes('unsupported_file_type')) {
          errorMessage = 'Unsupported file type. Please upload MP3, MP4, WAV, WebM, or OGG audio file.';
        } else if (error.message.includes('rate_limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        }
        
        toast.error(errorMessage);
        setTranscription("Error: " + errorMessage);
      } else {
        toast.error('Failed to transcribe audio');
        setTranscription("Error: Failed to transcribe the audio. Please try again with a different file.");
      }
    } finally {
      setIsTranscribing(false);
    }
  };
  
  const useTextSample = (text: string) => {
    setValue('text', text);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy text'));
  };
  
  const downloadAudio = (audioUrl: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `${filename}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Audio downloaded');
    } catch (error) {
      console.error('Error downloading audio:', error);
      
      logError(
        error instanceof Error ? error : new Error('Failed to download audio'),
        {
          message: 'Error downloading generated audio',
          context: { filename },
          tags: ['download', 'audio']
        },
        ErrorSeverity.WARNING
      );
      
      toast.error('Failed to download audio');
    }
  };
  
  const deleteVoice = (id: string) => {
    // If deleting currently playing audio, stop playback
    if (currentlyPlaying === id && audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    }
    
    // Find the voice to get the audioUrl
    const voice = generatedVoices.find(v => v.id === id);
    if (voice && voice.audioUrl) {
      // Revoke the object URL to free up memory
      URL.revokeObjectURL(voice.audioUrl);
    }
    
    // Remove from state
    setGeneratedVoices(prev => prev.filter(voice => voice.id !== id));
    
    toast.success('Voice deleted');
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voice & Transcription</h1>
      </div>
      
      {/* Tabs */}
      <Card>
        <CardContent className="p-1">
          <div className="flex space-x-1">
            <button
              className={`flex-1 text-center py-2 px-4 rounded-lg text-sm font-medium ${
                activeTab === 'text-to-speech'
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('text-to-speech')}
            >
              Text to Speech
            </button>
            <button
              className={`flex-1 text-center py-2 px-4 rounded-lg text-sm font-medium ${
                activeTab === 'speech-to-text'
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('speech-to-text')}
            >
              Speech to Text
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        style={{ display: 'none' }}
      />
      
      {/* Content based on active tab */}
      {activeTab === 'text-to-speech' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Text to Speech</CardTitle>
                <CardDescription>Convert text into natural-sounding voices</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Text to Convert
                    </label>
                    <div className="relative">
                      <textarea
                        id="text"
                        rows={6}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter the text you want to convert to speech..."
                        {...register('text', { required: true })}
                      ></textarea>
                      {textValue && (
                        <button
                          type="button"
                          onClick={() => reset()}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Voice
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                        onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{selectedVoice.name}</span>
                          <Badge variant="secondary" size="sm">
                            {selectedVoice.gender === 'female' ? 'Female' : selectedVoice.gender === 'male' ? 'Male' : 'Neutral'}
                          </Badge>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      
                      <AnimatePresence>
                        {showVoiceDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-10 mt-1 w-full rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg"
                          >
                            <div className="p-1 max-h-60 overflow-y-auto">
                              {voices.map((voice) => (
                                <div
                                  key={voice.id}
                                  className={`p-2 rounded-md cursor-pointer ${
                                    selectedVoice.id === voice.id
                                      ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600'
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                                  onClick={() => {
                                    setSelectedVoice(voice);
                                    setShowVoiceDropdown(false);
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{voice.name}</span>
                                    <Badge variant="secondary" size="sm">
                                      {voice.gender === 'female' ? 'Female' : voice.gender === 'male' ? 'Male' : 'Neutral'}
                                    </Badge>
                                  </div>
                                  {voice.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{voice.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Playback Speed: {speed.toFixed(1)}x
                    </label>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">0.5x</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={speed}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        className="flex-1 mx-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">2x</span>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isGenerating}
                    disabled={!textValue.trim() || isGenerating}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Generate Voice
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Sample Texts</CardTitle>
                <CardDescription>Click to use a sample text</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleTexts.map((text, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm group"
                      onClick={() => useTextSample(text)}
                    >
                      <p className="line-clamp-2">{text}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right side - generated voices */}
          <div className="lg:col-span-2">
            <Card variant="bordered" className="h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Generated Voices</CardTitle>
                    <CardDescription>Listen to your generated audio</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={toggleMute}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : <Volume2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      disabled={isMuted}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {generatedVoices.length === 0 && !isGenerating ? (
                  <EmptyState
                    icon={<Mic className="h-8 w-8 text-gray-500 dark:text-gray-400" />}
                    title="No voices generated yet"
                    description="Enter some text and click 'Generate Voice' to create your first AI-generated voice."
                    actions={{
                      primary: {
                        label: "Try a sample text",
                        onClick: () => useTextSample(sampleTexts[Math.floor(Math.random() * sampleTexts.length)])
                      }
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {isGenerating && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
                        <div className="flex flex-col items-center text-center">
                          <RefreshCw className="h-8 w-8 text-primary-600 animate-spin mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Generating voice...</h3>
                          <p className="text-gray-600 dark:text-gray-400">This may take a few moments</p>
                        </div>
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {generatedVoices.map((voice) => (
                        <motion.div
                          key={voice.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 mr-4">
                              <div className="flex items-center mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">{voice.voiceName}</span>
                                <Badge variant="secondary" size="sm" className="mr-2">
                                  {voice.duration ? `${voice.duration} sec` : 'Audio'}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {voice.timestamp.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{voice.text}</p>
                              
                              <div className="mt-2 flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => copyToClipboard(voice.text)}
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1" />
                                  Copy Text
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300"
                                  onClick={() => deleteVoice(voice.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                className={`p-2 rounded-full ${
                                  currentlyPlaying === voice.id 
                                    ? 'bg-primary-600 text-white' 
                                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                                } transition-colors`}
                                onClick={() => togglePlayPause(voice.id, voice.audioUrl)}
                              >
                                {currentlyPlaying === voice.id ? 
                                  <Pause className="h-5 w-5" /> : 
                                  <Play className="h-5 w-5" />
                                }
                              </button>
                              <button
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => downloadAudio(voice.audioUrl, `voice-${voice.id.slice(0, 8)}`)}
                                title="Download"
                              >
                                <Download className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          
                          {currentlyPlaying === voice.id && (
                            <div className="mt-3 px-2">
                              <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-primary-600 animate-audio-progress"></div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - upload controls */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Upload Audio</CardTitle>
              <CardDescription>Upload audio files for transcription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center">
                  {isTranscribing ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <RefreshCw className="h-8 w-8 text-primary-600 animate-spin mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Transcribing audio...</p>
                    </div>
                  ) : (
                    <>
                      <FileAudio className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-4" />
                      
                      {uploadedFile ? (
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {uploadedFile.name}
                          </p>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Badge variant="secondary" size="sm">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {uploadedFile.type.split('/')[1]?.toUpperCase() || 'AUDIO'}
                            </Badge>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBrowseClick}
                            >
                              Change File
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-error-600 dark:text-error-400"
                              onClick={() => setUploadedFile(null)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                            Drag and drop your audio file here, or click to browse
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleBrowseClick}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Browse Files
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isTranscribing}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supported Formats
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">MP3</Badge>
                    <Badge variant="secondary">WAV</Badge>
                    <Badge variant="secondary">M4A</Badge>
                    <Badge variant="secondary">FLAC</Badge>
                    <Badge variant="secondary">OGG</Badge>
                  </div>
                </div>
                
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 text-sm">
                  <div className="flex gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Tips for best results</h3>
                  </div>
                  <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                    <li>Use high-quality audio with minimal background noise</li>
                    <li>Keep files under 25MB for optimal processing</li>
                    <li>Shorter clips (under 5 minutes) are transcribed more accurately</li>
                  </ul>
                </div>
                
                <Button
                  className="w-full"
                  onClick={transcribeAudio}
                  isLoading={isTranscribing}
                  disabled={!uploadedFile || isTranscribing}
                >
                  <MessagesSquare className="h-4 w-4 mr-2" />
                  Transcribe Audio
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Right side - transcription */}
          <Card variant="bordered" className="h-full">
            <CardHeader>
              <CardTitle>Transcription Result</CardTitle>
              <CardDescription>
                {transcription 
                  ? 'Transcription complete' 
                  : 'Your transcribed text will appear here'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTranscribing ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <RefreshCw className="h-8 w-8 text-primary-600 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Transcribing audio...</h3>
                  <p className="text-gray-600 dark:text-gray-400">This may take a few moments</p>
                </div>
              ) : transcription ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="success">Transcription Complete</Badge>
                      <button 
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                        onClick={() => copyToClipboard(transcription)}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {transcription}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Create a download link with the transcription text
                        const blob = new Blob([transcription], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "transcription.txt";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success("Transcription downloaded");
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Text
                    </Button>
                    
                    <Button
                      onClick={() => {
                        copyToClipboard(transcription);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                    <Button
                      variant="subtle"
                      className="w-full"
                      onClick={() => {
                        setActiveTab('text-to-speech');
                        setValue('text', transcription);
                        toast.success('Transcription added to Text-to-Speech');
                      }}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Use for Text-to-Speech
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<FileAudio className="h-8 w-8 text-gray-500 dark:text-gray-400" />}
                  title="No transcription yet"
                  description="Upload an audio file and click 'Transcribe Audio' to convert speech to text."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VoicePage;