import React, { useState } from 'react';
import { 
  PlusCircle, UserPlus, Users, Mail, MoreHorizontal, Search, Crown, 
  UserMinus, UserCog, User, ShieldCheck, Shield 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  joinedAt: Date;
}

const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([
    {
      id: 'usr-1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'owner',
      joinedAt: new Date(2023, 0, 15),
    },
    {
      id: 'usr-2',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      role: 'admin',
      joinedAt: new Date(2023, 3, 10),
    },
    {
      id: 'usr-3',
      name: 'Michael Brown',
      email: 'michael@example.com',
      role: 'member',
      joinedAt: new Date(2023, 6, 5),
    },
    {
      id: 'usr-4',
      name: 'Emily Davis',
      email: 'emily@example.com',
      role: 'member',
      joinedAt: new Date(2023, 8, 20),
    },
  ]);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  
  const filteredTeam = team.filter((member) => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const removeMember = (id: string) => {
    setTeam(team.filter(member => member.id !== id));
    setShowRemoveConfirm(null);
  };
  
  const RoleIcon = ({ role }: { role: string }) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-warning-500" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-primary-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your team members and their access to the platform.
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Team</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {team.length} member{team.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm">
              <tr>
                <th className="py-3 px-6 text-left">Member</th>
                <th className="py-3 px-6 text-left hidden md:table-cell">Role</th>
                <th className="py-3 px-6 text-left hidden md:table-cell">Joined</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTeam.map((member) => (
                <tr 
                  key={member.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mr-3">
                        <span className="text-sm font-medium">{member.name[0]}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center">
                          {member.name}
                          <span className="ml-2 md:hidden flex items-center">
                            <RoleIcon role={member.role} />
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 hidden md:table-cell">
                    <div className="flex items-center">
                      <span className="mr-2">
                        <RoleIcon role={member.role} />
                      </span>
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {member.joinedAt.toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="relative">
                      <button
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setShowMemberMenu(showMemberMenu === member.id ? null : member.id)}
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                      
                      <AnimatePresence>
                        {showMemberMenu === member.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                            onClick={() => setShowMemberMenu(null)}
                          >
                            <div className="py-1">
                              {member.role !== 'owner' && (
                                <button
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <UserCog className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                                  Change Role
                                </button>
                              )}
                              
                              {member.role !== 'owner' && (
                                <button
                                  className="flex w-full items-center px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    setShowMemberMenu(null);
                                    setShowRemoveConfirm(member.id);
                                  }}
                                >
                                  <UserMinus className="h-4 w-4 mr-3 text-error-600 dark:text-error-400" />
                                  Remove Member
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTeam.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No members found</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Team Permissions</h2>
          <div className="space-y-4">
            <div className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <Shield className="h-6 w-6 text-primary-600 mt-0.5 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Roles & Permissions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Control what team members can access and modify within your workspace.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Owner</span>
                    <span className="text-gray-600 dark:text-gray-400">Full access to all features and settings</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Admin</span>
                    <span className="text-gray-600 dark:text-gray-400">Can manage team members and most settings</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Member</span>
                    <span className="text-gray-600 dark:text-gray-400">Can use AI tools but cannot change settings</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <Users className="h-6 w-6 text-primary-600 mt-0.5 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Usage Limits</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Control how many resources each team member can use.
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Monthly Credits</span>
                      <span className="font-medium">5,000 / 10,000</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upgrade Team Plan</h2>
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg p-4 text-white mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]"></div>
            <div className="relative">
              <h3 className="font-semibold mb-1">Current Plan: Free</h3>
              <p className="text-sm text-white/90 mb-4">Limited to 4 team members</p>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white w-full">
                Upgrade to Pro
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Pro Plan Benefits</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Unlimited team members</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Advanced role management</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Usage analytics and reporting</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm">50,000 monthly credits</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Priority support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Invite member modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite Team Member</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Add a new member to your team
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-l-lg text-gray-500 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      className="flex-1 rounded-none rounded-r-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="colleague@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    defaultValue="member"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Admins can manage team members and settings. Members can only use the platform.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Personal Message (optional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="I'd like to invite you to join our team..."
                  ></textarea>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowInviteModal(false)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Remove member confirmation dialog */}
        {showRemoveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remove Team Member</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to remove this team member? They will lose access to your team's resources.
                </p>
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setShowRemoveConfirm(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => removeMember(showRemoveConfirm)}>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Member
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

export default TeamPage;