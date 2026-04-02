import { useState, useEffect } from 'react';
import { FileText, Download, Check, Clock, AlertCircle, X, CreditCard, Calendar, Users, Building, RefreshCw, DollarSign, Plus, Eye, Send, Ban, Trash2, Trash, Sparkles } from 'lucide-react';
import { invoiceService, subscriptionService } from '../services/api';
import { useToast } from '../components/Toast';
import api from '../services/api';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function SaaSBilling() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterSchool, setFilterSchool] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ overview: {}, monthly: [] });
  const [cleaning, setCleaning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterSchool) params.schoolId = filterSchool;
      if (filterStatus) params.status = filterStatus;
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;

      const [invoiceRes, subRes, statsRes] = await Promise.all([
        invoiceService.getAll(params),
        subscriptionService.getAll({ status: '' }),
        invoiceService.getStats()
      ]);

      setInvoices(invoiceRes.data.invoices || []);
      setSchools(invoiceRes.data.schools || []);
      setSubscriptions(subRes.data.subscriptions || []);
      setStats(statsRes.data || { overview: {}, monthly: [] });
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load billing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSchool, filterStatus, filterMonth, filterYear]);

  const handleCleanup = async () => {
    if (!confirm('This will delete all invoices linked to non-existent schools. Continue?')) return;
    try {
      setCleaning(true);
      const response = await api.post('/invoices/cleanup');
      showToast(response.data.message || 'Cleanup completed', 'success');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Cleanup failed', 'error');
    } finally {
      setCleaning(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('DANGER: This will DELETE ALL invoices. Schools will need to be invoiced again. Are you absolutely sure?')) return;
    if (!confirm('This action cannot be undone! Click OK to delete all invoices.')) return;
    try {
      setCleaning(true);
      const response = await api.post('/invoices/delete-all');
      showToast(response.data.message || 'All invoices deleted', 'success');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Delete all failed', 'error');
    } finally {
      setCleaning(false);
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      setGenerating(true);
      const result = await invoiceService.generate({
        month: parseInt(generateData.month),
        year: parseInt(generateData.year)
      });

      showToast(`Generated ${result.data.invoices?.length || 0} invoices`, 'success');
      setShowGenerateModal(false);
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to generate invoices', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (invoice) => {
    if (!confirm('Mark this invoice as paid?')) return;
    try {
      await invoiceService.markPaid(invoice._id, { paymentMethod: 'Manual', paymentReference: 'Admin marked as paid' });
      showToast('Invoice marked as paid', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to update invoice', 'error');
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      await invoiceService.send(invoice._id);
      showToast('Invoice sent', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to send invoice', 'error');
    }
  };

  const handleVoidInvoice = async (invoice) => {
    const reason = prompt('Enter reason for voiding:');
    if (!reason) return;
    try {
      await invoiceService.void(invoice._id, reason);
      showToast('Invoice voided', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to void invoice', 'error');
    }
  };

  const handleUpdateStatus = async (invoice, newStatus) => {
    try {
      await invoiceService.updateStatus(invoice._id, { status: newStatus });
      showToast('Status updated', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const formatCurrency = (amount) => `PKR ${(amount || 0).toLocaleString()}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const getStatusBadge = (status) => {
    const styles = {
      Paid: 'bg-green-100 text-green-700',
      Generated: 'bg-blue-100 text-blue-700',
      Sent: 'bg-purple-100 text-purple-700',
      Overdue: 'bg-red-100 text-red-700',
      Draft: 'bg-gray-100 text-gray-700',
      Void: 'bg-gray-200 text-gray-500'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.Draft}`}>{status}</span>;
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
          <h1 className="text-2xl font-bold text-slate-800">SaaS Billing Management</h1>
          <p className="text-slate-500">Manage subscriptions and generate invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
            title="Clean up orphan invoices"
          >
            <Sparkles size={18} className={cleaning ? 'animate-spin' : ''} />
            {cleaning ? 'Cleaning...' : 'Cleanup'}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={cleaning}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            title="Delete ALL invoices"
          >
            <Trash size={18} className={cleaning ? 'animate-spin' : ''} />
            {cleaning ? 'Deleting...' : 'Delete All'}
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Generate Invoices
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-slate-500">Total Invoices</p>
          <p className="text-2xl font-bold">{stats.overview?.totalInvoices || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.overview?.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.overview?.totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-sm text-slate-500">Active Schools</p>
          <p className="text-2xl font-bold text-indigo-600">{subscriptions.filter(s => s.status === 'Active').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-4 border-b flex flex-wrap gap-4 items-center">
          <h3 className="font-semibold text-slate-700">All Invoices</h3>
          <div className="flex flex-wrap gap-2 ml-auto">
            <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Schools</option>
              {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Generated">Generated</option>
              <option value="Sent">Sent</option>
              <option value="Overdue">Overdue</option>
              <option value="Void">Void</option>
            </select>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Months</option>
              {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-lg">
              <RefreshCw size={18} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">School</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Plan</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                    No invoices found
                  </td>
                </tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-semibold text-indigo-600">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{invoice.school?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{invoice.school?.code}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{monthNames[invoice.period?.month - 1]} {invoice.period?.year}</p>
                    <p className="text-xs text-slate-500">Due: {formatDate(invoice.dueDate)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                      {invoice.subscription?.plan}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-bold">{formatCurrency(invoice.charges?.total)}</td>
                  <td className="px-4 py-4">{getStatusBadge(invoice.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedInvoice(invoice)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="View">
                        <Eye size={16} />
                      </button>
                      {invoice.status !== 'Paid' && invoice.status !== 'Void' && (
                        <>
                          <button onClick={() => handleSendInvoice(invoice)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Send">
                            <Send size={16} />
                          </button>
                          <button onClick={() => handleMarkPaid(invoice)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Mark Paid">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleUpdateStatus(invoice, 'Overdue')} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Mark Overdue">
                            <AlertCircle size={16} />
                          </button>
                          <button onClick={() => handleVoidInvoice(invoice)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Void">
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Invoice Details</h2>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-slate-500">Invoice Number</p>
                  <p className="text-2xl font-bold text-indigo-600">{selectedInvoice.invoiceNumber}</p>
                </div>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500">School</p>
                  <p className="font-medium">{selectedInvoice.school?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Plan</p>
                  <p className="font-medium">{selectedInvoice.subscription?.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Period</p>
                  <p className="font-medium">{monthNames[selectedInvoice.period?.month - 1]} {selectedInvoice.period?.year}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              <div className="border rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-4">Usage</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <Users className="mx-auto mb-1" size={20} />
                    <p className="text-2xl font-bold">{selectedInvoice.usage?.students}</p>
                    <p className="text-xs text-slate-500">Students</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <Users className="mx-auto mb-1" size={20} />
                    <p className="text-2xl font-bold">{selectedInvoice.usage?.teachers}</p>
                    <p className="text-xs text-slate-500">Teachers</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <Building className="mx-auto mb-1" size={20} />
                    <p className="text-2xl font-bold">{selectedInvoice.usage?.branches}</p>
                    <p className="text-xs text-slate-500">Branches</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Description</th>
                      <th className="px-4 py-3 text-right text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3">Base Plan ({selectedInvoice.subscription?.plan})</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(selectedInvoice.charges?.baseAmount)}</td>
                    </tr>
                    {selectedInvoice.charges?.additionalStudentsCharge > 0 && (
                      <tr><td className="px-4 py-3 text-slate-600">Additional Students</td><td className="px-4 py-3 text-right text-orange-600">+{formatCurrency(selectedInvoice.charges.additionalStudentsCharge)}</td></tr>
                    )}
                    {selectedInvoice.charges?.additionalTeachersCharge > 0 && (
                      <tr><td className="px-4 py-3 text-slate-600">Additional Teachers</td><td className="px-4 py-3 text-right text-orange-600">+{formatCurrency(selectedInvoice.charges.additionalTeachersCharge)}</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-indigo-600 text-white">
                    <tr><td className="px-4 py-3 font-bold">Total</td><td className="px-4 py-3 text-right font-bold text-xl">{formatCurrency(selectedInvoice.charges?.total)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedInvoice(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Close</button>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Generate Monthly Invoices</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <select
                  value={generateData.month}
                  onChange={(e) => setGenerateData({ ...generateData, month: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border rounded-xl"
                >
                  {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <select
                  value={generateData.year}
                  onChange={(e) => setGenerateData({ ...generateData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border rounded-xl"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <p className="text-sm text-slate-500">
                This will generate invoices for all active schools for the selected billing period.
              </p>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Cancel</button>
              <button
                onClick={handleGenerateInvoices}
                disabled={generating}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                {generating ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SaaSBilling;
