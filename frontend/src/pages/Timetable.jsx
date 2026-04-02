import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, X, Clock, BookOpen, User, MapPin, Save, Wand2 } from 'lucide-react';
import api, { timetableService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_TIME_SLOTS = [
  { periodNumber: 1, startTime: '08:00', endTime: '09:00' },
  { periodNumber: 2, startTime: '09:00', endTime: '10:00' },
  { periodNumber: 3, startTime: '10:00', endTime: '11:00' },
  { periodNumber: 4, startTime: '11:00', endTime: '12:00' },
  { periodNumber: 5, startTime: '12:00', endTime: '01:00' },
  { periodNumber: 6, startTime: '01:00', endTime: '02:00' },
  { periodNumber: 7, startTime: '02:00', endTime: '03:00' },
  { periodNumber: 8, startTime: '03:00', endTime: '04:00' }
];

function Timetable() {
  const toast = useToast();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [classGrades, setClassGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [periodForm, setPeriodForm] = useState({
    periodNumber: '',
    startTime: '',
    endTime: '',
    subject: '',
    teacher: '',
    room: '',
    isBreak: false
  });
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherClassId, setTeacherClassId] = useState(null);

  useEffect(() => { 
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const roleCode = user?.role?.code;
    if (roleCode === 'TEACHER') {
      setIsTeacher(true);
      try {
        const teacherRes = await api.get('/teachers/my-profile');
        const teacherData = teacherRes.data;
        if (teacherData.assignedClass) {
          const classId = teacherData.assignedClass._id || teacherData.assignedClass;
          setTeacherClassId(classId);
          setSelectedClass(classId);
        }
      } catch (err) {
        console.error('Error loading teacher profile:', err);
      }
    }
    loadInitialData();
  };

  useEffect(() => {
    if (!loading && selectedClass) {
      loadClassSubjects();
      loadTimetable();
    }
  }, [selectedClass, selectedSection]);

  const loadClassSubjects = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.get(`/settings/subjects?classGrade=${selectedClass}`);
      const data = res.data;
      const classSubs = Array.isArray(data) ? data.filter(s => 
        s.classGrades?.some(cg => cg._id === selectedClass || cg === selectedClass)
      ) : [];
      setClassSubjects(classSubs);
    } catch (err) {
      console.error('Failed to load subjects');
    }
  };

  const handleAutoGenerate = async () => {
    if (classSubjects.length === 0) {
      toast.error('No subjects found for this class. Please assign subjects first.');
      return;
    }

    if (!confirm(`Generate timetable for ${classGrades.find(c => c._id === selectedClass)?.name}?\n\nThis will create periods for all 6 days with subjects distributed throughout.\nExisting timetable will be replaced.`)) {
      return;
    }

    setGenerating(true);
    try {
      const currentYear = new Date().getFullYear().toString();

      for (const day of DAYS) {
        const dayPeriods = [];
        let subjectIndex = 0;

        for (let periodNum = 1; periodNum <= 7; periodNum++) {
          const slotIndex = periodNum - 1;

          if (periodNum === 4) {
            dayPeriods.push({
              periodNumber: periodNum,
              startTime: DEFAULT_TIME_SLOTS[slotIndex].startTime,
              endTime: DEFAULT_TIME_SLOTS[slotIndex].endTime,
              subject: classSubjects[0]?._id || null,
              teacher: classSubjects[0]?.teachers?.[0] || null,
              room: `Room ${Math.floor(Math.random() * 10) + 1}`,
              isBreak: true
            });
          } else {
            const subject = classSubjects[subjectIndex % classSubjects.length];
            const teacher = subject.teachers?.[0] || null;

            dayPeriods.push({
              periodNumber: periodNum,
              startTime: DEFAULT_TIME_SLOTS[slotIndex].startTime,
              endTime: DEFAULT_TIME_SLOTS[slotIndex].endTime,
              subject: subject._id,
              teacher: teacher?._id || teacher,
              room: `Room ${Math.floor(Math.random() * 10) + 1}`,
              isBreak: false
            });
            subjectIndex++;
          }
        }

        const payload = {
          classGrade: selectedClass,
          section: selectedSection || undefined,
          dayOfWeek: day,
          periods: dayPeriods,
          status: 'Active',
          effectiveFrom: new Date()
        };

        console.log('Creating timetable entry:', payload);
        const result = await timetableService.create(payload);
        console.log('Created:', result.data);
      }

      console.log('All timetable entries created, reloading...');
      toast.success(`Timetable generated successfully! ${classSubjects.length} subjects distributed across 6 days.`);
      loadTimetable();
    } catch (err) {
      console.error('Failed to generate timetable:', err);
      console.error('Error response:', err.response?.data);
      toast.error(`Failed to generate timetable: ${err.response?.data?.message || err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [subjectsRes, teachersRes] = await Promise.all([
        api.get('/settings/subjects'),
        api.get('/teachers')
      ]);
      
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
      
      // For teachers, only load their assigned class
      // For admins, load all classes
      if (isTeacher && teacherClassId) {
        const classRes = await api.get(`/class-grades/${teacherClassId}`);
        if (classRes.data) {
          setClassGrades([classRes.data]);
        }
      } else {
        const classesRes = await api.get('/class-grades');
        setClassGrades(Array.isArray(classesRes.data) ? classesRes.data : []);
      }
    } catch (err) {
      console.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.get(`/class-grades/${selectedClass}/sections`);
      setSections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load sections');
    }
  };

  const loadTimetable = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const params = { classGrade: selectedClass };
      if (selectedSection) params.section = selectedSection;
      
      const res = await timetableService.getAll(params);
      console.log('Timetable API response:', res.data);
      const entries = res.data;
      
      const organized = {};
      DAYS.forEach(day => {
        organized[day] = {};
        DEFAULT_TIME_SLOTS.forEach(slot => {
          organized[day][slot.periodNumber] = null;
        });
      });
      
      entries.forEach(entry => {
        console.log('Processing entry:', entry.dayOfWeek, entry.periods.length, 'periods');
        if (organized[entry.dayOfWeek]) {
          entry.periods.forEach(period => {
            organized[entry.dayOfWeek][period.periodNumber] = period;
          });
        }
      });
      
      console.log('Organized timetable:', organized);
      setTimetableEntries(organized);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (day, slot) => {
    const timeSlot = DEFAULT_TIME_SLOTS.find(s => s.periodNumber === slot);
    setSelectedDay(day);
    setSelectedSlot(slot);
    setEditingPeriod(null);
    setPeriodForm({
      periodNumber: slot,
      startTime: timeSlot?.startTime || '',
      endTime: timeSlot?.endTime || '',
      subject: '',
      teacher: '',
      room: '',
      isBreak: false
    });
    setShowModal(true);
  };

  const handleEditPeriod = (day, period) => {
    setSelectedDay(day);
    setEditingPeriod(period._id);
    setPeriodForm({
      periodNumber: period.periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      subject: period.subject?._id || '',
      teacher: period.teacher?._id || '',
      room: period.room || '',
      isBreak: period.isBreak || false
    });
    setShowModal(true);
  };

  const handleSavePeriod = async () => {
    if (!selectedClass || !selectedDay) return;
    
    try {
      const payload = {
        classGrade: selectedClass,
        section: selectedSection || null,
        dayOfWeek: selectedDay,
        periods: [{
          periodNumber: periodForm.periodNumber,
          startTime: periodForm.startTime,
          endTime: periodForm.endTime,
          subject: periodForm.isBreak ? null : periodForm.subject,
          teacher: periodForm.isBreak ? null : periodForm.teacher,
          room: periodForm.room || '',
          isBreak: periodForm.isBreak
        }],
        status: 'Active',
        effectiveFrom: new Date()
      };

      if (editingPeriod) {
        const existingEntry = Object.values(timetableEntries[selectedDay] || {}).find(
          p => p && p._id === editingPeriod
        );
        if (existingEntry) {
          const entryId = existingEntry.timetableId;
          await timetableService.update(entryId, {
            periods: [{
              ...periodForm,
              subject: periodForm.isBreak ? null : periodForm.subject,
              teacher: periodForm.isBreak ? null : periodForm.teacher
            }]
          });
        }
      } else {
        await timetableService.create(payload);
      }

      setShowModal(false);
      loadTimetable();
    } catch (err) {
      console.error('Failed to save period', err);
    }
  };

  const handleDeletePeriod = async (day, periodNumber) => {
    const period = timetableEntries[day]?.[periodNumber];
    if (!period) return;

    try {
      if (period._id) {
        await timetableService.delete(period._id);
      }
      loadTimetable();
    } catch (err) {
      console.error('Failed to delete period', err);
    }
  };

  const getSubjectColor = (subjectId) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-amber-100 text-amber-800 border-amber-200'
    ];
    const index = subjects.findIndex(s => s._id === subjectId);
    return colors[index % colors.length];
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
          <p className="text-gray-500">Schedule subjects and classes per day</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isTeacher ? 'My Class' : 'Class'}</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[160px]"
              disabled={isTeacher && teacherClassId}
            >
              <option value="">{isTeacher ? 'Select Class' : 'Select Class'}</option>
              {classGrades.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} {cls.code && `(${cls.code})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[140px]"
              disabled={!selectedClass}
            >
              <option value="">All Sections</option>
              {sections.map(sec => (
                <option key={sec._id} value={sec._id}>{sec.name}</option>
              ))}
            </select>
          </div>
          {selectedClass && (
            <button
              onClick={handleAutoGenerate}
              disabled={classSubjects.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 size={16} /> Auto Generate
            </button>
          )}
        </div>
      </div>

      {selectedClass ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading timetable...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 w-28">Time</th>
                    {DAYS.map(day => (
                      <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_TIME_SLOTS.map(slot => (
                    <tr key={slot.periodNumber} className="border-t">
                      <td className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </td>
                      {DAYS.map(day => {
                        const period = timetableEntries[day]?.[slot.periodNumber];
                        return (
                          <td key={`${day}-${slot.periodNumber}`} className="px-2 py-2">
                            {period ? (
                              <div 
                                className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                                  period.isBreak 
                                    ? 'bg-amber-50 border-amber-200' 
                                    : getSubjectColor(period.subject?._id)
                                }`}
                                onClick={() => handleEditPeriod(day, period)}
                              >
                                {period.isBreak ? (
                                  <div className="text-center">
                                    <div className="font-semibold text-amber-800">Break</div>
                                    {period.room && (
                                      <div className="text-xs text-amber-600 flex items-center justify-center gap-1 mt-1">
                                        <MapPin size={10} /> {period.room}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-semibold text-sm">{period.subject?.name || 'Subject'}</div>
                                    {period.teacher && (
                                      <div className="text-xs flex items-center gap-1 mt-1 opacity-75">
                                        <User size={10} /> {period.teacher.firstName} {period.teacher.lastName}
                                      </div>
                                    )}
                                    {period.room && (
                                      <div className="text-xs flex items-center gap-1 mt-1 opacity-75">
                                        <MapPin size={10} /> {period.room}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenModal(day, slot.periodNumber)}
                                className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                              >
                                <Plus size={20} className="text-gray-300" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12">
          <div className="text-center">
            <CalendarDays className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Class</h3>
            <p className="text-gray-500">Choose a class to view or edit its timetable</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingPeriod ? 'Edit Period' : 'Add Period'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Day:</span>
                <span className="text-sm font-semibold">{selectedDay}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={periodForm.startTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={periodForm.endTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isBreak"
                  checked={periodForm.isBreak}
                  onChange={(e) => setPeriodForm({ ...periodForm, isBreak: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isBreak" className="text-sm font-medium text-gray-700">
                  This is a Break Period
                </label>
              </div>

              {!periodForm.isBreak && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={periodForm.subject}
                      onChange={(e) => setPeriodForm({ ...periodForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(sub => (
                        <option key={sub._id} value={sub._id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                    <select
                      value={periodForm.teacher}
                      onChange={(e) => setPeriodForm({ ...periodForm, teacher: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                <input
                  type="text"
                  value={periodForm.room}
                  onChange={(e) => setPeriodForm({ ...periodForm, room: e.target.value })}
                  placeholder="e.g., Room 101"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
              {editingPeriod && (
                <button
                  onClick={() => {
                    handleDeletePeriod(selectedDay, periodForm.periodNumber);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePeriod}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timetable;
