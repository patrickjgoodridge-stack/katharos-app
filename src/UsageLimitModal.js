// UsageLimitModal.js - Simple modal for usage limit notification
import { X, Zap } from 'lucide-react';

const UsageLimitModal = ({ isOpen, onClose, darkMode = false }) => {
  const stripeLink = process.env.REACT_APP_STRIPE_CHECKOUT_URL || '#';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-amber-900/30' : 'bg-amber-100'
            }`}
          >
            <Zap
              size={32}
              className={darkMode ? 'text-amber-400' : 'text-amber-600'}
            />
          </div>

          {/* Title */}
          <h2
            className={`text-2xl font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Daily Limit Reached
          </h2>

          {/* Message */}
          <p
            className={`mb-6 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            You've hit your daily limit of 5 free screenings. Upgrade for unlimited access to all compliance screening features.
          </p>

          {/* Upgrade button */}
          <a
            href={stripeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/25"
          >
            <Zap size={20} />
            Upgrade Now
          </a>

          {/* Secondary action */}
          <button
            onClick={onClose}
            className={`mt-4 text-sm ${
              darkMode
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageLimitModal;
