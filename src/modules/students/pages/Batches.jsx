import { useEffect, useState } from 'react';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Table } from '../../../shared/ui/ui';
import Axios from '../../../shared/api/Axios';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [err, setErr] = useState('');

  const [batchForm, setBatchForm] = useState({
    name: '',
    academicYear: '2026-2027',
    courseStream: 'Engineering / B.Tech',
    capacity: 50,
    notes: '',
  });

  const [sessionForm, setSessionForm] = useState({
    title: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    venue: 'Conference Hall / Online Zoom',
    description: '',
  });

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await Axios.get('/students/batches/list');
      setBatches(res.data.items || []);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const loadBatchDetail = async (id) => {
    try {
      const [bRes, sRes] = await Promise.all([
        Axios.get(`/students/batches/${id}`),
        Axios.get(`/students/batches/${id}/sessions`),
      ]);
      setSelectedBatch(bRes.data);
      setSessions(sRes.data.items || []);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load batch details');
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await Axios.post('/students/batches', {
        ...batchForm,
        capacity: Number(batchForm.capacity),
      });
      setShowCreateBatch(false);
      setBatchForm({
        name: '',
        academicYear: '2026-2027',
        courseStream: 'Engineering / B.Tech',
        capacity: 50,
        notes: '',
      });
      loadBatches();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create batch');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      await Axios.post(`/students/batches/${selectedBatch._id}/sessions`, {
        ...sessionForm,
        sessionDate: new Date(sessionForm.sessionDate).toISOString(),
      });
      setShowCreateSession(false);
      loadBatchDetail(selectedBatch._id);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to schedule session');
    }
  };

  const handleMarkAttendance = async (sessionId, studentId, status) => {
    try {
      await Axios.post(`/students/sessions/${sessionId}/attendance`, {
        records: [{ studentId, status }],
      });
      loadBatchDetail(selectedBatch._id);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to mark attendance');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches & Counselling Sessions"
        subtitle="Organize students into academic counselling cohorts, schedule group workshops, and track physical/online attendance."
      />

      {err && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Batches List */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-fg">Active Batches</h3>
            <Button size="sm" variant="primary" onClick={() => setShowCreateBatch(!showCreateBatch)}>
              {showCreateBatch ? 'Cancel' : 'New Batch'}
            </Button>
          </div>

          {showCreateBatch && (
            <Card className="p-4">
              <form onSubmit={handleCreateBatch} className="space-y-3">
                <Field label="Batch Name" required>
                  <Input
                    value={batchForm.name}
                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                    placeholder="e.g. 2026 B.Tech CAP FastTrack"
                    required
                  />
                </Field>
                <Field label="Academic Year" required>
                  <Input
                    value={batchForm.academicYear}
                    onChange={(e) => setBatchForm({ ...batchForm, academicYear: e.target.value })}
                    placeholder="2026-2027"
                    required
                  />
                </Field>
                <Field label="Course / Target Stream">
                  <Input
                    value={batchForm.courseStream}
                    onChange={(e) => setBatchForm({ ...batchForm, courseStream: e.target.value })}
                    placeholder="Engineering / B.Tech"
                  />
                </Field>
                <Field label="Max Capacity">
                  <Input
                    type="number"
                    min="1"
                    value={batchForm.capacity}
                    onChange={(e) => setBatchForm({ ...batchForm, capacity: e.target.value })}
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="secondary" type="button" onClick={() => setShowCreateBatch(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" type="submit">
                    Create
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="py-8 text-center text-sm text-fg-muted">Loading cohorts...</div>
          ) : batches.length === 0 ? (
            <Empty title="No batches created" description="Create cohorts to manage group counselling sessions." />
          ) : (
            <div className="space-y-2">
              {batches.map((b) => (
                <div
                  key={b._id}
                  onClick={() => loadBatchDetail(b._id)}
                  className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                    selectedBatch?._id === b._id
                      ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                      : 'border-line bg-surface hover:border-fg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-fg">{b.name}</h4>
                    <Badge tone={b.status === 'active' ? 'success' : 'neutral'}>{b.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
                    <span>{b.academicYear}</span>
                    <span>•</span>
                    <span>{b.studentIds?.length || 0} / {b.capacity} Students</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Batch Details & Sessions */}
        <div className="space-y-6 lg:col-span-2">
          {!selectedBatch ? (
            <Card className="flex h-64 items-center justify-center text-center text-fg-muted">
              Select a batch from the left to view enrolled students, schedule counselling sessions, and mark attendance.
            </Card>
          ) : (
            <>
              {/* Batch Overview Header */}
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Cohort Details</span>
                    <h2 className="text-lg font-bold text-fg">{selectedBatch.name}</h2>
                    <p className="text-xs text-fg-muted">Academic Year: {selectedBatch.academicYear} • Stream: {selectedBatch.courseStream}</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setShowCreateSession(!showCreateSession)}>
                    {showCreateSession ? 'Cancel' : 'Schedule Session'}
                  </Button>
                </div>

                {showCreateSession && (
                  <form onSubmit={handleCreateSession} className="mt-4 space-y-3 border-t border-line pt-4">
                    <h4 className="text-sm font-semibold text-fg">Schedule Group Workshop / Counselling Session</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Session Title" required>
                        <Input
                          value={sessionForm.title}
                          onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                          placeholder="e.g. Option Form Filling Strategy"
                          required
                        />
                      </Field>
                      <Field label="Session Date" required>
                        <Input
                          type="date"
                          value={sessionForm.sessionDate}
                          onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                          required
                        />
                      </Field>
                      <Field label="Start Time" required>
                        <Input
                          value={sessionForm.startTime}
                          onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                          placeholder="10:00 AM"
                          required
                        />
                      </Field>
                      <Field label="End Time" required>
                        <Input
                          value={sessionForm.endTime}
                          onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                          placeholder="11:30 AM"
                          required
                        />
                      </Field>
                      <Field label="Venue / Meeting Link" className="sm:col-span-2">
                        <Input
                          value={sessionForm.venue}
                          onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })}
                          placeholder="e.g. Conference Hall 1 / Zoom Link"
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button size="sm" variant="secondary" type="button" onClick={() => setShowCreateSession(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" type="submit">
                        Confirm Session
                      </Button>
                    </div>
                  </form>
                )}
              </Card>

              {/* Sessions & Attendance */}
              <Card className="p-4">
                <h3 className="mb-3 font-semibold text-fg">Scheduled Sessions & Attendance</h3>
                {sessions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-fg-muted">No sessions scheduled for this cohort yet.</div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((s) => (
                      <div key={s._id} className="rounded-lg border border-line p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-fg">{s.title}</h4>
                            <p className="text-xs text-fg-muted">
                              {new Date(s.sessionDate).toLocaleDateString()} • {s.startTime} - {s.endTime} ({s.venue})
                            </p>
                          </div>
                          <Badge tone={s.status === 'completed' ? 'success' : 'info'}>{s.status}</Badge>
                        </div>

                        {/* Quick Attendance Marking for Enrolled Students */}
                        {selectedBatch.students?.length > 0 && (
                          <div className="mt-3 border-t border-line/60 pt-2">
                            <span className="text-xs font-semibold text-fg-muted">Attendance Roster:</span>
                            <div className="mt-1 divide-y divide-line/40">
                              {selectedBatch.students.map((stu) => {
                                const record = (s.attendance || []).find((a) => a.studentId === stu._id);
                                return (
                                  <div key={stu._id} className="flex items-center justify-between py-1.5 text-xs">
                                    <span className="font-medium text-fg">{stu.name} ({stu.phone})</span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleMarkAttendance(s._id, stu._id, 'present')}
                                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                                          record?.status === 'present'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-surface border border-line text-fg hover:bg-emerald-50'
                                        }`}
                                      >
                                        Present
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMarkAttendance(s._id, stu._id, 'absent')}
                                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                                          record?.status === 'absent'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-surface border border-line text-fg hover:bg-rose-50'
                                        }`}
                                      >
                                        Absent
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

