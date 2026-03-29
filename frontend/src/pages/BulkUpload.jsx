import { useState } from 'react';
import { Upload, X, FileText, Users, GraduationCap, Briefcase, DollarSign, Download, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import useToast from '../hooks/useToast';

function BulkUpload() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('students');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState({ success: 0, failed: 0, errors: [] });

  const tabs = [
    { id: 'students', label: 'Students', icon: GraduationCap, color: 'blue' },
    { id: 'teachers', label: 'Teachers', icon: Users, color: 'green' },
    { id: 'staff', label: 'Staff', icon: Briefcase, color: 'purple' },
    { id: 'fees', label: 'Fees', icon: DollarSign, color: 'orange' }
  ];

  const templates = {
    students: {
      headers: ['firstName', 'lastName', 'fatherName', 'dateOfBirth', 'gender', 'phone', 'email', 'classGrade', 'section', 'address', 'city'],
      sample: [
        { firstName: 'Ahmed', lastName: 'Khan', fatherName: 'Muhammad Khan', dateOfBirth: '2010-01-15', gender: 'Male', phone: '03001234567', email: 'parent@email.com', classGrade: 'Class 1', section: 'A', address: '123 Street', city: 'Lahore' }
      ]
    },
    teachers: {
      headers: ['firstName', 'lastName', 'fatherName', 'dateOfBirth', 'gender', 'phone', 'email', 'qualification', 'subjects', 'salary'],
      sample: [
        { firstName: 'Sarah', lastName: 'Ali', fatherName: 'Abdul Ali', dateOfBirth: '1990-05-20', gender: 'Female', phone: '03001234568', email: 'sarah@school.com', qualification: 'M.Sc', subjects: 'Math,Science', salary: 50000 }
      ]
    },
    staff: {
      headers: ['firstName', 'lastName', 'fatherName', 'dateOfBirth', 'gender', 'phone', 'email', 'designation', 'department', 'salary'],
      sample: [
        { firstName: 'Ali', lastName: 'Raza', fatherName: 'Ijaz Ahmed', dateOfBirth: '1985-03-10', gender: 'Male', phone: '03001234569', email: 'ali@school.com', designation: 'Accountant', department: 'Accounts', salary: 40000 }
      ]
    },
    fees: {
      headers: ['studentId', 'feeType', 'amount', 'dueDate', 'academicYear', 'description'],
      sample: [
        { studentId: 'STU-00001', feeType: 'Tuition', amount: 5000, dueDate: '2026-04-10', academicYear: '2025-2026', description: 'Monthly Tuition Fee' }
      ]
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error('File is empty or has no data rows');
        return;
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''));

      setPreview(rows.slice(0, 10));
      toast.success(`Loaded ${rows.length} rows from file`);
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse file');
    }
  };

  const downloadTemplate = () => {
    const template = templates[activeTab];
    const ws = XLSX.utils.json_to_sheet(template.sample, { header: template.headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${activeTab}_template.xlsx`);
  };

  const uploadData = async () => {
    if (!file) return;

    setUploading(true);
    setResults({ success: 0, failed: 0, errors: [] });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let response;
      switch (activeTab) {
        case 'students':
          response = await api.post('/bulk-upload/students', jsonData);
          break;
        case 'teachers':
          response = await api.post('/bulk-upload/teachers', jsonData);
          break;
        case 'staff':
          response = await api.post('/bulk-upload/staff', jsonData);
          break;
        case 'fees':
          response = await api.post('/bulk-upload/fees', jsonData);
          break;
      }

      setResults({
        success: response.data.success || jsonData.length,
        failed: response.data.failed || 0,
        errors: response.data.errors || []
      });
    } catch (error) {
      console.error('Upload error:', error);
      setResults({
        success: 0,
        failed: jsonData?.length || 0,
        errors: [error.response?.data?.message || 'Upload failed']
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bulk Upload</h1>
        <p className="text-gray-500">Upload Students, Teachers, Staff, and Fees via Excel</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFile(null); setPreview([]); setResults({ success: 0, failed: 0, errors: [] }); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? `bg-${tab.color}-100 text-${tab.color}-700 border border-${tab.color}-300`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Upload {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-2">Drop your Excel file here or click to browse</p>
            <p className="text-sm text-gray-400 mb-4">Supports: .xlsx, .xls, .csv</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-block"
            >
              Select File
            </label>
          </div>

          {file && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-4">
              <FileText className="text-green-600" size={24} />
              <div className="flex-1">
                <p className="font-medium text-green-800">{file.name}</p>
                <p className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { setFile(null); setPreview([]); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={18} />
              Download Template
            </button>
            <button
              onClick={uploadData}
              disabled={!file || uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Data'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Preview & Results</h2>

          {results.success > 0 || results.failed > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="font-semibold text-green-800">Success</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{results.success}</p>
                </div>
                <div className="p-4 bg-red-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-red-600" size={20} />
                    <span className="font-semibold text-red-800">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-red-700 mb-2">Errors:</h3>
                  <div className="max-h-40 overflow-y-auto bg-red-50 rounded-lg p-3">
                    {results.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 mb-1">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : preview.length > 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">Showing first {preview.length} rows</p>
              <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(preview[0] || {}).map(header => (
                        <th key={header} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Upload a file to see preview</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Format Guidelines:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• First row must contain column headers matching the template</li>
          <li>• Date format: YYYY-MM-DD (e.g., 2010-01-15)</li>
          <li>• Gender: Male, Female, or Other</li>
          <li>• For Fees: Use student roll number (e.g., STU-00001)</li>
          <li>• For Staff/Teachers: Subjects should be comma-separated (Math,Science)</li>
        </ul>
      </div>
    </div>
  );
}

export default BulkUpload;
