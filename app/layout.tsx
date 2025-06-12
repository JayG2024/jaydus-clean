import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Jaydus Platform - AI Tools Dashboard',
  description: 'Access powerful AI tools for image generation, chat models, and voiceover services in one platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-950`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <Toaster 
              position="top-right" 
              toastOptions={{
                className: 'border border-gray-200 dark:border-gray-800',
                style: {
                  background: 'var(--background, white)',
                  color: 'var(--foreground, black)',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}