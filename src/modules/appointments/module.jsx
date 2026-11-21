import { CalendarCheck, CalendarClock, Hourglass, Settings2 } from 'lucide-react';
import { Guard } from '../auth';
import AppointmentTypes from './pages/AppointmentTypes';
import Appointments from './pages/Appointments';
import Availability from './pages/Availability';
import Waitlist from './pages/Waitlist';

const g = (perm, el) => <Guard scope="tenant" perm={perm} module="appointments">{el}</Guard>;

export default {
  key: 'appointments',
  routes: [
    { path: '/appointments', element: g('appointments:read', <Appointments />) },
    { path: '/appointments/types', element: g('appointments:read', <AppointmentTypes />) },
    { path: '/appointments/availability', element: g('appointments:read', <Availability />) },
    { path: '/appointments/waitlist', element: g('appointments:read', <Waitlist />) },
  ],
  nav: [
    { section: 'Admissions & Counselling', order: 19, to: '/appointments', label: 'Appointments', labelKey: 'nav.appointments', icon: CalendarCheck, scope: 'tenant', perm: 'appointments:read', module: 'appointments' },
    { section: 'Admissions & Counselling', order: 20, to: '/appointments/types', label: 'Appointment types', labelKey: 'nav.appointmentTypes', icon: Settings2, scope: 'tenant', perm: 'appointments:read', module: 'appointments' },
    { section: 'Admissions & Counselling', order: 21, to: '/appointments/availability', label: 'Availability', labelKey: 'nav.availability', icon: CalendarClock, scope: 'tenant', perm: 'appointments:read', module: 'appointments' },
    { section: 'Admissions & Counselling', order: 22, to: '/appointments/waitlist', label: 'Waiting list', labelKey: 'nav.waitlist', icon: Hourglass, scope: 'tenant', perm: 'appointments:read', module: 'appointments' },
  ],
};
