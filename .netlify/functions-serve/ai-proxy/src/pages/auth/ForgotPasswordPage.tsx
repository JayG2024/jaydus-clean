import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '../../context/SupabaseAuthContext';
import { Button } from '../../components/ui/Button';

type FormData = {
  email: string;
};

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      await resetPassword(data.email);
      setIsSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="card p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset your password</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>
      
      {isSubmitted ? (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-success-100 text-success-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Check your email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a password reset link to your email address.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;