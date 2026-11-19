import { useEffect, useState } from 'react';
import { Field, Input, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';
import { addDays, dateInputToIst, fmtTime, istDateInputValue } from '../lib';

/** Pick a day, then one of the free slots of that day. onChange({ start, counsellorId }). */
export default function SlotPicker({ typeId, counsellorId, value, onChange, nameOf }) {
  const [day, setDay] = useState(istDateInputValue(addDays(new Date(), 1)));
  const [slots, setSlots] = useState(null);

  useEffect(() => {
    if (!typeId || !day) return undefined;
    let alive = true;
    const from = dateInputToIst(day);
    api
      .getSlots({ typeId, from: from.toISOString(), to: addDays(from, 1).toISOString(), ...(counsellorId && { counsellorId }) })
      .then(({ data }) => alive && setSlots(data.items))
      .catch((e) => {
        if (alive) {
          setSlots([]);
          toastError(e);
        }
      });
    return () => {
      alive = false;
    };
  }, [typeId, counsellorId, day]);

  return (
    <div className="space-y-3">
      <Field label="Day" hint="Times are in Indian Standard Time.">
        <Input type="date" value={day} onChange={(e) => { setSlots(null); setDay(e.target.value); }} />
      </Field>
      {slots === null ? (
        <Spinner />
      ) : slots.length === 0 ? (
        <p className="text-sm text-fg-muted">No free times on this day. Try another day, or check the counsellor&apos;s availability.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => {
            const on = value?.start === s.start && value?.counsellorId === s.counsellorId;
            return (
              <button
                key={`${s.start}-${s.counsellorId}`}
                type="button"
                onClick={() => onChange({ start: s.start, counsellorId: s.counsellorId })}
                className={`rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset ${on ? 'brand-gradient text-white ring-transparent' : 'bg-surface text-fg ring-line hover:bg-surface-2'}`}
              >
                {fmtTime(s.start)}
                {nameOf && !counsellorId && <span className="ml-1 text-xs opacity-80">{nameOf(s.counsellorId)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
