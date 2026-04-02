import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Edit2, Trash2, Copy, Play, Settings, 
  ChevronDown, ChevronRight, Search, Download, BarChart3, Table2, PieChart, LineChart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

const ENTITY_TYPES = [
  { 
    value: 'student', 
    label: 'Students', 
    icon: '👨‍🎓',
    description: 'Student records, enrollment, attendance',
    color: 'blue'
  },
  { 
    value: 'teacher', 
    label: 'Teachers', 
    icon: '👨‍🏫',
    description: 'Teacher profiles, subjects, attendance',
    color: 'green'
  },
  { 
    value: 'staff', 
    label: 'Staff', 
    icon: '👥',
    description: 'Staff members, roles, attendance',
    color: 'purple'
  },
  { 
    value: 'fee', 
    label: 'Fees', 
    icon: '💰',
    description: 'Fee vouchers, payments, collections',
    color: 'amber'
  },
  { 
    value: 'expense', 
    label: 'Expenses', 
    icon: '📊',
    description: 'Expense records, categories, totals',
    color: 'red'
  },
  { 
    value: 'attendance', 
    label: 'Attendance', 
    icon: '📅',
    description: 'Daily attendance records',
    color: 'indigo'
  },
  { 
    value: 'marks', 
    label: 'Marks', 
    icon: '📝',
    description: 'Exam marks, results, grades',
    color: 'pink'
  }
];

const FIELD_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'boolean', label: 'Yes/No' }
];

const FILTER_TYPES = [
  { value: 'text', label: 'Text Search' },
  { value: 'select', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
  { value: 'dateRange', label: 'Date Range' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' }
];

const CHART_TYPES = [
  { value: 'none', label: 'No Chart', icon: Table2 },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart }
];

const PRESET_TEMPLATES = [
  {
    name: 'Student Directory',
    description: 'List of all students with basic info',
    entityType: 'student',
    fields: [
      { key: 'studentId', label: 'Roll No', type: 'string' },
      { key: 'firstName', label: 'First Name', type: 'string' },
      { key: 'lastName', label: 'Last Name', type: 'string' },
      { key: 'classGrade.name', label: 'Class', type: 'string' },
      { key: 'gender', label: 'Gender', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'string' }
    ],
    filters: [
      { field: 'search', label: 'Search', type: 'text' },
      { field: 'classGrade', label: 'Class', type: 'select' }
    ],
    chartType: 'none'
  },
  {
    name: 'Fee Collection Report',
    description: 'Monthly fee collection summary',
    entityType: 'fee',
    fields: [
      { key: 'voucherNumber', label: 'Voucher #', type: 'string' },
      { key: 'student.firstName', label: 'Student', type: 'string' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'paidAmount', label: 'Paid', type: 'currency' },
      { key: 'balance', label: 'Balance', type: 'currency' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'dueDate', label: 'Due Date', type: 'date' }
    ],
    filters: [
      { field: 'status', label: 'Status', type: 'select', options: ['Pending', 'Partial', 'Paid'] },
      { field: 'fromDate', label: 'From Date', type: 'date' },
      { field: 'toDate', label: 'To Date', type: 'date' }
    ],
    chartType: 'bar'
  },
  {
    name: 'Attendance Summary',
    description: 'Student attendance report',
    entityType: 'attendance',
    fields: [
      { key: 'student.firstName', label: 'Student', type: 'string' },
      { key: 'student.studentId', label: 'Roll No', type: 'string' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'string' }
    ],
    filters: [
      { field: 'date', label: 'Date', type: 'date' },
      { field: 'attendeeType', label: 'Type', type: 'select', options: ['Student', 'Teacher', 'Staff'] }
    ],
    chartType: 'pie'
  },
  {
    name: 'Expense Report',
    description: 'Monthly expense breakdown',
    entityType: 'expense',
    fields: [
      { key: 'description', label: 'Description', type: 'string' },
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'addedBy.username', label: 'Added By', type: 'string' }
    ],
    filters: [
      { field: 'category', label: 'Category', type: 'select' },
      { field: 'fromDate', label: 'From Date', type: 'date' },
      { field: 'toDate', label: 'To Date', type: 'date' }
    ],
    chartType: 'bar'
  }
];

