import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ArrowRight, MessageSquare, Image, Mic, Bot, Users, ChevronRight, Star, CheckCircle, Sun, Moon } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';

const HomePage: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { mode, setMode, isDark } = useTheme();
  const { scrollYProgress } = useScroll();
  const featuresOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  
  const toggleDarkMode = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Automatically advance testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Sample testimonials
  const testimonials = [
    {
      quote: "Jaydus has revolutionized our creative workflow. We're now producing content in half the time with twice the quality.",
      author: "Emily Johnson",
      role: "Creative Director, DesignCraft",
      avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      quote: "The AI assistants we've built with Jaydus have transformed our customer support. Our response time is down 70% while satisfaction is up.",
      author: "Michael Chen",
      role: "Head of Support, TechWave",
      avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      quote: "As a small business owner, Jaydus gives me access to AI capabilities I thought were only available to big companies. Game changer.",
      author: "Sarah Rodriguez",
      role: "Founder, Artisan Goods",
      avatar: "https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=150"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Jaydus</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Testimonials
              </a>
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" size="default">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="default" className="hidden md:flex">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-transparent dark:from-primary-950/20 dark:to-transparent"></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:w-1/2 text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 inline-block">
                  AI-Powered
                </span>{" "}
                Tools for Creative Teams
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                Access powerful AI capabilities including image generation, chat models, and voiceover services in one unified platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Get Started 
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Log in to Dashboard
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <img
                      key={i}
                      src={`https://images.pexels.com/photos/${2000000 + i}/pexels-photo-${2000000 + i}.jpeg?auto=compress&cs=tinysrgb&w=50`}
                      alt={`User ${i}`}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-950 object-cover"
                    />
                  ))}
                </div>
                <div className="ml-4 flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">5.0</span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400 text-sm">(2.5k+ users)</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:w-1/2"
            >
              <div className="relative mx-auto w-full max-w-md transform hover:scale-[1.02] transition-all">
                <div className="absolute -top-4 -left-4 h-72 w-72 bg-primary-200 dark:bg-primary-900/30 rounded-full filter blur-3xl opacity-70"></div>
                <div className="absolute -bottom-4 -right-4 h-72 w-72 bg-secondary-200 dark:bg-secondary-900/30 rounded-full filter blur-3xl opacity-70"></div>
                <div className="relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/8294608/pexels-photo-8294608.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="AI Robot Assistant"
                    className="w-full h-auto"
                  />
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-success-100 dark:bg-success-900/30 p-2 rounded-lg mr-3">
                          <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">AI Task Complete</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Generated 5 images in 12s</p>
                        </div>
                      </div>
                      <button className="text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Brands */}
          <div className="mt-20">
            <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
              Trusted by innovative companies
            </p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
              {['TechCorp', 'Innovate AI', 'FutureWorks', 'Create Co.', 'NextGen'].map((brand, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-xl font-bold text-gray-400 dark:text-gray-600"
                >
                  {brand}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
        <motion.div 
          className="container mx-auto px-4 sm:px-6"
          style={{ opacity: featuresOpacity }}
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                All-in-One AI Platform
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Everything you need to harness the power of AI for your creative projects.
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature cards */}
            <FeatureCard 
              icon={<MessageSquare className="h-6 w-6" />}
              title="AI Chat"
              description="Generate content, answer questions, and brainstorm ideas with advanced AI models."
              color="bg-gradient-to-br from-primary-500 to-primary-600"
              delay={0.1}
              href="/signup"
            />
            
            <FeatureCard 
              icon={<Image className="h-6 w-6" />}
              title="Image Generation"
              description="Create stunning images from text prompts with cutting-edge AI models."
              color="bg-gradient-to-br from-secondary-500 to-secondary-600"
              delay={0.2}
              href="/signup"
            />
            
            <FeatureCard 
              icon={<Mic className="h-6 w-6" />}
              title="Voiceover & Transcription"
              description="Convert text to natural-sounding speech or transcribe audio with high accuracy."
              color="bg-gradient-to-br from-accent-500 to-accent-600"
              delay={0.3}
              href="/signup"
            />
            
            <FeatureCard 
              icon={<Bot className="h-6 w-6" />}
              title="Custom AI Assistants"
              description="Build specialized AI assistants trained on your own data for specific use cases."
              color="bg-gradient-to-br from-success-500 to-success-600"
              delay={0.4}
              href="/signup"
            />
            
            <FeatureCard 
              icon={<Users className="h-6 w-6" />}
              title="Team Collaboration"
              description="Collaborate seamlessly with team members, share resources, and manage access."
              color="bg-gradient-to-br from-warning-500 to-warning-600"
              delay={0.5}
              href="/signup"
            />
            
            {/* Feature 6 - CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="relative group bg-gradient-to-br from-primary-600 to-secondary-600 p-8 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:20px_20px]"></div>
              <div className="relative">
                <h3 className="text-xl font-semibold mb-3 text-white">Start Using Jaydus Today</h3>
                <p className="text-white/90 mb-6">
                  Join thousands of teams already using Jaydus to power their creative projects with AI.
                </p>
                <Link to="/signup">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white group">
                    Sign up for free <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hear from teams that have transformed their workflows with Jaydus Platform
            </p>
          </motion.div>

          <div className="relative mx-auto max-w-4xl">
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 flex items-center">
              <button 
                className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400"
                onClick={() => setActiveTestimonial((activeTestimonial - 1 + testimonials.length) % testimonials.length)}
              >
                <ChevronRight className="h-4 w-4 transform rotate-180" />
              </button>
            </div>
            
            <div className="overflow-hidden h-[300px] relative">
              <motion.div 
                animate={{ x: `-${activeTestimonial * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex h-full"
              >
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index} 
                    className="w-full flex-shrink-0 flex items-center justify-center px-8"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: activeTestimonial === index ? 1 : 0.4, scale: activeTestimonial === index ? 1 : 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="text-center"
                    >
                      <div className="mb-6 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30"></div>
                        </div>
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.author} 
                          className="h-16 w-16 mx-auto rounded-full object-cover relative z-10 border-2 border-white dark:border-gray-950"
                        />
                      </div>
                      <blockquote className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                        "{testimonial.quote}"
                      </blockquote>
                      <div>
                        <cite className="font-medium text-gray-900 dark:text-white not-italic">
                          {testimonial.author}
                        </cite>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.role}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </div>

            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 flex items-center justify-end">
              <button 
                className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400"
                onClick={() => setActiveTestimonial((activeTestimonial + 1) % testimonials.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-${activeTestimonial === index ? '8' : '2'} rounded-full transition-all ${
                  activeTestimonial === index 
                    ? 'bg-primary-600 dark:bg-primary-500' 
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
                onClick={() => setActiveTestimonial(index)}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that's right for you and your team.
            </p>
          </motion.div>
          
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button className="px-4 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm font-medium">
                Monthly
              </button>
              <button className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 font-medium">
                Yearly 
                <span className="ml-1 text-xs bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-400 px-1.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Free</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Get started with the basics</p>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">$0</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/month</span>
                </div>
                
                <ul className="mt-6 space-y-3">
                  <FeatureItem text="5,000 AI credits per month" />
                  <FeatureItem text="1 GB storage" />
                  <FeatureItem text="Basic AI models" />
                  <FeatureItem text="5 team members" />
                  <FeatureItem text="Email support" isIncluded={false} />
                </ul>
                
                <div className="mt-8">
                  <Link to="/signup">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
            
            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl border-2 border-primary-600 dark:border-primary-500 overflow-hidden shadow-lg relative scale-105"
            >
              <div className="bg-primary-600 py-1.5 px-4 text-center">
                <span className="text-xs font-medium text-white uppercase tracking-wide">Most Popular</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">For individuals and small teams</p>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">$19</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/month</span>
                </div>
                
                <ul className="mt-6 space-y-3">
                  <FeatureItem text="50,000 AI credits per month" />
                  <FeatureItem text="10 GB storage" />
                  <FeatureItem text="Access to all premium AI models" />
                  <FeatureItem text="Unlimited team members" />
                  <FeatureItem text="Priority support" />
                </ul>
                
                <div className="mt-8">
                  <Link to="/signup">
                    <Button
                      className="w-full"
                    >
                      Get Pro
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
            
            {/* Business Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Business</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">For larger teams and businesses</p>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">$49</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/month</span>
                </div>
                
                <ul className="mt-6 space-y-3">
                  <FeatureItem text="150,000 AI credits per month" />
                  <FeatureItem text="50 GB storage" />
                  <FeatureItem text="Access to all premium AI models" />
                  <FeatureItem text="Unlimited team members" />
                  <FeatureItem text="24/7 priority support" />
                </ul>
                
                <div className="mt-8">
                  <Link to="/signup">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Get Business
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/contact">
              <Button variant="link" size="lg" className="text-primary-600 dark:text-primary-400">
                Need a custom plan? Contact us <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your Creative Workflow?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of teams already using Jaydus to power their creative projects with AI.
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                  Start Free Trial
                </Button>
              </Link>
              <p className="mt-4 text-white/80 text-sm">No credit card required. 14-day free trial.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <BrainCircuit className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Jaydus</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                About
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                Pricing
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                Contact
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                Privacy
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                Terms
              </a>
            </div>
          </div>
          
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-800 pt-8">
            <p>© 2025 Jaydus Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color, delay, href }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
  delay: number;
  href: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5 }}
    >
      <Link to={href} className="block h-full">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-full">
          <div className={`h-12 w-12 flex items-center justify-center rounded-lg ${color} mb-6`}>
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {description}
          </p>
          <div className="text-primary-600 dark:text-primary-400 font-medium flex items-center">
            Learn more <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const FeatureItem = ({ text, isIncluded = true }: { text: string; isIncluded?: boolean }) => (
  <li className="flex items-start">
    <svg 
      className={`h-5 w-5 mr-2 flex-shrink-0 ${
        isIncluded ? 'text-success-500' : 'text-gray-300 dark:text-gray-700'
      }`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    <span className={`text-gray-600 dark:text-gray-400 text-sm ${
      !isIncluded && 'line-through text-gray-400 dark:text-gray-600'
    }`}>
      {text}
    </span>
  </li>
);

export default HomePage;