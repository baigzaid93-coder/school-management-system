import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import RoleBasedDashboard from './pages/RoleBasedDashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import TeacherDashboard from './pages/TeacherDashboard';
import Courses from './pages/Courses';
import ClassGrades from './pages/ClassGrades';
import Subjects from './pages/Subjects';
import Timetable from './pages/Timetable';
import Grades from './pages/Grades';
import Attendance from './pages/Attendance';
import TeacherAttendance from './pages/TeacherAttendance';
import Exams from './pages/Exams';
import Fees from './pages/Fees';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Admissions from './pages/Admissions';
import Users from './pages/Users';
import Staff from './pages/Staff';
import StudentAdmission from './pages/StudentAdmission';
import AdmissionApproval from './pages/AdmissionApproval';
import RolesManagement from './pages/RolesManagement';
import Reports from './pages/Reports';
import Profile from './pages/auth/Profile';
import ChangePassword from './pages/auth/ChangePassword';
import AuditTrail from './pages/auth/AuditTrail';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ParentPortal from './pages/ParentPortal';
import Schools from './pages/Schools';
import SaaSDashboard from './pages/SaaSDashboard';
import SaaSUsers from './pages/SaaSUsers';
import SaaSRevenue from './pages/SaaSRevenue';
import LetterHeadSettings from './pages/LetterHeadSettings';
import BulkUpload from './pages/BulkUpload';
import CustomReports from './pages/CustomReports';
import Invoices from './pages/Invoices';
import SaaSBilling from './pages/SaaSBilling';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Approvals from './pages/Approvals';
import ApprovalSettings from './pages/ApprovalSettings';
import Discipline from './pages/Discipline';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<RoleBasedDashboard />} />
            <Route path="dashboard" element={<RoleBasedDashboard />} />
            
            {/* Student Management */}
            <Route path="inquiries" element={
              <ProtectedRoute allowedPermissions={['admission:view', 'admission:read', '*']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Admissions />
              </ProtectedRoute>
            } />
            <Route path="students/admit" element={
              <ProtectedRoute allowedPermissions={['admission:write', 'student:create', '*']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <StudentAdmission />
              </ProtectedRoute>
            } />
            <Route path="admissions" element={
              <ProtectedRoute allowedPermissions={['admission:view', 'admission:approve', '*']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <AdmissionApproval />
              </ProtectedRoute>
            } />
            <Route path="students" element={
              <ProtectedRoute allowedPermissions="student:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Students />
              </ProtectedRoute>
            } />
            
            {/* Academic */}
            <Route path="classes" element={
              <ProtectedRoute allowedPermissions="course:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <ClassGrades />
              </ProtectedRoute>
            } />
            <Route path="subjects" element={
              <ProtectedRoute allowedPermissions="course:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Subjects />
              </ProtectedRoute>
            } />
            <Route path="courses" element={
              <ProtectedRoute allowedPermissions="course:view">
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="timetable" element={
              <ProtectedRoute allowedPermissions="course:view">
                <Timetable />
              </ProtectedRoute>
            } />
            
            {/* Staff */}
            <Route path="teachers" element={
              <ProtectedRoute allowedPermissions="teacher:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Teachers />
              </ProtectedRoute>
            } />
            <Route path="staff" element={
              <ProtectedRoute allowedPermissions="user:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Staff />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedPermissions="user:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="teacher-portal" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="parent-portal" element={
              <ProtectedRoute allowedRoles={['PARENT']}>
                <ParentPortal />
              </ProtectedRoute>
            } />
            
            {/* Academic Records */}
            <Route path="attendance" element={
              <ProtectedRoute allowedPermissions="attendance:view">
                <Attendance />
              </ProtectedRoute>
            } />
            <Route path="teacher-attendance" element={
              <ProtectedRoute allowedPermissions="attendance:view">
                <TeacherAttendance />
              </ProtectedRoute>
            } />
            <Route path="grades" element={
              <ProtectedRoute allowedPermissions="grade:view">
                <Grades />
              </ProtectedRoute>
            } />
            <Route path="exams" element={
              <ProtectedRoute allowedPermissions="grade:view">
                <Exams />
              </ProtectedRoute>
            } />
            
            {/* Finance */}
            <Route path="fees" element={
              <ProtectedRoute allowedPermissions="fee:view">
                <Fees />
              </ProtectedRoute>
            } />
            <Route path="expenses" element={
              <ProtectedRoute allowedPermissions="fee:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="bulk-upload" element={
              <ProtectedRoute allowedPermissions="*" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <BulkUpload />
              </ProtectedRoute>
            } />
            
            {/* Reports */}
            <Route path="reports" element={
              <ProtectedRoute allowedPermissions="report:view">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="custom-reports" element={
              <ProtectedRoute allowedPermissions="report:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <CustomReports />
              </ProtectedRoute>
            } />
            
            {/* Super Admin - School Management */}
            <Route path="schools" element={
              <ProtectedRoute allowedPermissions={['*', 'settings:edit']}>
                <Schools />
              </ProtectedRoute>
            } />
            <Route path="schools/new" element={
              <ProtectedRoute allowedPermissions={['*', 'settings:edit']}>
                <Schools newSchoolMode={true} />
              </ProtectedRoute>
            } />
            <Route path="schools/plans" element={
              <ProtectedRoute allowedPermissions="*">
                <SubscriptionPlans />
              </ProtectedRoute>
            } />
            
            {/* SaaS Dashboard & Management */}
            <Route path="saas/dashboard" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSDashboard />
              </ProtectedRoute>
            } />
            <Route path="saas/users" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSUsers />
              </ProtectedRoute>
            } />
            <Route path="saas/revenue" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSRevenue />
              </ProtectedRoute>
            } />
            <Route path="saas/billing" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSBilling />
              </ProtectedRoute>
            } />
            <Route path="saas/cbs" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSDashboard />
              </ProtectedRoute>
            } />
            <Route path="saas/hr" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSDashboard />
              </ProtectedRoute>
            } />
            <Route path="saas/admin" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSDashboard />
              </ProtectedRoute>
            } />
            <Route path="saas/analytics" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <SaaSRevenue />
              </ProtectedRoute>
            } />
            <Route path="saas/roles" element={
              <ProtectedRoute allowedPermissions={['*']}>
                <RolesManagement />
              </ProtectedRoute>
            } />
            
            {/* Administration */}
            <Route path="roles" element={
              <ProtectedRoute allowedPermissions={['*', 'settings:edit', 'user:edit']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <RolesManagement />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute allowedPermissions="settings:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="approvals" element={
              <ProtectedRoute allowedPermissions={['*', 'settings:edit']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Approvals />
              </ProtectedRoute>
            } />
            <Route path="approval-settings" element={
              <ProtectedRoute allowedPermissions={['*', 'settings:edit']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <ApprovalSettings />
              </ProtectedRoute>
            } />
            <Route path="discipline" element={
              <ProtectedRoute allowedPermissions={['*', 'settings:view']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <Discipline />
              </ProtectedRoute>
            } />
            <Route path="letter-head" element={
              <ProtectedRoute allowedPermissions="settings:view" blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <LetterHeadSettings />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute allowedPermissions="settings:view">
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="letter-head" element={
              <ProtectedRoute allowedPermissions="settings:view">
                <LetterHeadSettings />
              </ProtectedRoute>
            } />
            
            {/* User */}
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="audit-trail" element={
              <ProtectedRoute allowedPermissions={['*', 'settings:view']} blockedRoles={['TEACHER', 'PARENT', 'STUDENT']}>
                <AuditTrail />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
