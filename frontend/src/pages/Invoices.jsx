import { useState, useEffect } from 'react';
import { FileText, Download, Check, Clock, AlertCircle, X, CreditCard, Calendar, Users, Building, RefreshCw, DollarSign } from 'lucide-react';
import { invoiceService, subscriptionService } from '../services/api';
import { useToast } from '../components/Toast';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function Invoices() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ paymentMethod: 'Bank Transfer', paymentReference: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getBySchool({ year: filterYear });
      setInvoices(response.data.invoices || []);
      setSubscription(response.data.subscription);
      setSummary(response.data.summary || { total: 0, paid: 0, pending: 0, overdue: 0 });
    } catch (error) {
      console.error('Failed to load invoices:', error);
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterYear]);

  const getStatusBadge = (status) => {
    const styles = {
      Paid: 'bg-green-100 text-green-700',
      Generated: 'bg-blue-100 text-blue-700',
      Sent: 'bg-purple-100 text-purple-700',
      Overdue: 'bg-red-100 text-red-700',
      Draft: 'bg-gray-100 text-gray-700',
      Void: 'bg-gray-200 text-gray-500',
      Cancelled: 'bg-gray-200 text-gray-500'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.Draft}`}>
        {status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return <Check className="text-green-600" size={18} />;
      case 'Overdue':
        return <AlertCircle className="text-red-600" size={18} />;
      case 'Sent':
      case 'Generated':
        return <Clock className="text-blue-600" size={18} />;
      default:
        return <FileText className="text-gray-400" size={18} />;
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedInvoice) return;
    try {
      await invoiceService.markPaid(selectedInvoice._id, paymentData);
      showToast('Payment recorded successfully', 'success');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({ paymentMethod: 'Bank Transfer', paymentReference: '' });
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to record payment', 'error');
    }
  };

  const formatCurrency = (amount) => {
    return `PKR ${(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getMonthName = (month) => {
    return monthNames[month - 1] || month;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing & Invoices</h1>
          <p className="text-slate-500">Manage your subscription and view invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-lg" title="Refresh">
            <RefreshCw size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {subscription && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{subscription.plan} Plan</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  subscription.status === 'Active' ? 'bg-green-500 text-white' :
                  subscription.status === 'Trial' ? 'bg-yellow-400 text-yellow-900' :
                  'bg-red-500 text-white'
                }`}>
                  {subscription.status}
                </span>
              </div>
              <p className="text-indigo-100 text-sm">
                {formatCurrency(subscription.price || 0)} / {subscription.billingCycle || 'Monthly'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 text-xs">Current Period Ends</p>
              <p className="font-semibold">
                {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
              </p>
              {subscription.nextBillingDate && (
                <p className="text-xs text-indigo-200">
                  Next billing: {formatDate(subscription.nextBillingDate)}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-400/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} />
                  <span className="text-indigo-100">Students</span>
                </div>
                <p className="font-semibold">{subscription.limits?.maxStudents || 50}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building size={14} />
                  <span className="text-indigo-100">Teachers</span>
                </div>
                <p className="font-semibold">{subscription.limits?.maxTeachers || 10}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building size={14} />
                  <span className="text-indigo-100">Branches</span>
                </div>
                <p className="font-semibold">{subscription.limits?.maxBranches || 1}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} />
                  <span className="text-indigo-100">Total Paid</span>
                </div>
                <p className="font-semibold">{formatCurrency(summary.paid)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-xl font-bold">{formatCurrency(summary.total)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(summary.paid)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(summary.pending)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(summary.overdue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between">
          <h3 className="font-semibold text-slate-700">Invoice History</h3>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Generated">Generated</option>
              <option value="Sent">Sent</option>
              <option value="Overdue">Overdue</option>
              <option value="Void">Void</option>
            </select>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Invoices Found</h3>
            <p className="text-slate-500">Your invoices will appear here after billing cycle ends.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Usage</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices
                  .filter(inv => !filterStatus || inv.status === filterStatus)
                  .map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <span className="font-mono text-sm font-semibold text-indigo-600">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="font-medium">
                            {getMonthName(invoice.period?.month)} {invoice.period?.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                          {invoice.subscription?.plan || 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 hidden md:table-cell">
                        <div className="flex gap-3">
                          <span title="Students">{invoice.usage?.students || 0} S</span>
                          <span title="Teachers">{invoice.usage?.teachers || 0} T</span>
                          <span title="Branches">{invoice.usage?.branches || 0} B</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold">{formatCurrency(invoice.charges?.total)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">{formatDate(invoice.dueDate)}</span>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title="View Details"
                          >
                            <FileText size={16} />
                          </button>
                          {invoice.status !== 'Paid' && invoice.status !== 'Void' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPaymentModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Mark as Paid"
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInvoice && !showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Invoice Details</h2>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-slate-500">Invoice Number</p>
                  <p className="text-2xl font-bold text-indigo-600">{selectedInvoice.invoiceNumber}</p>
                </div>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Billing Period</p>
                  <p className="font-medium">
                    {getMonthName(selectedInvoice.period?.month)} {selectedInvoice.period?.year}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Due Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Plan</p>
                  <p className="font-medium">{selectedInvoice.subscription?.plan || 'Free'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Generated</p>
                  <p className="font-medium">{formatDate(selectedInvoice.createdAt)}</p>
                </div>
              </div>

              <div className="border rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-4">Usage Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <Users className="mx-auto mb-1 text-slate-500" size={20} />
                    <p className="text-2xl font-bold">{selectedInvoice.usage?.students || 0}</p>
                    <p className="text-xs text-slate-500">Students</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <Building className="mx-auto mb-1 text-slate-500" size={20} />
                    <p className="text-2xl font-bold">{selectedInvoice.usage?.teachers || 0}</p>
                    <p className="text-xs text-slate-500">Teachers</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <Building className="mx-auto mb-1 text-slate-500" size={20} />
                    <p className="text-2xl font-bold">{selectedInvoice.usage?.branches || 0}</p>
                    <p className="text-xs text-slate-500">Branches</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3">Base Plan ({selectedInvoice.subscription?.plan})</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(selectedInvoice.charges?.baseAmount)}</td>
                    </tr>
                    {selectedInvoice.charges?.additionalStudentsCharge > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-slate-600">Additional Students</td>
                        <td className="px-4 py-3 text-right text-orange-600">+{formatCurrency(selectedInvoice.charges.additionalStudentsCharge)}</td>
                      </tr>
                    )}
                    {selectedInvoice.charges?.additionalTeachersCharge > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-slate-600">Additional Teachers</td>
                        <td className="px-4 py-3 text-right text-orange-600">+{formatCurrency(selectedInvoice.charges.additionalTeachersCharge)}</td>
                      </tr>
                    )}
                    {selectedInvoice.charges?.additionalBranchesCharge > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-slate-600">Additional Branches</td>
                        <td className="px-4 py-3 text-right text-orange-600">+{formatCurrency(selectedInvoice.charges.additionalBranchesCharge)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-indigo-600 text-white">
                    <tr>
                      <td className="px-4 py-3 font-bold">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-xl">{formatCurrency(selectedInvoice.charges?.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedInvoice.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
              {selectedInvoice.status !== 'Paid' && selectedInvoice.status !== 'Void' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CreditCard size={18} />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Record Payment</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">Amount to Pay</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedInvoice.charges?.total)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reference / Transaction ID</label>
                <input
                  type="text"
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                  placeholder="Enter transaction ID or reference"
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({ paymentMethod: 'Bank Transfer', paymentReference: '' });
                }}
                className="px-4 py-2 border rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Check size={18} />
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
