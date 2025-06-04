import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User, Mail, Key, Trash2, BrainCircuit } from 'lucide-react';
import { useAuth } from "../../context/FirebaseAuthContext";
import { Button } from '../../components/ui/Button';
import { AnimatePresence, motion } from 'framer-motion';

type ProfileForm = {
  displayName: string;
  email: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ProfilePage: React.FC = () => {
  const { currentUser, userData, updateUserProfile } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors }, setValue: setProfileValue } = useForm<ProfileForm>({
    defaultValues: {
      displayName: userData?.displayName || '',
      email: userData?.email || '',
    }
  });
  
  const { register: registerPassword, handleSubmit: handleSubmitPassword, watch: watchPassword, formState: { errors: passwordErrors } } = useForm<PasswordForm>();
  const newPassword = watchPassword('newPassword');
  
  // Update the form when user data changes
  useEffect(() => {
    if (userData) {
      setProfileValue('displayName', userData.displayName || '');
      setProfileValue('email', userData.email || '');
      setProfilePhotoUrl(userData.photoURL || null);
    }
  }, [userData, setProfileValue]);
  
  const onSubmitProfile = async (data: ProfileForm) => {
    setIsUpdatingProfile(true);
    
    try {
      const updateData: { displayName?: string; photoURL?: string } = {};
      
      // Only update displayName if it changed
      if (data.displayName !== userData?.displayName) {
        updateData.displayName = data.displayName;
      }
      
      // Only update photoURL if it changed
      if (profilePhotoUrl !== userData?.photoURL) {
        updateData.photoURL = profilePhotoUrl;
      }
      
      // Only make the API call if something changed
      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(updateData);
        toast.success('Profile updated successfully');
      } else {
        toast.info('No changes to save');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  const onSubmitPassword = async (data: PasswordForm) => {
    setIsUpdatingPassword(true);
    
    try {
      // In a real implementation, this would use Supabase Auth to update the password
      // Since we're using a mock, we'll just simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'delete my account') {
      toast.error('Please type "delete my account" to confirm');
      return;
    }
    
    // In a real implementation, this would delete the user's account
    // Since we're using a mock, we'll just simulate success after a delay
    setTimeout(() => {
      toast.success('Account deleted successfully');
      setShowDeleteConfirm(false);
    }, 1500);
  };
  
  const handlePhotoUrlChange = (url: string) => {
    setProfilePhotoUrl(url);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - profile info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your account's profile information.
              </p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 overflow-hidden">
                      {profilePhotoUrl ? (
                        <img 
                          src={profilePhotoUrl} 
                          alt={userData?.displayName || 'User'} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-semibold">
                          {userData?.displayName?.[0] || userData?.email?.[0] || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Photo URL
                        </label>
                        <input
                          type="url"
                          id="photoUrl"
                          value={profilePhotoUrl || ''}
                          onChange={(e) => handlePhotoUrlChange(e.target.value)}
                          className="px-3 py-2 rounded-lg w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enter a URL for your profile photo
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-l-lg text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="displayName"
                      type="text"
                      className="flex-1 rounded-none rounded-r-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      {...registerProfile('displayName', { required: 'Name is required' })}
                    />
                  </div>
                  {profileErrors.displayName && (
                    <p className="mt-1 text-sm text-error-600 dark:text-error-400">{profileErrors.displayName.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-l-lg text-gray-500 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      className="flex-1 rounded-none rounded-r-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      {...registerProfile('email')}
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    To change your email, please contact support.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isUpdatingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Update Password */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Update Password</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ensure your account is using a secure password.
              </p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-l-lg text-gray-500 dark:text-gray-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      id="currentPassword"
                      type="password"
                      className="flex-1 rounded-none rounded-r-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      {...registerPassword('currentPassword', { required: 'Current password is required' })}
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-error-600 dark:text-error-400">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-l-lg text-gray-500 dark:text-gray-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      id="newPassword"
                      type="password"
                      className="flex-1 rounded-none rounded-r-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      {...registerPassword('newPassword', { 
                        required: 'New password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        }
                      })}
                    />
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-error-600 dark:text-error-400">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-l-lg text-gray-500 dark:text-gray-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      className="flex-1 rounded-none rounded-r-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      {...registerPassword('confirmPassword', { 
                        required: 'Please confirm your password',
                        validate: value => value === newPassword || 'Passwords do not match'
                      })}
                    />
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600 dark:text-error-400">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isUpdatingPassword}>
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Delete Account */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-medium text-error-600 dark:text-error-400">Delete Account</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all associated data.
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-error-50 dark:bg-error-950/20 text-error-700 dark:text-error-300 p-4 rounded-lg mb-4">
                <p className="text-sm">
                  Once your account is deleted, all of your resources and data will be permanently deleted. Before
                  deleting your account, please download any data or information that you wish to retain.
                </p>
              </div>
              
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
        
        {/* Right column - account summary */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Summary</h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mb-4 overflow-hidden">
                  {userData?.photoURL ? (
                    <img 
                      src={userData.photoURL} 
                      alt={userData.displayName || 'User'} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold">
                      {userData?.displayName?.[0] || userData?.email?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                  {userData?.displayName || 'User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{userData?.email || currentUser?.email}</p>
                
                <div className="flex items-center">
                  <div className="px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-medium">
                    {userData?.subscription ? `${userData.subscription.charAt(0).toUpperCase()}${userData.subscription.slice(1)} Plan` : 'Free Plan'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usage This Month</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>AI Credits</span>
                        <span className="font-medium">1,240 / 5,000</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Storage</span>
                        <span className="font-medium">128 MB / 1 GB</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-secondary-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {userData?.createdAt 
                          ? new Date(userData.createdAt).toLocaleDateString() 
                          : 'Jan 15, 2025'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {userData?.lastLoginAt
                          ? new Date(userData.lastLoginAt).toLocaleDateString()
                          : 'Today'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Account ID</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentUser?.id ? `JAY-${currentUser.id.substring(0, 6)}` : 'JAY-000000'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subscription */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Subscription</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <BrainCircuit className="h-5 w-5 text-primary-600" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {userData?.subscription
                      ? `${userData.subscription.charAt(0).toUpperCase()}${userData.subscription.slice(1)} Plan`
                      : 'Free Plan'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {userData?.subscription && userData.subscription.status === 'active'
                    ? 'You are on the pro plan with advanced features and usage.'
                    : 'You are currently on the free plan with limited features and usage.'}
                </p>
                <Button className="w-full" variant="outline">
                  {userData?.subscription === 'pro' ? 'Manage Subscription' : 'Upgrade to Pro'}
                </Button>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pro Plan Benefits</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">50,000 monthly credits</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">10 GB storage for images and files</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">Access to all premium AI models</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete account confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-error-600 dark:text-error-400 mb-2">Delete Account</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you absolutely sure you want to delete your account? This action cannot be undone and will result in the loss of all your data, including projects, settings, and history.
                </p>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Please type "delete my account" to confirm
                  </label>
                  <input
                    id="confirm"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-error-500 mb-6"
                    placeholder="delete my account"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'delete my account'}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Permanently Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;