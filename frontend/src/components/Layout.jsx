import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscriptionBlocked from '../pages/SubscriptionBlocked';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Calendar,
  DollarSign,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  UserCog,
  Bell,
  Shield,
  LogOut,
  FileText,
  BarChart3,
  UsersRound,
  BookMarked,
  CalendarDays,
  Receipt,
  Building2,
  CreditCard,
  Briefcase,
  Building,
  TrendingUp,
  UserCog2,
  School,
  Plus,
  Search,
  Upload,
  CheckCircle,
  AlertTriangle,
  User
} from 'lucide-react';

const saasNavSections = [
  {
    title: 'Overview',
    items: [
      { path: '/saas/dashboard', label: 'SaaS Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Tenants',
    items: [
      { path: '/schools', label: 'All Schools', icon: Building2 },
      { path: '/schools/new', label: 'Add School', icon: Plus },
      { path: '/schools/plans', label: 'Subscription Plans', icon: CreditCard },
    ]
  },
  {
    title: 'Billing',
    items: [
      { path: '/saas/billing', label: 'Invoices', icon: FileText },
      { path: '/saas/revenue', label: 'Revenue', icon: TrendingUp },
    ]
  },
  {
    title: 'SaaS Management',
    items: [
      { path: '/saas/users', label: 'SaaS Users', icon: UserCog },
      { path: '/saas/roles', label: 'Roles & Permissions', icon: Shield },
      { path: '/saas/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'Modules',
    items: [
      { path: '/saas/cbs', label: 'CBS', icon: Briefcase },
      { path: '/saas/hr', label: 'HR', icon: Users },
      { path: '/saas/admin', label: 'Administration', icon: Building },
    ]
  },
  {
    title: 'Settings',
    items: [
      { path: '/settings', label: 'Global Settings', icon: Settings },
    ]
  },
];

const schoolNavSections = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Student Management',
    items: [
      { path: '/admissions', label: 'Admissions', icon: FileText, permission: 'admission:view', badge: 'pending' },
      { path: '/students', label: 'Students', icon: Users, permission: 'student:view' },
    ]
  },
  {
    title: 'Approvals',
    items: [
      { path: '/approvals', label: 'All Approvals', icon: CheckCircle, permission: 'settings:edit', badge: 'approvals' },
    ]
  },
  {
    title: 'Academic',
    items: [
      { path: '/classes', label: 'Classes & Sections', icon: BookOpen, permission: 'course:view' },
      { path: '/subjects', label: 'Subjects', icon: BookMarked, permission: 'course:view' },
      { path: '/courses', label: 'Courses', icon: BookOpen, permission: 'course:view' },
      { path: '/timetable', label: 'Timetable', icon: CalendarDays, permission: 'course:view' },
    ]
  },
  {
    title: 'Staff',
    items: [
      { path: '/teachers', label: 'Teachers', icon: GraduationCap, permission: 'teacher:view' },
      { path: '/staff', label: 'Staff', icon: UsersRound, permission: 'user:view' },
      { path: '/users', label: 'User Accounts', icon: UserCog, permission: 'user:view' },
    ]
  },
  {
    title: 'Academic Records',
    items: [
      { path: '/attendance', label: 'Student Attendance', icon: Calendar, permission: 'attendance:view' },
      { path: '/teacher-attendance', label: 'Teacher Attendance', icon: Users, permission: 'attendance:view' },
      { path: '/grades', label: 'Grades', icon: ClipboardCheck, permission: 'grade:view' },
      { path: '/exams', label: 'Examinations', icon: FileText, permission: 'grade:view' },
      { path: '/discipline', label: 'Discipline', icon: AlertTriangle, permission: 'settings:view' },
    ]
  },
  {
    title: 'Portals',
    items: [
      { path: '/teacher-portal', label: 'Teacher Portal', icon: GraduationCap },
      { path: '/parent-portal', label: 'Parent Portal', icon: Users },
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/fees', label: 'Fees Management', icon: DollarSign, permission: 'fee:view' },
      { path: '/expenses', label: 'Expenses', icon: Receipt, permission: 'fee:view' },
    ]
  },
  {
    title: 'Reports',
    items: [
      { path: '/reports', label: 'All Reports', icon: BarChart3 },
      { path: '/custom-reports', label: 'Custom Reports', icon: FileText },
    ]
  },
  {
    title: 'Administration',
    items: [
      { path: '/roles', label: 'Roles & Permissions', icon: Shield, permission: 'settings:edit' },
      { path: '/settings', label: 'General Settings', icon: Settings, permission: 'settings:view' },
      { path: '/letter-head', label: 'Letter Head', icon: FileText, permission: 'settings:view' },
    ]
  },
];

const teacherNavSections = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Teacher Portal',
    items: [
      { path: '/teacher-portal', label: 'My Portal', icon: GraduationCap },
    ]
  },
  {
    title: 'Academic',
    items: [
      { path: '/timetable', label: 'My Timetable', icon: CalendarDays },
      { path: '/courses', label: 'My Courses', icon: BookOpen },
    ]
  },
  {
    title: 'Academic Records',
    items: [
      { path: '/attendance', label: 'Take Attendance', icon: Calendar },
      { path: '/grades', label: 'Manage Grades', icon: ClipboardCheck },
    ]
  },
  {
    title: 'Reports',
    items: [
      { path: '/reports', label: 'Reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Profile',
    items: [
      { path: '/profile', label: 'My Profile', icon: UserCog },
    ]
  },
];

const parentNavSections = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Parent Portal',
    items: [
      { path: '/parent-portal', label: 'My Children', icon: Users },
    ]
  },
  {
    title: 'Academic',
    items: [
      { path: '/attendance', label: 'Attendance', icon: Calendar },
      { path: '/grades', label: 'Grades & Progress', icon: ClipboardCheck },
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/fees', label: 'Fees & Payments', icon: DollarSign },
    ]
  },
  {
    title: 'Profile',
    items: [
      { path: '/profile', label: 'My Profile', icon: UserCog },
    ]
  },
];

