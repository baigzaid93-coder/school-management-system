import { useState, useEffect } from 'react';
import { Check, X, CreditCard, Star, Zap, Shield, Crown, Users, Building } from 'lucide-react';
import { subscriptionService } from '../services/api';
import { useToast } from '../components/Toast';

const planIcons = {
  Free: Shield,
  Basic: Star,
  Standard: Zap,
  Premium: Crown,
  Enterprise: Crown
};

const planColors = {
  Free: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', button: 'bg-gray-600' },
  Basic: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', button: 'bg-blue-600' },
  Standard: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', button: 'bg-purple-600' },
  Premium: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', button: 'bg-amber-600' },
  Enterprise: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', button: 'bg-red-600' }
};

function SubscriptionPlans() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('Monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const plansRes = await subscriptionService.getPlans();
      setPlans(plansRes.data || []);
      
      try {
        const subscriptionRes = await subscriptionService.getCurrent();
        setCurrentPlan(subscriptionRes.data.subscription);
        setUsage(subscriptionRes.data.usage);
        if (subscriptionRes.data.subscription?.billingCycle) {
          setSelectedBillingCycle(subscriptionRes.data.subscription.billingCycle);
        }
      } catch (subError) {
        console.log('No current subscription (SaaS mode):', subError.message);
        setCurrentPlan(null);
        setUsage(null);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      showToast('Failed to load subscription plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (plan.name === currentPlan?.plan) {
      showToast('You are already on this plan', 'info');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to switch from ${currentPlan?.plan || 'Free'} to ${plan.name} plan?\n\n` +
      `Price: PKR ${getPlanPrice(plan).toLocaleString()}/${selectedBillingCycle}`
    );

    if (!confirmed) return;

    try {
      setUpgrading(true);
      await subscriptionService.updatePlan({
        plan: plan.name,
        billingCycle: selectedBillingCycle
      });
      showToast(`Successfully switched to ${plan.name} plan!`, 'success');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update plan', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanPrice = (plan) => {
    if (selectedBillingCycle === 'Yearly') {
      return plan.price * 10;
    } else if (selectedBillingCycle === 'Quarterly') {
      return plan.price * 2.75;
    }
    return plan.price;
  };

  const getDiscount = () => {
    if (selectedBillingCycle === 'Yearly') return '17% off';
    if (selectedBillingCycle === 'Quarterly') return '8% off';
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Subscription Plans</h1>
        <p className="text-slate-500 mt-1">Choose the perfect plan for your school</p>
      </div>

      {currentPlan && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-indigo-100 text-sm">Current Plan</p>
              <h2 className="text-2xl font-bold">{currentPlan.plan} Plan</h2>
              <p className="text-indigo-100 text-sm mt-1">
                {currentPlan.status} • {getPlanPrice(plans.find(p => p.name === currentPlan.plan) || { price: 0 }).toLocaleString()} / {currentPlan.billingCycle}
              </p>
            </div>
            <div className="text-right">
              {usage && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{usage.students}</p>
                    <p className="text-xs text-indigo-200">Students</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{usage.teachers}</p>
                    <p className="text-xs text-indigo-200">Teachers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{usage.branches}</p>
                    <p className="text-xs text-indigo-200">Branches</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-slate-100 rounded-xl p-1">
          {['Monthly', 'Quarterly', 'Yearly'].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setSelectedBillingCycle(cycle)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedBillingCycle === cycle
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cycle}
              {getDiscount() && cycle !== 'Monthly' && (
                <span className="ml-2 text-xs text-green-600 font-semibold">
                  {getDiscount()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.plan === plan.name;
          const colors = planColors[plan.name] || planColors.Free;
          const Icon = planIcons[plan.name] || Shield;
          const price = getPlanPrice(plan);

          return (
            <div
              key={plan._id}
              className={`relative bg-white rounded-2xl border-2 ${colors.border} p-6 flex flex-col ${
                isCurrentPlan ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={colors.text} size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-800">
                    PKR {price.toLocaleString()}
                  </span>
                  <span className="text-slate-500">/{selectedBillingCycle.toLowerCase().slice(0, 2)}</span>
                </div>
              </div>

              <div className={`${colors.bg} rounded-xl p-4 mb-6`}>
                <div className="flex items-center gap-3 mb-3">
                  <Users size={18} className={colors.text} />
                  <span className="font-medium">
                    Up to {plan.maxStudents.toLocaleString()} students
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Building size={18} className={colors.text} />
                  <span className="font-medium">
                    Up to {plan.maxTeachers} teachers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Building size={18} className={colors.text} />
                  <span className="font-medium">
                    Up to {plan.maxBranches} branches
                  </span>
                </div>
              </div>

              <div className="flex-1 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Features</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={upgrading || isCurrentPlan}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isCurrentPlan
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : `${colors.button} text-white hover:opacity-90`
                }`}
              >
                {upgrading ? 'Updating...' : isCurrentPlan ? 'Current Plan' : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-slate-50 rounded-2xl p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Can I change plans anytime?</h4>
            <p className="text-sm text-slate-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">What happens if I exceed limits?</h4>
            <p className="text-sm text-slate-600">You'll be notified when approaching limits. Exceeding may result in additional charges or restricted access.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Is there a free trial?</h4>
            <p className="text-sm text-slate-600">New schools get a 14-day free trial of all premium features. No credit card required.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">How does billing work?</h4>
            <p className="text-sm text-slate-600">Billing is based on calendar months. You'll receive an invoice at the start of each billing period.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPlans;
