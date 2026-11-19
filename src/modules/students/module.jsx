import { GraduationCap } from 'lucide-react';
import { Guard } from '../auth';
import StudentDetail from './pages/StudentDetail';
import StudentNew from './pages/StudentNew';
import Students from './pages/Students';

export default {
  key: 'students',
  routes: [
    { path: '/students', element: <Guard scope="tenant" perm="students:read" module="students"><Students /></Guard> },
    { path: '/students/new', element: <Guard scope="tenant" perm="students:write" module="students"><StudentNew /></Guard> },
    { path: '/students/:id', element: <Guard scope="tenant" perm="students:read" module="students"><StudentDetail /></Guard> },
  ],
  nav: [{ section: 'Admissions', order: 12, to: '/students', label: 'Students', icon: GraduationCap, scope: 'tenant', perm: 'students:read', module: 'students' }],
};
