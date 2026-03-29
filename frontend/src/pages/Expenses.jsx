import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Receipt, DollarSign, Calendar, Filter, Users, User, FileText, Download } from 'lucide-react';
import { expenseService, voucherService } from '../services/api';
import useToast from '../hooks/useToast';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: 'Cash',
    reference: '',
    teacher: '',
    staff: '',
    notes: ''
  });
  const [bulkExpenses, setBulkExpenses] = useState([{
    description: '',
    amount: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: 'Cash'
  }]);

  const categories = ['General', 'Salary', 'Utilities', 'Supplies', 'Maintenance', 'Transport', 'Other'];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesRes, teachersRes, staffRes] = await Promise.all([
        expenseService.getAll(),
        expenseService.getTeachers(),
        expenseService.getStaff()
      ]);
      setAllExpenses(expensesRes.data || []);
      setExpenses(expensesRes.data || []);
      setTeachers(teachersRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterExpenses();
  }, [startDate, endDate, selectedCategory, allExpenses]);

  const filterExpenses = () => {
    let filtered = [...allExpenses];
    
    if (startDate) {
      filtered = filtered.filter(exp => new Date(exp.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(exp => new Date(exp.date) <= new Date(endDate + 'T23:59:59'));
    }
    if (selectedCategory) {
      filtered = filtered.filter(exp => exp.category === selectedCategory);
    }
    
    setExpenses(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (formData.category !== 'Salary') {
        data.teacher = null;
        data.staff = null;
      }
      if (formData.teacher) data.recipients = [{ type: 'teacher', person: formData.teacher }];
      if (formData.staff) data.recipients = [{ type: 'staff', person: formData.staff }];
      data.amount = parseFloat(data.amount);
      data.date = new Date(data.date);
      
      if (editingExpense) {
        await expenseService.update(editingExpense._id, data);
      } else {
        await expenseService.create(data);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Save failed:', error);
      showToast(error.response?.data?.message || 'Failed to save expense', 'error');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const validExpenses = bulkExpenses.filter(exp => exp.description && exp.amount);
      if (validExpenses.length === 0) {
        showToast('Please add at least one valid expense', 'warning');
        return;
      }
      const expensesWithData = validExpenses.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount),
        date: new Date(exp.date)
      }));
      await expenseService.createBulk({ expenses: expensesWithData });
      setShowBulkModal(false);
      setBulkExpenses([{ description: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], vendor: '', paymentMethod: 'Cash' }]);
      loadData();
      showToast(`Created ${validExpenses.length} expense records`, 'success');
    } catch (error) {
      console.error('Bulk save failed:', error);
      showToast(error.response?.data?.message || 'Failed to create expenses', 'error');
    }
  };

  const addBulkRow = () => {
    setBulkExpenses([...bulkExpenses, {
      description: '',
      amount: '',
      category: 'General',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      paymentMethod: 'Cash'
    }]);
  };

  const removeBulkRow = (index) => {
    if (bulkExpenses.length > 1) {
      setBulkExpenses(bulkExpenses.filter((_, i) => i !== index));
    }
  };

  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkExpenses];
    updated[index][field] = value;
    setBulkExpenses(updated);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date?.split('T')[0] || '',
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod || 'Cash',
      reference: expense.reference || '',
      teacher: expense.teacher?._id || expense.teacher || '',
      staff: expense.staff?._id || expense.staff || '',
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await expenseService.delete(id);
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const downloadVoucher = (expense) => {
    const token = localStorage.getItem('accessToken');
    const schoolId = localStorage.getItem('currentSchoolId');
    const url = `http://localhost:5000/api/vouchers/${expense._id}/pdf`;
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-school-id': schoolId || ''
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to download');
      return response.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Voucher-${expense.voucherNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    })
    .catch(error => {
      console.error('Download failed:', error);
      showToast('Failed to download voucher', 'error');
    });
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: 'General',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      paymentMethod: 'Cash',
      reference: '',
      teacher: '',
      staff: '',
      notes: ''
    });
  };

  const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const salaryExpenses = expenses.filter(ex => ex.category === 'Salary').reduce((sum, ex) => sum + ex.amount, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading expenses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          <p className="text-gray-500">Track school expenses and payments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus size={18} /> Add Multiple
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">From:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">To:</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {(startDate || endDate || selectedCategory) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setSelectedCategory(''); }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg"><DollarSign className="text-red-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold">PKR{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg"><Receipt className="text-blue-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Salary Expenses</p>
              <p className="text-xl font-bold">PKR{salaryExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg"><Receipt className="text-orange-600" size={20} /></div>
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-xl font-bold">{expenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Receipt className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Expenses Found</h3>
          <p className="text-gray-500 mb-4">Start tracking your school expenses</p>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add First Expense</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Voucher #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                        {expense.voucherNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        expense.category === 'Salary' ? 'bg-purple-100 text-purple-700' :
                        expense.category === 'Utilities' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{expense.category}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-red-600">PKR{expense.amount.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => downloadVoucher(expense)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Download Voucher">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => handleEdit(expense)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(expense._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" required value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                  <input type="number" required step="0.01" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              
              {formData.category === 'Salary' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User size={14} className="inline mr-1" /> Teacher
                      </label>
                      <select value={formData.teacher} onChange={(e) => setFormData({ ...formData, teacher: e.target.value, staff: '' })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Teacher</option>
                        {teachers.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Users size={14} className="inline mr-1" /> Staff
                      </label>
                      <select value={formData.staff} onChange={(e) => setFormData({ ...formData, staff: e.target.value, teacher: '' })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Staff</option>
                        {staff.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                      </select>
                    </div>
                  </div>
                  {!formData.teacher && !formData.staff && (
                    <p className="text-sm text-red-500">Please select either a teacher or staff member</p>
                  )}
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Notes</label>
                <input type="text" value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={formData.category === 'Salary' && !formData.teacher && !formData.staff}>
                  {editingExpense ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Multiple Expenses</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleBulkSubmit}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left">Description</th>
                      <th className="px-2 py-2 text-left">Amount</th>
                      <th className="px-2 py-2 text-left">Category</th>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Vendor</th>
                      <th className="px-2 py-2 text-left">Method</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkExpenses.map((exp, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-2 py-2">
                          <input type="text" required value={exp.description}
                            onChange={(e) => updateBulkRow(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border rounded" placeholder="Description" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" required value={exp.amount}
                            onChange={(e) => updateBulkRow(index, 'amount', e.target.value)}
                            className="w-24 px-2 py-1 border rounded" placeholder="Amount" />
                        </td>
                        <td className="px-2 py-2">
                          <select value={exp.category} onChange={(e) => updateBulkRow(index, 'category', e.target.value)}
                            className="px-2 py-1 border rounded">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input type="date" required value={exp.date}
                            onChange={(e) => updateBulkRow(index, 'date', e.target.value)}
                            className="px-2 py-1 border rounded" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={exp.vendor}
                            onChange={(e) => updateBulkRow(index, 'vendor', e.target.value)}
                            className="w-24 px-2 py-1 border rounded" placeholder="Vendor" />
                        </td>
                        <td className="px-2 py-2">
                          <select value={exp.paymentMethod} onChange={(e) => updateBulkRow(index, 'paymentMethod', e.target.value)}
                            className="px-2 py-1 border rounded">
                            {['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeBulkRow(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded" disabled={bulkExpenses.length === 1}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" onClick={addBulkRow}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                  <Plus size={16} /> Add Row
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create {bulkExpenses.filter(e => e.description && e.amount).length} Expenses
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
