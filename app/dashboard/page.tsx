"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, MessageSquare, Image, Mic, Bot, ArrowUpRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    creditsUsed: 0,
    imagesGenerated: 0,
    chatMessages: 0,
    voiceoverMinutes: 0
  });

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Fetch user stats from Supabase
        if (user) {
          const { data: usageData, error } = await supabase
            .from('usage')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (usageData) {
            setStats({
              creditsUsed: usageData.ai_credits_used || 0,
              imagesGenerated: usageData.images_generated || 0,
              chatMessages: usageData.chat_messages || 0,
              voiceoverMinutes: usageData.voice_minutes || 0
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6 rounded-xl relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:16px_16px]"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">
            Welcome back, {user?.user_metadata?.full_name || 'User'}
          </h1>
          <p className="text-white/80">
            Here's what's happening with your AI tools today.
          </p>
        </div>
        <div className="relative z-10 flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline" size="default" className="border-white/30 text-white hover:bg-white/10">
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary-600" />
            Usage Statistics
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Credits Used" 
            value={stats.creditsUsed.toLocaleString()} 
            change="12%" 
            isPositive={false} 
            icon={<Zap className="h-5 w-5" />}
            loading={loading}
          />
          <StatCard 
            title="Images Generated" 
            value={stats.imagesGenerated.toLocaleString()} 
            change="8%" 
            isPositive={true}
            icon={<Image className="h-5 w-5" />}
            loading={loading}
          />
          <StatCard 
            title="Chat Messages" 
            value={stats.chatMessages.toLocaleString()} 
            change="24%" 
            isPositive={true}
            icon={<MessageSquare className="h-5 w-5" />} 
            loading={loading}
          />
          <StatCard 
            title="Voiceover Minutes" 
            value={stats.voiceoverMinutes.toLocaleString()} 
            change="5%" 
            isPositive={true}
            icon={<Mic className="h-5 w-5" />}
            loading={loading}
          />
        </div>
      </div>
      
      {/* AI Tools */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ToolCard
            icon={<MessageSquare className="h-6 w-6 text-white" />}
            title="AI Chat"
            description="Generate content, answer questions, and brainstorm ideas with advanced AI models."
            href="/dashboard/chat"
            color="bg-gradient-to-br from-primary-500 to-primary-600"
          />
          
          <ToolCard
            icon={<Image className="h-6 w-6 text-white" />}
            title="Image Generation"
            description="Create stunning images from text prompts with cutting-edge AI models."
            href="/dashboard/images"
            color="bg-gradient-to-br from-secondary-500 to-secondary-600"
          />
          
          <ToolCard
            icon={<Mic className="h-6 w-6 text-white" />}
            title="Voiceover & Transcription"
            description="Convert text to natural-sounding speech or transcribe audio with high accuracy."
            href="/dashboard/voice"
            color="bg-gradient-to-br from-accent-500 to-accent-600"
          />
          
          <ToolCard
            icon={<Bot className="h-6 w-6 text-white" />}
            title="Custom AI Assistants"
            description="Create specialized AI assistants trained on your own data for specific tasks."
            href="/dashboard/assistants"
            color="bg-gradient-to-br from-success-500 to-success-600"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, change, isPositive, icon, loading }: StatCardProps) {
  return (
    <Card className="group hover:border-gray-300 dark:hover:border-gray-700 transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            {loading ? (
              <div className="h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2"></div>
            ) : (
              <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">{value}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${
            isPositive 
              ? 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400' 
              : 'bg-error-100 dark:bg-error-900/20 text-error-600 dark:text-error-400'
          }`}>
            {icon}
          </div>
        </div>
        
        {loading ? (
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2"></div>
        ) : (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-medium ${isPositive ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'} flex items-center`}>
              {isPositive ? '↑' : '↓'} {change}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}

function ToolCard({ icon, title, description, href, color }: ToolCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full hover:shadow-md transition-all">
        <CardContent className="p-6">
          <div className={`${color} rounded-lg w-12 h-12 flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
            {icon}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
          <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium">
            Access Tool
            <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}