export default function CustomReports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entityType: 'student',
    fields: [],
    filters: [],
    chartType: 'none',
    aggregations: []
  });
  const [filterValues, setFilterValues] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    fetchTemplates();
  }, [searchQuery]);

  useEffect(() => {
    if (formData.entityType) {
      fetchAvailableFields(formData.entityType);
    }
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.reportTemplates.getAll({ search: searchQuery });
      const data = response.data;
      if (data.templates) {
        setTemplates(data.templates);
        setPagination(data.pagination || { page: 1, total: 0, pages: 0 });
      } else if (Array.isArray(data)) {
        setTemplates(data);
        setPagination({ page: 1, total: data.length, pages: 1 });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFields = async (entityType) => {
    try {
      setLoadingFields(true);
      const response = await api.reportTemplates.getAvailableFields(entityType);
      setAvailableFields(response.data || []);
    } catch (error) {
      console.error('Error fetching available fields:', error);
      setAvailableFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleEntityTypeChange = (entityType) => {
    setFormData({ ...formData, entityType, fields: [], filters: [] });
    fetchAvailableFields(entityType);
  };

  const toggleField = (field) => {
    const isSelected = formData.fields.some(f => f.key === field.key);
    if (isSelected) {
      setFormData({
        ...formData,
        fields: formData.fields.filter(f => f.key !== field.key)
      });
    } else {
      setFormData({
        ...formData,
        fields: [...formData.fields, field]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTemplate?._id) {
        await api.reportTemplates.update(selectedTemplate._id, formData);
        showToast('Report template updated', 'success');
      } else {
        await api.reportTemplates.create(formData);
        showToast('Report template created', 'success');
      }
      setShowModal(false);
      fetchTemplates();
      resetForm();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving template', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report template?')) return;
    try {
      await api.reportTemplates.delete(id);
      showToast('Template deleted', 'success');
      fetchTemplates();
    } catch (error) {
      showToast('Error deleting template', 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.reportTemplates.duplicate(id);
      showToast('Template duplicated', 'success');
      fetchTemplates();
    } catch (error) {
      showToast('Error duplicating template', 'error');
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      entityType: template.entityType,
      fields: template.fields || [],
      filters: template.filters || [],
      chartType: template.chartType || 'none',
      aggregations: template.aggregations || []
    });
    setShowModal(true);
  };

  const handleExecute = async (template) => {
    setSelectedTemplate(template);
    setFilterValues({});
    setReportData(null);
    setShowExecuteModal(true);
    setReportLoading(true);
    try {
      const response = await api.reportTemplates.execute(template._id, {});
      setReportData(response.data);
    } catch (error) {
      showToast('Error running report: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const runWithFilters = async () => {
    setReportLoading(true);
    try {
      const response = await api.reportTemplates.execute(selectedTemplate._id, filterValues);
      setReportData(response.data);
    } catch (error) {
      showToast('Error running report', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const loadPreset = (preset) => {
    setFormData({
      name: preset.name,
      description: preset.description,
      entityType: preset.entityType,
      fields: [...preset.fields],
      filters: [...preset.filters],
      chartType: preset.chartType,
      aggregations: []
    });
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      entityType: 'student',
      fields: [],
      filters: [],
      chartType: 'none',
      aggregations: []
    });
  };

  const addFilter = () => {
    setFormData({
      ...formData,
      filters: [...formData.filters, { field: '', label: '', type: 'text', options: [] }]
    });
  };

  const removeFilter = (index) => {
    setFormData({
      ...formData,
      filters: formData.filters.filter((_, i) => i !== index)
    });
  };

  const updateFilter = (index, filter) => {
    const newFilters = [...formData.filters];
    newFilters[index] = { ...newFilters[index], ...filter };
    setFormData({ ...formData, filters: newFilters });
  };

  const exportToExcel = () => {
    if (!reportData?.data?.length) return;
    const ws = XLSX.utils.json_to_sheet(reportData.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${selectedTemplate?.name || 'report'}.xlsx`);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Custom Reports</h1>
          <p className="text-sm text-gray-500 hidden xs:block">Create and manage custom report templates</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Create Report
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b overflow-x-auto">
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 md:px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              My Reports ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 md:px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'presets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Preset Templates
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_TEMPLATES.map((preset, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded whitespace-nowrap">
                      {ENTITY_TYPES.find(e => e.value === preset.entityType)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{preset.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { loadPreset(preset); setShowModal(true); }}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                  <p className="text-gray-500 mb-4">No custom reports yet</p>
                  <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Your First Report
                  </button>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div key={template._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800">{template.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                            {ENTITY_TYPES.find(e => e.value === template.entityType)?.label}
                          </span>
                          {template.chartType !== 'none' && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded whitespace-nowrap">
                              {template.chartType}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{template.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {template.fields.slice(0, 4).map((f, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded">{f.label}</span>
                          ))}
                          {template.fields.length > 4 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">+{template.fields.length - 4} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleExecute(template)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Run Report"
                        >
                          <Play size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template._id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(template._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold">
                {selectedTemplate?._id ? 'Edit Report Template' : 'Create Report Template'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Step 1: Data Source Selection */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Step 1: Select Data Source *</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {ENTITY_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleEntityTypeChange(type.value)}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        formData.entityType === type.value 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="font-medium text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
                {formData.entityType && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected: <strong>{ENTITY_TYPES.find(e => e.value === formData.entityType)?.label}</strong> - 
                    {ENTITY_TYPES.find(e => e.value === formData.entityType)?.description}
                  </p>
                )}
              </div>

              {/* Step 2: Report Details */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Step 2: Report Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Monthly Fee Collection"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Brief description of this report"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Select Columns to Display */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Step 3: Select Columns to Display</h3>
                {loadingFields ? (
                  <div className="text-center py-8 text-gray-500">Loading available columns...</div>
                ) : (
                  <>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-2">Click to add columns to your report:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableFields.map(field => {
                          const isSelected = formData.fields.some(f => f.key === field.key);
                          return (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() => toggleField(field)}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}{field.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {formData.fields.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Selected Columns ({formData.fields.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.fields.map((field, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                              <span className="text-sm text-blue-700">{field.label}</span>
                              <button
                                type="button"
                                onClick={() => toggleField(field)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Tip: Click columns above or below to remove them
                        </p>
                      </div>
                    )}
                  </>
                )}
                {formData.fields.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No columns selected</p>
                    <p className="text-sm text-gray-400">Select columns from above to build your report</p>
                  </div>
                )}
              </div>

              {/* Filters Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Filter Options</h3>
                  <button type="button" onClick={addFilter} className="text-sm text-blue-600 hover:text-blue-700">
                    + Add Filter
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.filters.map((filter, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Field Key"
                        value={filter.field}
                        onChange={(e) => updateFilter(idx, { field: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Display Label"
                        value={filter.label}
                        onChange={(e) => updateFilter(idx, { label: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <select
                        value={filter.type}
                        onChange={(e) => updateFilter(idx, { type: e.target.value })}
                        className="px-3 py-2 border rounded-lg text-sm"
                      >
                        {FILTER_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeFilter(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.filters.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No filters. Reports will run on all data.</p>
                  )}
                </div>
              </div>

              {/* Chart Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Visualization</label>
                <div className="flex gap-3">
                  {CHART_TYPES.map(chart => (
                    <button
                      key={chart.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, chartType: chart.value })}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${formData.chartType === chart.value ? 'border-blue-500 bg-blue-50' : ''}`}
                    >
                      <chart.icon size={18} />
                      {chart.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {selectedTemplate?._id ? 'Update' : 'Create'} Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute Modal */}
      {showExecuteModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
                <p className="text-sm text-gray-500">{reportData?.data?.length || 0} records found</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                  <Download size={18} />
                  Export Excel
                </button>
                <button onClick={() => setShowExecuteModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Filters */}
              {selectedTemplate.filters.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">Filters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedTemplate.filters.map((filter, idx) => (
                      <div key={idx}>
                        <label className="block text-sm text-gray-600 mb-1">{filter.label}</label>
                        {filter.type === 'text' && (
                          <input
                            type="text"
                            value={filterValues[filter.field] || ''}
                            onChange={(e) => setFilterValues({ ...filterValues, [filter.field]: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        )}
                        {filter.type === 'date' && (
                          <input
                            type="date"
                            value={filterValues[filter.field] || ''}
                            onChange={(e) => setFilterValues({ ...filterValues, [filter.field]: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        )}
                        {filter.type === 'select' && (
                          <select
                            value={filterValues[filter.field] || ''}
                            onChange={(e) => setFilterValues({ ...filterValues, [filter.field]: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="">All</option>
                            {filter.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={runWithFilters}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                </div>
              )}

              {/* Data Table */}
              {reportData?.data?.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedTemplate.fields.map((field, idx) => (
                          <th key={idx} className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {selectedTemplate.fields.map((field, fIdx) => (
                            <td key={fIdx} className="px-3 md:px-4 py-3 text-sm whitespace-nowrap">
                              {formatCellValue(getNestedValue(row, field.key), field.type)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No data found. Try adjusting filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

function formatCellValue(value, type) {
  if (value === null || value === undefined) return '-';
  if (type === 'currency') return `PKR ${Number(value).toLocaleString()}`;
  if (type === 'date') return new Date(value).toLocaleDateString();
  if (type === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
