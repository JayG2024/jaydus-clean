import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Image, 
  Mic, 
  Bot, 
  Users, 
  ArrowUpRight, 
  ChevronRight, 
  Clock,
  Zap,
  BarChart3,
  BrainCircuit,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, isPositive, icon, loading }) => {
  return (
    <Card variant="bordered" className="group hover:border-gray-300 dark:hover:border-gray-700 transition-all">
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
};

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkTo: string;
  color: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, linkTo, color }) => {
  return (
    <Link to={linkTo} className="group">
      <Card variant="interactive" className="h-full">
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
};

const RecentActivityItem: React.FC<{ 
  type: string; 
  title: string; 
  time: string; 
  status: string; 
  onClick?: () => void;
}> = ({ type, title, time, status, onClick }) => {
  let statusColor = '';
  let icon;
  
  switch (status) {
    case 'completed':
      statusColor = 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-950/50';
      break;
    case 'in-progress':
      statusColor = 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50';
      break;
    case 'failed':
      statusColor = 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/50';
      break;
  }
  
  switch (type) {
    case 'chat':
      icon = <MessageSquare className="h-4 w-4" />;
      break;
    case 'image':
      icon = <Image className="h-4 w-4" />;
      break;
    case 'voice':
      icon = <Mic className="h-4 w-4" />;
      break;
    case 'assistant':
      icon = <Bot className="h-4 w-4" />;
      break;
    default:
      icon = <MessageSquare className="h-4 w-4" />;
  }
  
  return (
    <div 
      className="flex items-center py-3 border-b border-gray-200 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors px-2 rounded-md"
      onClick={onClick}
    >
      <div className="flex-shrink-0 mr-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
          {icon}
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{time}</p>
      </div>
      <div className="flex-shrink-0 ml-3">
        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor}`}>
          {status.replace('-', ' ')}
        </span>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const openActivityItem = (itemType: string, itemTitle: string) => {
    // In a real implementation, this would navigate to the detailed view
    console.log(`Opening ${itemType} item: ${itemTitle}`);
    
    // Example navigation:
    // if (itemType === 'chat') navigate(`/chat/${itemId}`);
  };

  return (
    <div className="space-y-8">
      {/* Welcome greeting with animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6 rounded-xl relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:16px_16px]"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">
              Welcome back, {userData?.displayName || currentUser?.displayName || 'User'}
            </h1>
            <p className="text-white/80">
              Here's what's happening with your AI tools today.
            </p>
          </div>
          <div className="relative z-10 flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="default" className="border-white/30 text-white hover:bg-white/10">
              <Users className="h-4 w-4 mr-2" />
              Invite Team
            </Button>
            <Button variant="default" size="default" className="bg-white text-primary-600 hover:bg-white/90">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary-600" />
            Usage Statistics
          </h2>
          <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Credits Used" 
              value="3,240" 
              change="12%" 
              isPositive={false} 
              icon={<Zap className="h-5 w-5" />}
              loading={loading}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Images Generated" 
              value="128" 
              change="8%" 
              isPositive={true}
              icon={<Image className="h-5 w-5" />}
              loading={loading}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Chat Messages" 
              value="1,024" 
              change="24%" 
              isPositive={true}
              icon={<MessageSquare className="h-5 w-5" />} 
              loading={loading}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Voiceover Minutes" 
              value="45" 
              change="5%" 
              isPositive={true}
              icon={<Mic className="h-5 w-5" />}
              loading={loading}
            />
          </motion.div>
        </div>
      </motion.div>
      
      {/* AI Tools */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-primary-600" />
            AI Tools
          </h2>
          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants}>
            <ToolCard
              icon={<MessageSquare className="h-6 w-6 text-white" />}
              title="AI Chat"
              description="Generate content, answer questions, and brainstorm ideas with advanced AI models."
              linkTo="/chat"
              color="bg-gradient-to-br from-primary-500 to-primary-600"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <ToolCard
              icon={<Image className="h-6 w-6 text-white" />}
              title="Image Generation"
              description="Create stunning images from text prompts with cutting-edge AI models."
              linkTo="/images"
              color="bg-gradient-to-br from-secondary-500 to-secondary-600"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <ToolCard
              icon={<Mic className="h-6 w-6 text-white" />}
              title="Voiceover & Transcription"
              description="Convert text to natural-sounding speech or transcribe audio with high accuracy."
              linkTo="/voice"
              color="bg-gradient-to-br from-accent-500 to-accent-600"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <ToolCard
              icon={<Bot className="h-6 w-6 text-white" />}
              title="Custom AI Assistants"
              description="Create specialized AI assistants trained on your own data for specific tasks."
              linkTo="/assistants"
              color="bg-gradient-to-br from-success-500 to-success-600"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <ToolCard
              icon={<Users className="h-6 w-6 text-white" />}
              title="Team Management"
              description="Invite team members, manage permissions, and collaborate on AI projects."
              linkTo="/team"
              color="bg-gradient-to-br from-warning-500 to-warning-600"
            />
          </motion.div>
          
          {/* Upgrade Call-to-Action */}
          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl p-6 h-full flex flex-col relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:20px_20px]"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-white mb-2">Upgrade to Pro</h3>
                <p className="text-white/80 mb-6">
                  Get unlimited access to all AI tools, priority support, and advanced features.
                </p>
                <Link to="/upgrade">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                    View Plans <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant="bordered">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest actions and their status
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-3"></div>
                    <div className="flex-grow">
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full ml-3"></div>
                  </div>
                ))
              ) : (
                <>
                  <RecentActivityItem
                    type="image"
                    title="Beach sunset landscape"
                    time="Just now"
                    status="completed"
                    onClick={() => openActivityItem('image', 'Beach sunset landscape')}
                  />
                  <RecentActivityItem
                    type="chat"
                    title="Content writing assistant"
                    time="2 hours ago"
                    status="in-progress"
                    onClick={() => openActivityItem('chat', 'Content writing assistant')}
                  />
                  <RecentActivityItem
                    type="voice"
                    title="Product demo voiceover"
                    time="5 hours ago"
                    status="completed"
                    onClick={() => openActivityItem('voice', 'Product demo voiceover')}
                  />
                  <RecentActivityItem
                    type="assistant"
                    title="Customer support training"
                    time="Yesterday"
                    status="in-progress"
                    onClick={() => openActivityItem('assistant', 'Customer support training')}
                  />
                  <RecentActivityItem
                    type="image"
                    title="Abstract art composition"
                    time="Yesterday"
                    status="failed"
                    onClick={() => openActivityItem('image', 'Abstract art composition')}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-primary-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
                ))
              ) : (
                <>
                  <Link to="/chat" className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center mr-4">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">New Chat</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Start a new AI conversation</p>
                    </div>
                  </Link>
                  
                  <Link to="/images" className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 flex items-center justify-center mr-4">
                      <Image className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Generate Image</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Create images from text</p>
                    </div>
                  </Link>
                  
                  <Link to="/voice" className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 flex items-center justify-center mr-4">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">New Voiceover</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Convert text to speech</p>
                    </div>
                  </Link>
                  
                  <Link to="/assistants" className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 flex items-center justify-center mr-4">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Create Assistant</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Build a custom AI assistant</p>
                    </div>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;