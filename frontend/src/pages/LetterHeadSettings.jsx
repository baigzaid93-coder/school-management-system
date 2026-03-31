import { useState, useEffect } from 'react';
import { Save, Trash2, Upload, Image, FileText, Building } from 'lucide-react';
import api from '../services/api';

function LetterHeadSettings() {
  const [letterHead, setLetterHead] = useState({
    logo: '',
    headerText: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    primaryColor: '#1e40af',
    accentColor: '#3b82f6',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadLetterHead();
  }, []);

  const loadLetterHead = async () => {
    try {
      setLoading(true);
      const response = await api.get('/letter-head');
      if (response.data && Object.keys(response.data).length > 0) {
        setLetterHead(response.data);
      }
    } catch (err) {
      console.error('Failed to load letter head:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setLetterHead(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLetterHead(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/letter-head', letterHead);
      setMessage('Letter head saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save letter head');
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the letter head?')) return;
    try {
      await api.delete('/letter-head');
      setLetterHead({
        logo: '',
        headerText: '',
        tagline: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        primaryColor: '#1e40af',
        accentColor: '#3b82f6',
        isActive: true
      });
      setMessage('Letter head deleted');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Letter Head Settings</h1>
            <p className="text-gray-500">Configure your school's letter head for prints and reports</p>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes('deleted') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Image size={20} /> Logo / Header Image
            </h2>
            <div className="flex items-start gap-6">
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
                {letterHead.logo ? (
                  <img src={letterHead.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Image size={48} className="mx-auto mb-2" />
                    <p className="text-sm">No logo</p>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 text-center font-medium">
                  <Upload size={20} className="inline mr-2" />
                  Upload Logo Image
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-sm text-gray-500 mt-2">Recommended size: 200x80 pixels. PNG, JPG or SVG</p>
                {letterHead.logo && (
                  <button
                    type="button"
                    onClick={() => setLetterHead(prev => ({ ...prev, logo: '' }))}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} /> School Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Header / Organization Name</label>
                <input
                  type="text"
                  value={letterHead.headerText}
                  onChange={(e) => handleChange('headerText', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC School System"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={letterHead.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Excellence in Education"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={letterHead.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="123 Main Street, City, State, ZIP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={letterHead.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+92 300 1234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={letterHead.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="info@school.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={letterHead.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.school.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building size={20} /> Brand Colors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={letterHead.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={letterHead.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="#1e40af"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Used for headers and main elements</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={letterHead.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={letterHead.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="#3b82f6"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Used for highlights and accents</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Active Status</h2>
                <p className="text-sm text-gray-500">Use this letter head for all prints</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterHead.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="preview-section bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4" style={{ backgroundColor: '#f8fafc', borderLeft: `4px solid ${letterHead.primaryColor}` }}>
                <div className="flex items-center gap-4">
                  {letterHead.logo && (
                    <img src={letterHead.logo} alt="Logo" className="h-16 w-auto object-contain" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: letterHead.primaryColor }}>
                      {letterHead.headerText || 'School Name'}
                    </h3>
                    {letterHead.tagline && (
                      <p className="text-sm" style={{ color: letterHead.accentColor }}>{letterHead.tagline}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                  {letterHead.address && <p>{letterHead.address}</p>}
                  {letterHead.phone && <p>Phone: {letterHead.phone}</p>}
                  {letterHead.email && <p>Email: {letterHead.email}</p>}
                  {letterHead.website && <p>Web: {letterHead.website}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={loadLetterHead}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Letter Head'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LetterHeadSettings;
