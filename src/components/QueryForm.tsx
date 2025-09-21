import React, { useState } from 'react';
import { Icon } from './Icons';

interface QueryFormProps {
  isAuthenticated: boolean;
  onClose: () => void;
  onNavigateToLogin: () => void;
  onSubmitQuery: (query: { name: string; email: string; subject: string; message: string }) => void;
}

export const QueryForm: React.FC<QueryFormProps> = ({ 
  isAuthenticated, 
  onClose, 
  onNavigateToLogin, 
  onSubmitQuery 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      // Save form data to localStorage and redirect to login
      localStorage.setItem('pendingQuery', JSON.stringify(formData));
      onNavigateToLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitQuery(formData);
      // Reset form after successful submission
      setFormData({ name: '', email: '', subject: '', message: '' });
      alert('Your query has been submitted successfully!');
      onClose();
    } catch (error) {
      alert('Failed to submit query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Load saved form data if user was redirected from login
  React.useEffect(() => {
    if (isAuthenticated) {
      const savedQuery = localStorage.getItem('pendingQuery');
      if (savedQuery) {
        try {
          const parsedQuery = JSON.parse(savedQuery);
          setFormData(parsedQuery);
          localStorage.removeItem('pendingQuery');
        } catch (error) {
          console.error('Failed to parse saved query:', error);
        }
      }
    }
  }, [isAuthenticated]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Any Questions?</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="What's your question about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Please describe your question in detail..."
              />
            </div>

            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  You need to be registered to submit queries. We'll save your form and redirect you to registration.
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : isAuthenticated ? 'Submit Query' : 'Register & Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


