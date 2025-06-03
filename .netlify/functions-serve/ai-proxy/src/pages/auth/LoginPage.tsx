import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../../context/SupabaseAuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

type FormData = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '' 
    }
  });
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!', {
        description: 'Successfully logged in to your account',
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: error.message || 'Check your credentials and try again',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card variant="elevated" className="bg-white dark:bg-gray-900 w-full">
      <CardContent className="p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400">Log in to your Jaydus account</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              label="Email"
              id="email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              placeholder="youremail@example.com"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Invalid email address',
                } 
              })}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 
                text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.password.message}</p>
            )}
          </div>
          
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Log in
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginPage;