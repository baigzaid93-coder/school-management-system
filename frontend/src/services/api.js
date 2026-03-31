import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    let schoolId = localStorage.getItem('currentSchoolId');
    
    // If no school ID in localStorage, try to get from user data in localStorage
    if (!schoolId) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          schoolId = user.school;
        } catch (e) {
          console.warn('Failed to parse user data');
        }
      }
    }
    
    if (schoolId) {
      config.headers['x-school-id'] = schoolId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getUsers: (params) => api.get('/auth/users', { params }),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/auth/users/${id}/toggle`)
};

export const roleService = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  getPermissions: () => api.get('/roles/permissions')
};

export const studentService = {
  getAll: (params) => api.get('/students', { params: { ...params, all: 'true' } }),
  getAllPaginated: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  search: (query) => api.get(`/students/search?q=${query}`),
  searchAll: (query) => api.get('/students', { params: { search: query, all: 'true', status: 'Active' } }),
  getSiblings: (studentId) => api.get(`/students/siblings/${studentId}`),
  getPendingAdmissions: (params) => api.get('/students/pending', { params }),
  getAllAdmissions: (params) => {
    const queryParams = {};
    params.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    return api.get('/students/all', { params: queryParams });
  },
  approve: (id) => api.post(`/students/${id}/approve`),
  reject: (id, data) => api.post(`/students/${id}/reject`, data),
  getAdmissionPDF: (id) => api.get(`/admissions/${id}/pdf`, { responseType: 'blob' }),
  getPendingCount: () => api.get('/admissions/pending-count')
};

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`)
};

export const parentService = {
  getAll: () => api.get('/parents'),
  getById: (id) => api.get(`/parents/${id}`),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  delete: (id) => api.delete(`/parents/${id}`)
};

export const courseService = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  addStudent: (id, studentId) => api.post(`/courses/${id}/students`, { studentId })
};

export const classGradeService = {
  getAll: () => api.get('/class-grades'),
  getById: (id) => api.get(`/class-grades/${id}`),
  create: (data) => api.post('/class-grades', data),
  update: (id, data) => api.put(`/class-grades/${id}`, data),
  delete: (id) => api.delete(`/class-grades/${id}`),
  getStudents: (id, params) => api.get(`/class-grades/${id}/students`, { params }),
  addStudent: (id, data) => api.post(`/class-grades/${id}/students`, data),
  removeStudent: (id, studentId) => api.delete(`/class-grades/${id}/students/${studentId}`),
  getSections: (id) => api.get(`/class-grades/${id}/sections`),
  createSection: (id, data) => api.post(`/class-grades/${id}/sections`, data),
  updateSection: (id, sectionId, data) => api.put(`/class-grades/${id}/sections/${sectionId}`, data),
  deleteSection: (id, sectionId) => api.delete(`/class-grades/${id}/sections/${sectionId}`),
  addStudentToSection: (id, sectionId, studentId) => api.post(`/class-grades/${id}/sections/${sectionId}/students`, { studentId }),
  removeStudentFromSection: (id, sectionId, studentId) => api.delete(`/class-grades/${id}/sections/${sectionId}/students/${studentId}`)
};

export const sectionService = {
  getAll: () => api.get('/settings/sections'),
  getById: (id) => api.get(`/settings/sections/${id}`),
  create: (data) => api.post('/settings/sections', data),
  update: (id, data) => api.put(`/settings/sections/${id}`, data),
  delete: (id) => api.delete(`/settings/sections/${id}`)
};

export const gradeService = {
  getAll: () => api.get('/grades'),
  getByStudent: (studentId) => api.get(`/grades/student/${studentId}`),
  getByCourse: (courseId) => api.get(`/grades/course/${courseId}`),
  getStudentAverage: (studentId) => api.get(`/grades/student/${studentId}/average`),
  create: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  delete: (id) => api.delete(`/grades/${id}`)
};

export const attendanceService = {
  getAll: () => api.get('/attendance'),
  getByStudent: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  getByTeacher: (teacherId, params) => api.get(`/attendance/teacher/${teacherId}`, { params }),
  getByCourse: (courseId, params) => api.get(`/attendance/course/${courseId}`, { params }),
  getStats: (params) => api.get('/attendance/stats', { params }),
  mark: (data) => api.post('/attendance/mark', data),
  bulkMark: (records) => api.post('/attendance/bulk', { attendanceRecords: records })
};

export const feeService = {
  getAll: () => api.get('/fees'),
  getFamily: () => api.get('/fees/family'),
  getFamilyByNumber: (familyNumber) => api.get(`/fees/family/${familyNumber}`),
  getByStudent: (studentId) => api.get(`/fees/student/${studentId}`),
  getSummary: (params) => api.get('/fees/summary', { params }),
  getSuggestedFees: (studentIds, feeType) => api.post('/fees/suggested-fees', { studentIds, feeType }),
  create: (data) => api.post('/fees', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  recordPayment: (id, data) => api.post(`/fees/${id}/payment`, data),
  delete: (id) => api.delete(`/fees/${id}`)
};

export const expenseService = {
  getAll: (params) => api.get('/expenses', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  create: (data) => api.post('/expenses', data),
  createBulk: (data) => api.post('/expenses/bulk', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getTeachers: () => api.get('/expenses/teachers'),
  getStaff: () => api.get('/expenses/staff'),
  getByTeacher: (teacherId, params) => api.get(`/expenses/teacher/${teacherId}`, { params }),
  getTeacherSummary: (teacherId) => api.get(`/expenses/teacher/${teacherId}/summary`),
  getByStaff: (staffId) => api.get(`/expenses/staff/${staffId}`)
};

export const voucherService = {
  getPreview: (id) => api.get(`/vouchers/${id}`),
  downloadPDF: (id) => `/api/vouchers/${id}/pdf`
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getMonthly: (year) => api.get('/dashboard/monthly', { params: { year } })
};

export const timetableService = {
  getAll: (params) => api.get('/timetable', { params }),
  getByClass: (classId) => api.get(`/timetable/class/${classId}`),
  create: (data) => api.post('/timetable', data),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  delete: (id) => api.delete(`/timetable/${id}`),
  activate: (id) => api.patch(`/timetable/${id}/activate`)
};

export const settingsService = {
  school: {
    get: () => api.get('/settings/school'),
    update: (data) => api.put('/settings/school', data)
  },
  branches: {
    getAll: () => api.get('/settings/branches'),
    getById: (id) => api.get(`/settings/branches/${id}`),
    create: (data) => api.post('/settings/branches', data),
    update: (id, data) => api.put(`/settings/branches/${id}`, data),
    delete: (id) => api.delete(`/settings/branches/${id}`)
  },
  academicYears: {
    getAll: () => api.get('/settings/academic-years'),
    getCurrent: () => api.get('/settings/academic-years/current'),
    create: (data) => api.post('/settings/academic-years', data),
    update: (id, data) => api.put(`/settings/academic-years/${id}`, data),
    delete: (id) => api.delete(`/settings/academic-years/${id}`)
  },
  terms: {
    getAll: () => api.get('/settings/terms'),
    getCurrent: () => api.get('/settings/terms/current'),
    getByYear: (yearId) => api.get(`/settings/terms/year/${yearId}`),
    create: (data) => api.post('/settings/terms', data),
    update: (id, data) => api.put(`/settings/terms/${id}`, data),
    delete: (id) => api.delete(`/settings/terms/${id}`)
  },
  classes: {
    getAll: () => api.get('/settings/classes'),
    getByLevel: (level) => api.get(`/settings/classes/level/${level}`),
    create: (data) => api.post('/settings/classes', data),
    update: (id, data) => api.put(`/settings/classes/${id}`, data),
    delete: (id) => api.delete(`/settings/classes/${id}`)
  },
  sections: {
    getAll: () => api.get('/settings/sections'),
    getByClass: (classId) => api.get(`/settings/sections/class/${classId}`),
    create: (data) => api.post('/settings/sections', data),
    update: (id, data) => api.put(`/settings/sections/${id}`, data),
    delete: (id) => api.delete(`/settings/sections/${id}`)
  },
  subjects: {
    getAll: () => api.get('/settings/subjects'),
    getByDepartment: (deptId) => api.get(`/settings/subjects/department/${deptId}`),
    create: (data) => api.post('/settings/subjects', data),
    update: (id, data) => api.put(`/settings/subjects/${id}`, data),
    delete: (id) => api.delete(`/settings/subjects/${id}`)
  },
  departments: {
    getAll: () => api.get('/settings/departments'),
    create: (data) => api.post('/settings/departments', data),
    update: (id, data) => api.put(`/settings/departments/${id}`, data),
    delete: (id) => api.delete(`/settings/departments/${id}`)
  },
  staffRoles: {
    getAll: () => api.get('/settings/staff-roles'),
    create: (data) => api.post('/settings/staff-roles', data),
    update: (id, data) => api.put(`/settings/staff-roles/${id}`, data),
    delete: (id) => api.delete(`/settings/staff-roles/${id}`)
  },
  feeHeads: {
    getAll: () => api.get('/settings/fee-heads'),
    create: (data) => api.post('/settings/fee-heads', data),
    update: (id, data) => api.put(`/settings/fee-heads/${id}`, data),
    delete: (id) => api.delete(`/settings/fee-heads/${id}`)
  },
  examTypes: {
    getAll: () => api.get('/settings/exam-types'),
    create: (data) => api.post('/settings/exam-types', data),
    update: (id, data) => api.put(`/settings/exam-types/${id}`, data),
    delete: (id) => api.delete(`/settings/exam-types/${id}`)
  },
  letterHead: {
    get: () => api.get('/letter-head'),
    save: (data) => api.post('/letter-head', data),
    delete: () => api.delete('/letter-head')
  },
  reportTemplates: {
    getAvailableFields: (entityType) => api.get(`/report-templates/fields/${entityType}`),
    getAll: () => api.get('/report-templates'),
    getById: (id) => api.get(`/report-templates/${id}`),
    create: (data) => api.post('/report-templates', data),
    update: (id, data) => api.put(`/report-templates/${id}`, data),
    delete: (id) => api.delete(`/report-templates/${id}`),
    duplicate: (id) => api.post(`/report-templates/${id}/duplicate`),
    execute: (id, filters) => api.post(`/report-templates/${id}/execute`, { filters })
  }
};

export const reportTemplates = {
  getAvailableFields: (entityType) => api.get(`/report-templates/fields/${entityType}`),
  getAllEntityTypes: () => api.get('/report-templates/entity-types'),
  getAll: (params) => api.get('/report-templates', { params }),
  getById: (id) => api.get(`/report-templates/${id}`),
  create: (data) => api.post('/report-templates', data),
  update: (id, data) => api.put(`/report-templates/${id}`, data),
  delete: (id) => api.delete(`/report-templates/${id}`),
  duplicate: (id) => api.post(`/report-templates/${id}/duplicate`),
  execute: (id, filters, pagination) => api.post(`/report-templates/${id}/execute`, { filters, ...pagination })
};

export default api;

export const invoiceService = {
  getAll: (params) => api.get('/invoices', { params }),
  getBySchool: (params) => api.get('/invoices/school', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  getStats: () => api.get('/invoices/stats'),
  generate: (data) => api.post('/invoices/generate', data),
  markPaid: (id, data) => api.patch(`/invoices/${id}/paid`, data),
  updateStatus: (id, data) => api.patch(`/invoices/${id}/status`, data),
  send: (id) => api.patch(`/invoices/${id}/send`),
  void: (id, reason) => api.patch(`/invoices/${id}/void`, { reason })
};

export const subscriptionService = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  checkUsage: () => api.get('/subscriptions/usage'),
  getBillingHistory: () => api.get('/subscriptions/billing'),
  updatePlan: (data) => api.patch('/subscriptions/plan', data),
  cancel: (reason) => api.patch('/subscriptions/cancel', { reason }),
  getAll: (params) => api.get('/subscriptions/all', { params }),
  updateByAdmin: (schoolId, data) => api.patch(`/subscriptions/school/${schoolId}`, data)
};

export const letterHeadService = {
  get: () => api.get('/letter-head'),
  save: (data) => api.post('/letter-head', data),
  delete: () => api.delete('/letter-head')
};

// Add reportTemplates directly to api for convenience
api.reportTemplates = reportTemplates;
