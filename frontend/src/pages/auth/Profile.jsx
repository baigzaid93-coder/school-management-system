import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, Camera, Shield, BookOpen, Calendar, DollarSign, GraduationCap } from 'lucide-react';
import api from '../../services/api';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  
  const userRole = user?.role?.code;
  const isStudent = userRole === 'STUDENT';
  const isParent = userRole === 'PARENT';
  const isTeacher = userRole === 'TEACHER';

  useEffect(() => {
    if (isStudent) {
      loadStudentData();
    } else if (isParent) {
      navigate('/parent-portal');
    } else if (isTeacher) {
      navigate('/teacher-portal');
    }
  }, [userRole]);

  const loadStudentData = async () => {
    try {
      const studentRes = await api.get('/students/my-profile');
      setStudentData(studentRes.data);
      setProfileData(studentRes.data);
      
      const attRes = await api.get('/attendance?attendeeType=student');
      setAttendance(attRes.data || []);
      
      const gradeRes = await api.get('/grades');
      setGrades(gradeRes.data || []);
      
      const feeRes = await api.get('/fees');
      setFees(feeRes.data || []);
    } catch (err) {
      console.error('Error loading student data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        email: user.email || '',
        address: {
          street: user.profile?.address?.street || '',
          city: user.profile?.address?.city || '',
          state: user.profile?.address?.state || '',
          zipCode: user.profile?.address?.zipCode || ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/auth/users/' + user._id, {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address
        }
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-6 mb-8 pb-6 border-b">
          <div className="relative">
            <div className="w-24 h-24 bg-light-blue rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {formData.firstName?.[0]}{formData.lastName?.[0]}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border rounded-full flex items-center justify-center shadow-md hover:bg-gray-50">
              <Camera size={16} className="text-gray-600" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Shield size={16} />
              {user?.role?.name}
            </p>
            <p className="text-sm text-gray-400 mt-1">@{user?.username}</p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue focus:border-light-blue transition outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-light-blue text-white px-6 py-3 rounded-lg hover:bg-blue-400 transition disabled:opacity-50"
            >
              <Save size={20} />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .bg-light-blue { background-color: #60a5fa; }
        .text-light-blue { color: #60a5fa; }
        .focus\\:ring-light-blue:focus { --tw-ring-color: #60a5fa; }
        .focus\\:border-light-blue:focus { border-color: #60a5fa; }
        .hover\\:bg-light-blue:hover { background-color: #60a5fa; }
        .hover\\:bg-blue-400:hover { background-color: #60a5fa; }
      `}</style>
    </div>
  );
}

export default Profile;
