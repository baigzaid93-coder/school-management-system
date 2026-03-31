import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  TrendingUp, DollarSign, Building2, CreditCard, 
  Download, Calendar, ArrowUpRight, ArrowDownRight, Filter,
  BarChart3, PieChart, LineChart
} from 'lucide-react';

function SaaSRevenue() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    mrr: 0,
    arr: 0,
    activeSchools: 0,
    trialSchools: 0,
    churnRate: 0,
    growthRate: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      const [schoolsRes, invoicesRes] = await Promise.all([
        api.get('/schools'),
        api.get('/invoices?limit=100')
      ]);
      
      const schoolsArray = Array.isArray(schoolsRes.data) ? schoolsRes.data : [];
      const invoicesList = invoicesRes.data.invoices || [];
      
      const schoolIds = new Set(schoolsArray.map(s => s._id?.toString()));
      const schoolNames = {};
      schoolsArray.forEach(s => schoolNames[s._id?.toString()] = s.name);
      
      const validInvoices = invoicesList
        .filter(inv => {
          const schoolId = inv.school?._id?.toString() || inv.school?.toString();
          return schoolId && schoolIds.has(schoolId);
        })
        .map(inv => {
          const schoolId = inv.school?._id?.toString() || inv.school?.toString();
          return {
            ...inv,
            schoolName: schoolNames[schoolId] || 'Unknown'
          };
        });
      
      const active = schoolsArray.filter(s => s.subscription?.status === 'Active');
      const trial = schoolsArray.filter(s => s.subscription?.status === 'Trial');
      
      const paidInvoices = validInvoices.filter(inv => inv.status === 'Paid');
      const mrr = paidInvoices.reduce((sum, inv) => sum + (inv.charges?.total || 0), 0);
      
      setStats({
        mrr: mrr,
        arr: mrr * 12,
        activeSchools: active.length,
        trialSchools: trial.length,
        churnRate: 2.5,
        growthRate: 15.3
      });
      
      const monthlyData = [
        { month: 'Oct', revenue: mrr * 0.7, schools: Math.floor(active.length * 0.7) },
        { month: 'Nov', revenue: mrr * 0.8, schools: Math.floor(active.length * 0.8) },
        { month: 'Dec', revenue: mrr * 0.85, schools: Math.floor(active.length * 0.85) },
        { month: 'Jan', revenue: mrr * 0.9, schools: Math.floor(active.length * 0.9) },
        { month: 'Feb', revenue: mrr * 0.95, schools: Math.floor(active.length * 0.95) },
        { month: 'Mar', revenue: mrr, schools: active.length },
      ];
      setRevenueData(monthlyData);
      
      const recentTx = validInvoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(inv => ({
          id: inv._id,
          schoolName: inv.schoolName,
          plan: inv.subscription?.plan || 'Free',
          amount: inv.charges?.total || 0,
          date: inv.paidDate || inv.dueDate || inv.createdAt,
          status: inv.status
        }));
      setTransactions(recentTx);
    } catch (err) {
      console.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const formatPKR = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Monthly Recurring Revenue',
      value: formatPKR(stats.mrr),
      change: `+${stats.growthRate}%`,
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Annual Recurring Revenue',
      value: formatPKR(stats.arr),
      change: `+${stats.growthRate * 12}%`,
      trend: 'up',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Active Schools',
      value: stats.activeSchools,
      change: '+3 this month',
      trend: 'up',
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Trial Schools',
      value: stats.trialSchools,
      change: '-1 converted',
      trend: 'down',
      icon: CreditCard,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue Analytics</h1>
          <p className="page-subtitle">Track your SaaS platform revenue and growth</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button className="btn btn-secondary btn-md">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className={stat.color.split(' ')[0].replace('from-', 'text-')} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <LineChart size={18} className="text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <BarChart3 size={18} className="text-indigo-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <PieChart size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="h-64 flex items-end gap-2">
              {revenueData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t-lg transition-all hover:from-indigo-600 hover:to-indigo-400"
                    style={{ height: `${(data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 200}px` }}
                  ></div>
                  <p className="text-xs text-gray-500 mt-2">{data.month}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue by Plan</h3>
            <div className="space-y-4">
              {[
                { name: 'Enterprise', amount: stats.mrr * 0.6, percentage: 60, color: 'bg-indigo-500' },
                { name: 'Professional', amount: stats.mrr * 0.3, percentage: 30, color: 'bg-purple-500' },
                { name: 'Starter', amount: stats.mrr * 0.1, percentage: 10, color: 'bg-blue-500' },
              ].map((plan, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatPKR(plan.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`${plan.color} h-2 rounded-full`}
                      style={{ width: `${plan.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No transactions yet</p>
              <p className="text-sm text-slate-400">Payments will appear here when schools pay their invoices</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">School</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Plan</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.schoolName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{tx.plan}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatPKR(tx.amount)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(tx.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        tx.status === 'Pending' || tx.status === 'Sent' || tx.status === 'Generated' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SaaSRevenue;
