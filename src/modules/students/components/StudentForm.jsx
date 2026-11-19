import { useState } from 'react';
import { Button, Field, Input, Select } from '../../../shared/ui/ui';
import { isMinorDob } from './studentForm.helpers';

export default function StudentForm({ value, onChange, onSubmit, onCancel, submitLabel, busy, lockPhone }) {
  const [, force] = useState(0);
  const set = (k) => (e) => { onChange({ ...value, [k]: e.target.value }); force((n) => n + 1); };
  const minor = isMinorDob(value.dob);

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
      <Field label="Student name"><Input required minLength={2} value={value.name} onChange={set('name')} /></Field>
      <Field label="Mobile number" hint="10-digit Indian mobile"><Input required inputMode="tel" value={value.phone} onChange={set('phone')} disabled={lockPhone} /></Field>
      <Field label="Email"><Input type="email" value={value.email} onChange={set('email')} /></Field>
      <Field label="Date of birth"><Input type="date" value={value.dob} onChange={set('dob')} /></Field>
      <Field label="Gender">
        <Select value={value.gender} onChange={set('gender')}>
          <option value="">Not said</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <div />
      <Field label="Address"><Input value={value.line} onChange={set('line')} /></Field>
      <Field label="City"><Input value={value.city} onChange={set('city')} /></Field>
      <Field label="State"><Input value={value.state} onChange={set('state')} /></Field>
      <Field label="Pincode"><Input value={value.pincode} onChange={set('pincode')} /></Field>
      <div className="md:col-span-3 text-sm font-semibold">Parent / guardian</div>
      <Field label="Guardian name"><Input value={value.guardianName} onChange={set('guardianName')} /></Field>
      <Field label="Guardian phone"><Input inputMode="tel" value={value.guardianPhone} onChange={set('guardianPhone')} /></Field>
      <Field label="Relation"><Input value={value.guardianRelation} onChange={set('guardianRelation')} placeholder="Mother, Father..." /></Field>
      <div className="md:col-span-3 text-sm font-semibold">Latest qualification</div>
      <Field label="Level"><Input value={value.academicLevel} onChange={set('academicLevel')} placeholder="12th" /></Field>
      <Field label="Board"><Input value={value.academicBoard} onChange={set('academicBoard')} /></Field>
      <Field label="School / institute"><Input value={value.academicInstitute} onChange={set('academicInstitute')} /></Field>
      <Field label="Year"><Input type="number" min="1950" max="2100" value={value.academicYear} onChange={set('academicYear')} /></Field>
      <Field label="Percentage"><Input type="number" min="0" max="100" step="0.01" value={value.academicPercentage} onChange={set('academicPercentage')} /></Field>
      <div />
      <div className="md:col-span-3 text-sm font-semibold">Preferences</div>
      <Field label="Courses" hint="Comma separated"><Input value={value.prefCourses} onChange={set('prefCourses')} /></Field>
      <Field label="Cities" hint="Comma separated"><Input value={value.prefCities} onChange={set('prefCities')} /></Field>
      <Field label="Yearly budget (rupees)"><Input inputMode="decimal" value={value.budgetRupees} onChange={set('budgetRupees')} /></Field>

      <div className="md:col-span-3 space-y-2">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 accent-indigo-600" checked={value.consent} onChange={(e) => onChange({ ...value, consent: e.target.checked })} />
          <span>The student agreed to be contacted and to us keeping their data. <span className="text-fg-muted">Recorded with the profile.</span></span>
        </label>
        {minor && (
          <div className="rounded-lg border border-line bg-surface-muted p-3 text-sm">
            <p className="mb-2 font-medium">This student is under 18. A parent or guardian must consent.</p>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-indigo-600" checked={value.guardianConsent} onChange={(e) => onChange({ ...value, guardianConsent: e.target.checked })} />
              <span>The parent / guardian gave consent.</span>
            </label>
            <div className="mt-2 max-w-sm">
              <Field label="Consent given by (name)"><Input value={value.guardianBy} onChange={set('guardianBy')} /></Field>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 md:col-span-3">
        <Button type="submit" loading={busy} disabled={minor && !value.guardianConsent}>{submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