const studentNavSections = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'My Profile',
    items: [
      { path: '/profile', label: 'My Profile', icon: User },
    ]
  },
  {
    title: 'Academic',
    items: [
      { path: '/attendance', label: 'My Attendance', icon: Calendar },
      { path: '/grades', label: 'My Grades', icon: ClipboardCheck },
      { path: '/timetable', label: 'My Timetable', icon: CalendarDays },
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/fees', label: 'My Fees', icon: DollarSign },
    ]
  },
];

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [schools, setSchools] = useState([]);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [schoolLogo, setSchoolLogo] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentSchool, loading, logout, hasPermission, switchSchool, clearSchool } = useAuth();
  const userMenuRef = useRef(null);

  const isSuperAdmin = user?.isSuperAdmin || user?.role?.code === 'SUPER_ADMIN';
  const currentSchoolId = localStorage.getItem('currentSchoolId');
  const isSaaSMode = isSuperAdmin && !currentSchoolId;
  const inSchoolMode = !!currentSchoolId;

  useEffect(() => {
    // Always set to true after a short delay if user exists, to ensure we don't get stuck
    const timer = setTimeout(() => {
      if (user && !loading) {
        setInitialLoadComplete(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, loading]);

  useEffect(() => {
    const fetchSchoolLogo = async () => {
      if (isSaaSMode || !currentSchoolId) {
        setSchoolLogo(null);
        return;
      }
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/letter-head', {
          headers: { Authorization: `Bearer ${token}`, 'x-school-id': currentSchoolId }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.logo) {
            setSchoolLogo(data.logo);
          } else if (currentSchool?.logo) {
            setSchoolLogo(currentSchool.logo);
          } else {
            setSchoolLogo(null);
          }
        } else {
          setSchoolLogo(currentSchool?.logo || null);
        }
      } catch (err) {
        setSchoolLogo(currentSchool?.logo || null);
      }
    };
    fetchSchoolLogo();
  }, [isSaaSMode, currentSchoolId, currentSchool]);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        setSchools([]);
        return;
      }
      
      const data = await response.json();
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      setSchools([]);
    }
  };

  const handleSwitchSchool = async (school) => {
    await switchSchool(school);
    setSchoolDropdownOpen(false);
    setTimeout(() => navigate('/'), 100);
  };

  const handleBackToSaaS = () => {
    clearSchool();
    navigate('/schools');
  };

  useEffect(() => {
    if (!isSaaSMode && !loading && user && currentSchool) {
      checkSubscriptionAccess();
    }
  }, [isSaaSMode, loading, user, currentSchool]);

  const checkSubscriptionAccess = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/subscriptions/check-access', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-school-id': currentSchool?._id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (!data.hasAccess) {
          setSubscriptionBlocked(true);
          setBlockReason(data);
        } else {
          setSubscriptionBlocked(false);
          setBlockReason(null);
        }
      }
    } catch (err) {
      console.error('Failed to check subscription access:', err);
    }
  };

  // Compute navigation sections BEFORE any useEffect that uses it
  let navigationSections = [];
  try {
    if (user) {
      const userRole = user?.role?.code;
      if (isSaaSMode) {
        navigationSections = saasNavSections;
      } else if (userRole === 'TEACHER') {
        navigationSections = teacherNavSections;
      } else if (userRole === 'PARENT') {
        navigationSections = parentNavSections;
      } else if (userRole === 'STUDENT') {
        navigationSections = studentNavSections;
      } else {
        // Admin - show all
        navigationSections = schoolNavSections;
        if (navigationSections.length === 0) {
          navigationSections = [{ title: 'Overview', items: [{ path: '/', label: 'Dashboard', icon: LayoutDashboard }] }];
        }
      }
    }
  } catch (e) {
    console.error('Error computing navigation:', e);
    navigationSections = [];
  }

  useEffect(() => {
    if (!navigationSections || navigationSections.length === 0) return;
    const allExpanded = {};
    navigationSections.forEach((_, index) => {
      allExpanded[index] = true;
    });
    setExpandedSections(allExpanded);
  }, [navigationSections]);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const schoolId = localStorage.getItem('currentSchoolId');
        const response = await fetch('/api/admissions/pending-count', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-school-id': schoolId || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.count || 0);
        }
      } catch (err) {
        console.log('Failed to load pending count');
      }
    };
    
    const loadApprovalCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const schoolId = localStorage.getItem('currentSchoolId');
        const response = await fetch('/api/approvals/stats', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-school-id': schoolId || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          setApprovalCount(data.pending || 0);
        }
      } catch (err) {
        console.log('Failed to load approval count');
      }
    };
    
    if (!isSaaSMode && currentSchool) {
      loadPendingCount();
      loadApprovalCount();
      const interval = setInterval(() => {
        loadPendingCount();
        loadApprovalCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isSaaSMode, currentSchool]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (!event.target.closest('.school-dropdown')) {
        setSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getUserRole = () => {
    const roleCode = user?.role?.code;
    if (roleCode === 'TEACHER') return 'teacher';
    if (roleCode === 'PARENT') return 'parent';
    if (roleCode === 'STUDENT') return 'student';
    return null;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getBreadcrumb = () => {
    for (const section of navigationSections) {
      const item = section.items.find(item => item.path === location.pathname);
      if (item) return item.label;
    }
    return isSaaSMode ? 'SaaS Dashboard' : 'Dashboard';
  };

  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (subscriptionBlocked && !isSaaSMode && currentSchool) {
    return (
      <SubscriptionBlocked 
        school={currentSchool} 
        onRetry={checkSubscriptionAccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={`sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileMenuOpen ? 'open' : ''}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              {schoolLogo && !isSaaSMode ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-slate-100">
                  <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  {isSaaSMode ? <Building2 size={22} className="text-white" /> : <GraduationCap size={22} className="text-white" />}
                </div>
              )}
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-lg text-slate-800">
                    {isSaaSMode ? 'SaaS Platform' : (
                      getUserRole() === 'teacher' ? 'Teacher Portal' : 
                      getUserRole() === 'parent' ? 'Parent Portal' :
                      getUserRole() === 'student' ? 'Student Portal' :
                      (currentSchool?.name || user?.school?.name || 'School MS')
                    )}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {isSaaSMode ? 'Multi-tenant Management' : (
                      getUserRole() === 'teacher' ? 'Teacher Access' :
                      getUserRole() === 'parent' ? 'Parent Access' :
                      getUserRole() === 'student' ? 'Student Access' :
                      (isSuperAdmin ? 'Super Admin View' : 'School Management')
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-4">
                {sidebarOpen && (
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                  >
                    <span>{section.title}</span>
                    {expandedSections[sectionIndex] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                )}
                {(!sidebarOpen || expandedSections[sectionIndex]) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`sidebar-nav-item ${active ? 'active' : ''}`}
                          title={!sidebarOpen ? item.label : undefined}
                        >
                          <Icon size={20} />
                          {sidebarOpen && <span className="flex-1">{item.label}</span>}
                          {sidebarOpen && item.badge === 'pending' && pendingCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                          )}
                          {sidebarOpen && item.badge === 'approvals' && approvalCount > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
                              {approvalCount > 99 ? '99+' : approvalCount}
                            </span>
                          )}
                          {!sidebarOpen && item.badge === 'pending' && pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {pendingCount > 9 ? '9+' : pendingCount}
                            </span>
                          )}
                          {!sidebarOpen && item.badge === 'approvals' && approvalCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {approvalCount > 9 ? '9+' : approvalCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200 bg-white">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {isSaaSMode ? 'Super Admin' : user?.role?.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[80px]'}`}>
        <header className="header">
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => {
                  setSidebarOpen(!sidebarOpen);
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors lg:hidden"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors hidden lg:block"
              >
                <Menu size={20} className="text-slate-500" />
              </button>

              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-900">{getBreadcrumb()}</h2>
                <p className="hidden xs:block text-xs text-slate-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {isSuperAdmin && !isSaaSMode && getUserRole() === null && (
                <div className="relative">
                  <button
                    onClick={() => setSchoolDropdownOpen(!schoolDropdownOpen)}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg hover:opacity-90 transition-colors text-sm"
                    style={{ backgroundColor: '#4F46E520', color: '#4F46E5' }}
                  >
                    <Building2 size={14} md:size={16} />
                    <span className="font-medium text-xs md:text-sm max-w-[100px] md:max-w-[150px] truncate hidden sm:block">
                      {currentSchool ? currentSchool.name : 'Select School'}
                    </span>
                    <ChevronDown size={12} md:size={14} />
                  </button>
                  
                  {schoolDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[320px] md:w-80 bg-white rounded-xl shadow-lg border z-50 school-dropdown">
                      <div className="p-3 border-b bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase">
                            {isSaaSMode ? 'Enter School' : 'Switch School'}
                          </p>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {schools.length} Schools
                          </span>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            placeholder="Search school name or code..."
                            value={schoolSearch}
                            onChange={(e) => setSchoolSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2">
                        {!isSaaSMode && isSuperAdmin && (
                          <>
                            <button
                              onClick={handleBackToSaaS}
                              className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-purple-50 rounded-lg border border-purple-100 mb-2"
                            >
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Shield size={20} className="text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-purple-700">SaaS Dashboard</p>
                                <p className="text-xs text-gray-500">Return to platform management</p>
                              </div>
                            </button>
                            <div className="border-t my-2" />
                          </>
                        )}
                        {schools.length === 0 && (
                          <div className="p-4 text-center text-gray-500">
                            <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No schools available</p>
                          </div>
                        )}
                        {schools.length > 0 && (() => {
                          const filtered = schools.filter(school => 
                            school.name?.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                            school.code?.toLowerCase().includes(schoolSearch.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return (
                              <div className="p-4 text-center text-gray-500">
                                <Search size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No schools found</p>
                              </div>
                            );
                          }
                          return filtered.map(school => (
                            <button
                              key={school._id}
                              onClick={() => handleSwitchSchool(school)}
                              className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 rounded-lg mb-1 ${
                                currentSchool?._id === school._id && !isSaaSMode ? 'bg-indigo-50 border border-indigo-200' : ''
                              }`}
                            >
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 size={20} className="text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{school.name}</p>
                                  {currentSchool?._id === school._id && !isSaaSMode && (
                                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">Active</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{school.address?.city || 'No city'}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                  school.subscription?.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                  school.subscription?.status === 'Trial' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {school.subscription?.status || 'Active'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {school.subscription?.plan || 'Free'}
                                </span>
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                      <div className="p-2 border-t bg-slate-50">
                        <button
                          onClick={() => { setSchoolDropdownOpen(false); navigate('/schools'); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Plus size={16} />
                          Manage Schools
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!isSuperAdmin && currentSchool && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  <Building2 size={16} />
                  <span className="font-medium text-sm max-w-[150px] truncate">
                    {currentSchool.name}
                  </span>
                </div>
              )}
              
              {isSaaSMode && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Shield size={16} />
                  <span className="font-medium text-sm">
                    SaaS Mode
                  </span>
                </div>
              )}
              </div>
              
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell size={20} className="text-slate-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isSaaSMode ? (isSuperAdmin ? 'Super Admin' : 'SaaS User') : user?.role?.name}
                    </p>
                  </div>
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <ChevronDown size={16} className="text-slate-400 hidden md:block" />
                </button>

                {userMenuOpen && (
                  <div className="dropdown">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="dropdown-item"
                    >
                      <UserCog size={18} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/change-password"
                      onClick={() => setUserMenuOpen(false)}
                      className="dropdown-item"
                    >
                      <Shield size={18} />
                      <span>Change Password</span>
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      onClick={handleLogout}
                      className="dropdown-item text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
