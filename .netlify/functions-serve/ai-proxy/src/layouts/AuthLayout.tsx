import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

const AuthLayout: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  // Load a random background image on mount
  useEffect(() => {
    const imageIds = [
      '3571551', '3861969', '1181263', '3183132', 
      '2559941', '4050388', '2559941', '3861969'
    ];
    const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
    setBackgroundImage(`https://images.pexels.com/photos/${randomId}/pexels-photo-${randomId}.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`);
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <BrainCircuit className="h-10 w-10 text-primary-600 mx-auto animate-pulse" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
      {/* Left side - Brand */}
      <div 
        className="hidden md:flex md:w-1/2 text-white p-8 flex-col justify-between relative overflow-hidden"
        style={{ 
          background: backgroundImage 
            ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})` 
            : 'linear-gradient(to right, #2563eb, #7c3aed)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <BrainCircuit className="h-10 w-10" />
          <h1 className="text-2xl font-bold">Jaydus Platform</h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold mb-4 leading-tight max-w-md">
            Unlock the Power of AI for Your Creative Workflow
          </h2>
          <p className="text-lg text-gray-200 mb-8 max-w-md">
            Access powerful AI tools for image generation, chat models, and voiceover services in one unified platform.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/80 backdrop-blur">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium">Create with AI</h3>
                <p className="text-gray-300">Generate stunning images, have intelligent conversations, and create natural-sounding voiceovers.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/80 backdrop-blur">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium">Collaborate with Your Team</h3>
                <p className="text-gray-300">Share resources, manage projects, and work together seamlessly with team accounts.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/80 backdrop-blur">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium">Build Custom Assistants</h3>
                <p className="text-gray-300">Create AI assistants trained on your specific data to handle specialized tasks.</p>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8"
          >
            <Button 
              size="lg" 
              className="bg-white text-primary-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/signup'}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
        
        <div className="text-sm text-gray-300">
          © 2025 Jaydus Platform. All rights reserved.
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-gray-900 md:bg-gray-50 md:dark:bg-gray-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden mb-8 flex items-center justify-center">
            <BrainCircuit className="h-10 w-10 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jaydus Platform</h1>
          </div>
          
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;