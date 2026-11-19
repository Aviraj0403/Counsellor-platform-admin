import { rupeesToPaise } from '../../../shared/lib/format';

/** True when the date (YYYY-MM-DD) is less than 18 years ago. The API repeats this check. */
export const isMinorDob = (dob) => {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) age -= 1;
  return age < 18;
};

export const blankStudent = () => ({
  name: '', phone: '', email: '', dob: '', gender: '',
  line: '', city: '', state: '', pincode: '',
  guardianName: '', guardianPhone: '', guardianRelation: '',
  academicLevel: '', academicBoard: '', academicInstitute: '', academicYear: '', academicPercentage: '',
  prefCourses: '', prefCities: '', budgetRupees: '',
  consent: false, guardianConsent: false, guardianBy: '',
});

export const studentToForm = (s) => ({
  ...blankStudent(),
  name: s.name || '', phone: s.phone || '', email: s.email || '', dob: s.dob ? String(s.dob).slice(0, 10) : '', gender: s.gender || '',
  line: s.address?.line || '', city: s.address?.city || '', state: s.address?.state || '', pincode: s.address?.pincode || '',
  guardianName: s.guardian?.name || '', guardianPhone: s.guardian?.phone || '', guardianRelation: s.guardian?.relation || '',
  academicLevel: s.academics?.[0]?.level || '', academicBoard: s.academics?.[0]?.board || '', academicInstitute: s.academics?.[0]?.institute || '',
  academicYear: s.academics?.[0]?.year ?? '', academicPercentage: s.academics?.[0]?.percentage ?? '',
  prefCourses: (s.preferences?.courses || []).join(', '), prefCities: (s.preferences?.cities || []).join(', '),
  budgetRupees: s.preferences?.budgetMaxPaise ? String(s.preferences.budgetMaxPaise / 100) : '',
  consent: !!s.consent?.given, guardianConsent: !!s.consent?.guardianConsent?.given, guardianBy: s.consent?.guardianConsent?.by || '',
});

const list = (t) => t.split(',').map((x) => x.trim()).filter(Boolean);
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && !(Array.isArray(v) && !v.length)));

/** Form state -> API body. Throws an Error with a plain message for a bad budget. */
export const formToBody = (f) => {
  let budgetMaxPaise;
  if (f.budgetRupees !== '') {
    budgetMaxPaise = rupeesToPaise(f.budgetRupees);
    if (Number.isNaN(budgetMaxPaise)) throw new Error('Budget must be a plain amount in rupees, for example 250000.');
  }
  const academic = clean({
    level: f.academicLevel, board: f.academicBoard, institute: f.academicInstitute,
    year: f.academicYear === '' ? '' : Number(f.academicYear), percentage: f.academicPercentage === '' ? '' : Number(f.academicPercentage),
  });
  return clean({
    name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), dob: f.dob, gender: f.gender,
    address: clean({ line: f.line, city: f.city, state: f.state, pincode: f.pincode }),
    guardian: clean({ name: f.guardianName, phone: f.guardianPhone, relation: f.guardianRelation }),
    academics: Object.keys(academic).length ? [academic] : undefined,
    preferences: clean({ courses: list(f.prefCourses), cities: list(f.prefCities), budgetMaxPaise }),
    consent: { given: f.consent, source: 'admin_entry', ...(f.guardianConsent ? { guardianConsent: { given: true, by: f.guardianBy || undefined } } : {}) },
  });
};

