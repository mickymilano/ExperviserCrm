import React, { useState, useEffect } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-500";
      case "error":
        return "bg-red-100 border-red-500";
      case "warning":
        return "bg-yellow-100 border-yellow-500";
      case "info":
      default:
        return "bg-blue-100 border-blue-500";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
      default:
        return "text-blue-500";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`mb-4 flex w-96 max-w-md items-center rounded-lg border-l-4 p-4 shadow-md ${getBgColor()}`}
      role="alert"
    >
      <div className={`mr-3 flex-shrink-0 ${getIconColor()}`}>{getIcon()}</div>
      <div className="flex-grow">
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm">{description}</div>}
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
        onClick={() => onClose(id)}
      >
        <span className="sr-only">Close</span>
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastData>) => {
      setToasts((prev) => [...prev, event.detail]);
    };

    window.addEventListener("toast" as any, handleToast as EventListener);

    return () => {
      window.removeEventListener("toast" as any, handleToast as EventListener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  );
};