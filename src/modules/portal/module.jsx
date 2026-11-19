import { Building2, ClipboardList, GraduationCap, UserPlus } from 'lucide-react';
import { Guard } from '../auth';
import CollegeApplications from './pages/CollegeApplications';
import CollegeInvites from './pages/CollegeInvites';
import MyApplications from './pages/MyApplications';
import StudentInvites from './pages/StudentInvites';

export default {
  key: 'portal',
  routes: [
    // staff
    { path: '/portal/student-invites', element: <Guard scope="tenant" perm="students:write" module="studentPortal"><StudentInvites /></Guard> },
    { path: '/portal/college-invites', element: <Guard scope="tenant" perm="colleges:write" module="collegePortal"><CollegeInvites /></Guard> },
    // the portal experience for students and college users
    { path: '/my-applications', element: <Guard scope="tenant" perm="portal:student" module="studentPortal"><MyApplications /></Guard> },
    { path: '/college-applications', element: <Guard scope="tenant" perm="portal:college" module="collegePortal"><CollegeApplications /></Guard> },
  ],
  nav: [
    { section: 'My organisation', order: 40, to: '/portal/student-invites', label: 'Student portal invites', icon: UserPlus, scope: 'tenant', perm: 'students:write', module: 'studentPortal' },
    { section: 'My organisation', order: 41, to: '/portal/college-invites', label: 'College portal invites', icon: Building2, scope: 'tenant', perm: 'colleges:write', module: 'collegePortal' },
    { section: 'My organisation', order: 1, to: '/my-applications', label: 'My application', icon: GraduationCap, scope: 'tenant', perm: 'portal:student', module: 'studentPortal' },
    { section: 'My organisation', order: 2, to: '/college-applications', label: 'College applications', icon: ClipboardList, scope: 'tenant', perm: 'portal:college', module: 'collegePortal' },
  ],
};
