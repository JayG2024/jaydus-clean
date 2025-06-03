import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '../../context/SupabaseAuthContext';
import { Button } from '../../components/ui/Button';

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const password = watch('password', '');
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      await signup(data.email, data.password, data.name);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="card p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create an account</h1>
        <p className="text-gray-600 dark:text-gray-400">Start your journey with Jaydus</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            className="input w-full"
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input w-full"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Invalid email address',
              } 
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input w-full"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              }
            })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="input w-full"
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;