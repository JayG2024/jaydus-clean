import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Set isFirstRender to false after the first render
  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main 
            key={location.pathname}
            initial={isFirstRender ? { opacity: 1 } : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1 p-6 overflow-auto"
          >
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardLayout;