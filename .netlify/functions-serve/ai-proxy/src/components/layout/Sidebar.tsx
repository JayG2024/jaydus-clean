import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Users, 
  Settings, 
  User, 
  Bot,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/SupabaseAuthContext';

type SidebarItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { userData } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  const mainItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: MessageSquare, label: 'Chat', href: '/chat', badge: 'New' },
    { icon: ImageIcon, label: 'Images', href: '/images' },
    { icon: Mic, label: 'Voice', href: '/voice' },
    { icon: Bot, label: 'Assistants', href: '/assistants' },
  ];
  
  const managementItems: SidebarItem[] = [
    { icon: Users, label: 'Team', href: '/team' },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];
  
  const SidebarItem = ({ item }: { item: SidebarItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    
    return (
      <li>
        <Link
          to={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all group relative",
            isActive 
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium" 
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          title={collapsed ? item.label : undefined}
        >
          <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-600 dark:text-primary-400")} />
          <span className={cn("transition-opacity", collapsed ? "opacity-0 w-0" : "opacity-100")}>
            {item.label}
          </span>
          
          {item.badge && !collapsed && (
            <span className="ml-auto px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              {item.badge}
            </span>
          )}
          
          {item.badge && collapsed && (
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary-500 border-2 border-white dark:border-gray-900"></span>
          )}
          
          {isActive && !collapsed && (
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></div>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {item.label}
              {item.badge && (
                <span className="ml-1 px-1 py-0.5 text-xs rounded-sm bg-primary-500 text-white">
                  {item.badge}
                </span>
              )}
            </div>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300",
      collapsed ? "w-16 items-center" : "w-64"
    )}>
      <div className={cn("p-4 flex-1", collapsed && "flex flex-col items-center")}>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 p-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 shadow-sm hover:text-gray-900 dark:hover:text-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <nav className="space-y-6 mt-4">
          <div>
            <h2 className={cn(
              "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3",
              collapsed && "sr-only"
            )}>
              AI Tools
            </h2>
            <ul className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
              {mainItems.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className={cn(
              "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3",
              collapsed && "sr-only"
            )}>
              Management
            </h2>
            <ul className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
              {managementItems.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </ul>
          </div>
        </nav>
      </div>
      
      <div className={cn(
        "border-t border-gray-200 dark:border-gray-800 p-4",
        collapsed ? "w-full flex justify-center" : ""
      )}>
        {!collapsed ? (
          <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4">
            <h3 className="font-medium text-primary-600 dark:text-primary-400 mb-2">
              {userData?.subscription && userData.subscription !== 'free'
                ? 'Your Plan: ' + userData.subscription.charAt(0).toUpperCase() + userData.subscription.slice(1)
                : 'Upgrade to Pro'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {userData?.subscription && userData.subscription !== 'free'
                ? 'Manage your subscription or explore other plans.'
                : 'Get unlimited access to all AI tools and features.'}
            </p>
            <Link
              to="/upgrade"
              className="block py-2 px-3 text-center text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {userData?.subscription && userData.subscription !== 'free'
                ? 'Manage Plan'
                : 'Upgrade Now'}
            </Link>
          </div>
        ) : (
          <Link
            to="/upgrade"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/30 transition-colors"
            title="Upgrade Plan"
          >
            <CreditCard className="h-5 w-5" />
          </Link>
        )}
      </div>

      {!collapsed && (
        <div className="p-4 text-center">
          <Link to="/help" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex justify-center items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Help & Resources
          </Link>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;