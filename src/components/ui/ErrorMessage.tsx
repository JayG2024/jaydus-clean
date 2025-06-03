import React from 'react';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import { ErrorSeverity } from '../../utils/errorLogger';

interface ErrorMessageProps {
  message: string;
  severity?: ErrorSeverity;
  className?: string;
  onDismiss?: () => void;
  showIcon?: boolean;
  showDismiss?: boolean;
}

/**
 * A component for displaying error messages with consistent styling
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  severity = ErrorSeverity.ERROR,
  className = '',
  onDismiss,
  showIcon = true,
  showDismiss = false,
}) => {
  // Define styles based on severity
  const getSeverityStyles = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return {
          container: 'bg-error-50 dark:bg-error-900/20 border-error-300 dark:border-error-800 text-error-800 dark:text-error-300',
          icon: <XCircle className="h-5 w-5 text-error-500 dark:text-error-400" />,
        };
      case ErrorSeverity.ERROR:
        return {
          container: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-700 dark:text-error-300',
          icon: <AlertTriangle className="h-5 w-5 text-error-500 dark:text-error-400" />,
        };
      case ErrorSeverity.WARNING:
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
          icon: <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />,
        };
      case ErrorSeverity.INFO:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
          icon: <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
        };
      default:
        return {
          container: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-300',
          icon: <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />,
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div className={`p-3 rounded-md border ${styles.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && <div className="flex-shrink-0 mr-3">{styles.icon}</div>}
        <div className="flex-1 text-sm">
          {message}
        </div>
        {showDismiss && onDismiss && (
          <button
            type="button"
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full"
            onClick={onDismiss}
          >
            <span className="sr-only">Dismiss</span>
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;