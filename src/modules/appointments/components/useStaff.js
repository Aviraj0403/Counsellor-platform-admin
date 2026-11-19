import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import * as api from '../api';

/** Active staff of the organisation (needs team:read). Anyone else only sees themselves, which is all a counsellor needs. */
export default function useStaff() {
  const { me, can } = useAuth();
  const [team, setTeam] = useState([]);
  const canList = can('team:read');
  useEffect(() => {
    if (!canList) return;
    api.listTeam().then(({ data }) => setTeam((data.team || []).filter((m) => m.status === 'active'))).catch(() => {});
  }, [canList]);
  const staff = useMemo(() => {
    if (canList) return team;
    const id = me?.id || me?.userId;
    return id ? [{ id, name: me?.name || 'Me', role: me?.role }] : [];
  }, [canList, team, me]);
  const nameOf = useMemo(() => {
    const m = new Map(staff.map((s) => [s.id, s.name]));
    return (id) => m.get(id) || (id ? `${id.slice(-4)}` : '');
  }, [staff]);
  return { staff, nameOf, canList };
}
