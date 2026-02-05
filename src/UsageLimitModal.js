// UsageLimitModal.js - Simple modal for usage limit notification with Stripe payment
import { X, Zap, Check, Shield } from 'lucide-react';

const UsageLimitModal = ({ isOpen, onClose, darkMode = false, userEmail = '' }) => {
  const baseStripeLink = process.env.REACT_APP_STRIPE_CHECKOUT_URL || '';

  // Build Stripe checkout URL with prefilled email
  const buildCheckoutUrl = () => {
    if (!baseStripeLink) return '#';

    // Just add prefilled_email if available - other settings configured in Stripe dashboard
    if (userEmail) {
      const separator = baseStripeLink.includes('?') ? '&' : '?';
      return `${baseStripeLink}${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
    }

    return baseStripeLink;
  };

  if (!isOpen) return null;

  const features = [
    'Unlimited daily screenings',
    'Full sanctions database access',
    'Detailed compliance reports',
    'PDF export functionality',
    'Priority support',
  ];

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
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-700/30' : 'bg-gray-200'
              }`}
            >
              <Zap
                size={32}
                className={darkMode ? 'text-gray-400' : 'text-gray-600'}
              />
            </div>

            <h2
              className={`text-2xl font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Daily Limit Reached
            </h2>

            <p
              className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              You've used all 5 free screenings today
            </p>
          </div>

          {/* Features list */}
          <div className={`rounded-xl p-4 mb-6 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Katharos Pro
              </span>
            </div>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade button */}
          <a
            href={buildCheckoutUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-gray-600/25"
          >
            <Zap size={20} />
            Upgrade Now
          </a>

          {/* Security note */}
          <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Secure payment powered by Stripe
          </p>

          {/* Secondary action */}
          <button
            onClick={onClose}
            className={`w-full mt-3 py-2 text-sm ${
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
