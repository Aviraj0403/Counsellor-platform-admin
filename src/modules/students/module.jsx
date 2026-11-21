import { GraduationCap, Users } from 'lucide-react';
import { Guard } from '../auth';
import StudentDetail from './pages/StudentDetail';
import StudentNew from './pages/StudentNew';
import Students from './pages/Students';
import Batches from './pages/Batches';

export default {
  key: 'students',
  routes: [
    { path: '/students', element: <Guard scope="tenant" perm="students:read" module="students"><Students /></Guard> },
    { path: '/students/new', element: <Guard scope="tenant" perm="students:write" module="students"><StudentNew /></Guard> },
    { path: '/students/batches', element: <Guard scope="tenant" perm="students:read" module="students"><Batches /></Guard> },
    { path: '/students/:id', element: <Guard scope="tenant" perm="students:read" module="students"><StudentDetail /></Guard> },
  ],
  nav: [
    { section: 'Admissions', order: 12, to: '/students', label: 'Students', icon: GraduationCap, scope: 'tenant', perm: 'students:read', module: 'students' },
    { section: 'Admissions', order: 13, to: '/students/batches', label: 'Batches & Sessions', icon: Users, scope: 'tenant', perm: 'students:read', module: 'students' },
  ],
};
