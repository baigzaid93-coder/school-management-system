import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-900/80"></div>
        </div>
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
            <p className="text-gray-500 mb-6">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-light-blue hover:text-blue-400 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-900/80"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 mb-4 text-gray-500 hover:text-gray-700">
              <ArrowLeft size={18} />
              Back
            </Link>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-light-blue rounded-full mb-4 shadow-lg">
              <Mail className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Forgot Password?</h1>
            <p className="text-gray-500 mt-2">Enter your email to reset your password</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-light-blue text-white py-3 rounded-lg hover:bg-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .bg-light-blue { background-color: #60a5fa; }
        .text-light-blue { color: #60a5fa; }
        .hover\\:text-light-blue:hover { color: #60a5fa; }
        .focus\\:ring-light-blue:focus { --tw-ring-color: #60a5fa; }
        .focus\\:border-light-blue:focus { border-color: #60a5fa; }
        .hover\\:bg-blue-400:hover { background-color: #60a5fa; }
      `}</style>
    </div>
  );
}

export default ForgotPassword;
