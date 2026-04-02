import { useState, useEffect } from 'react';
import { AlertTriangle, CreditCard, Clock, Building2, RefreshCw } from 'lucide-react';
import api from '../services/api';

function SubscriptionBlocked({ school, onRetry }) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    await onRetry();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
            <p className="text-red-100">Payment Required</p>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Building2 size={24} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{school?.name || 'Your School'}</p>
                <p className="text-sm text-slate-500">Subscription payment overdue</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">Payment Overdue</p>
                  <p className="text-sm text-slate-500">
                    Your invoice was due and payment has not been received. 
                    Access will be restored once payment is confirmed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">Clear Outstanding Balance</p>
                  <p className="text-sm text-slate-500">
                    Contact your account manager or make payment to restore access immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600">
                <strong>What happens next?</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  Contact your SaaS administrator
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  Make payment via bank transfer or JazzCash/EasyPaisa
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  Access restored after payment confirmation
                </li>
              </ul>
            </div>

            <button
              onClick={handleRetry}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Check Payment Status
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 mt-4">
              For immediate assistance, contact: support@yoursaas.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionBlocked;
