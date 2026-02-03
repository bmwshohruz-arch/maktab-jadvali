
import React, { useState } from 'react';
import { Teacher, SchoolClass, Lesson, Day, Subject } from '../types';
import { supabase } from '../supabase';

interface TimetablePanelProps {
  teachers: Teacher[];
  classes: SchoolClass[];
  lessons: Lesson[];
  setLessons: (newList: Lesson[]) => void;
  subjects: Subject[];
  isAdmin: boolean;
}

const TimetablePanel: React.FC<TimetablePanelProps> = ({ teachers, classes, lessons, setLessons, subjects, isAdmin }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  const days = Object.values(Day);
  const periods = [1, 2, 3, 4, 5, 6];

  const getLesson = (day: Day, period: number) => {
    return lessons.find(l => l.classId === selectedClassId && l.day === day && l.period === period);
  };

  const handleSaveToDB = async (newLessons: Lesson[]) => {
    if (!isAdmin) return;
    const { error: delErr } = await supabase.from('lessons').delete().eq('class_id', selectedClassId);
    
    const payload = newLessons.map(l => ({
      class_id: l.classId,
      teacher_id: l.teacherId,
      subject_name: l.subjectName,
      day: l.day,
      period: l.period
    }));

    const { data, error } = await supabase.from('lessons').insert(payload).select();
    if (data) {
        setLessons([...lessons.filter(l => l.classId !== selectedClassId), ...data.map(d => ({...d, classId: d.class_id, teacherId: d.teacher_id, subjectName: d.subject_name}))]);
    }
  };

  const generateFullSchedule = () => {
    if (!isAdmin) return;
    if (teachers.length === 0 || subjects.length === 0) {
        alert("Avval o'qituvchilar va fanlarni kiritib oling!");
        return;
    }

    setIsGenerating(true);
    setGenMessage('Darslar taqsimlanmoqda...');
    
    setTimeout(async () => {
      const classSpecificLessons: Lesson[] = [];
      const classSubjects = subjects.filter(s => s.classId === selectedClassId);
      let queue: { subject: Subject; teacher: Teacher }[] = [];
      
      classSubjects.forEach(sub => {
        const teacher = teachers.find(t => t.subjectIds.includes(sub.id));
        if (teacher) {
          for (let i = 0; i < sub.weeklyHours; i++) {
            queue.push({ subject: sub, teacher });
          }
        }
      });

      queue = queue.sort((a, b) => b.subject.weeklyHours - a.subject.weeklyHours);

      queue.forEach(item => {
        let placed = false;
        const shuffledPeriods = [...periods].sort(() => Math.random() - 0.5);
        const shuffledDays = [...days].sort(() => Math.random() - 0.5);

        for (let p of shuffledPeriods) {
          if (placed) break;
          for (let d of shuffledDays) {
            if (placed) break;
            
            const slotKey = `${d}-${p}`;
            if (!item.teacher.availableSlots.includes(slotKey)) continue;
            
            const teacherBusy = classSpecificLessons.some(l => l.teacherId === item.teacher.id && l.day === d && l.period === p);
            if (teacherBusy) continue;
            
            const classBusy = classSpecificLessons.some(l => l.classId === item.subject.classId && l.day === d && l.period === p);
            if (classBusy) continue;

            const sameDayExists = classSpecificLessons.some(l => l.classId === item.subject.classId && l.day === d && l.subjectName === item.subject.name);
            if (sameDayExists) continue;

            classSpecificLessons.push({
              id: Math.random().toString(36).substr(2, 9),
              classId: item.subject.classId,
              teacherId: item.teacher.id,
              subjectName: item.subject.name,
              day: d,
              period: p
            });
            placed = true;
          }
        }
      });

      await handleSaveToDB(classSpecificLessons);
      setIsGenerating(false);
      setGenMessage('');
    }, 800);
  };

  const removeLesson = async (id: string) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (!error) {
        setLessons(lessons.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Dars Jadvali</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs mt-2 ml-1">
            {isAdmin ? "Boshqaruv rejimi" : "Faqat ko'rish rejimi"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <select 
            className="bg-white border-4 border-slate-100 rounded-[1.5rem] px-6 py-4 outline-none font-black text-slate-700 shadow-sm transition-all focus:border-indigo-500 appearance-none cursor-pointer hover:border-indigo-200"
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} sinfi</option>)}
          </select>

          {isAdmin && (
            <button 
              onClick={generateFullSchedule}
              disabled={isGenerating || subjects.length === 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl ${
                isGenerating 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:scale-105 active:scale-95'
              }`}
            >
              <svg className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Jadval Tuzish
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-8 text-[10px] font-black text-slate-400 border-b border-r border-slate-100 w-24 uppercase tracking-widest">Soat</th>
                {days.map(day => (
                  <th key={day} className="p-8 text-[10px] font-black text-slate-800 text-center border-b border-r border-slate-100 last:border-r-0 uppercase tracking-widest bg-white">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period} className="group">
                  <td className="p-4 text-center font-black text-slate-300 border-b border-r border-slate-100 bg-slate-50/20 text-lg">
                    {period}
                  </td>
                  {days.map(day => {
                    const lesson = getLesson(day, period);
                    const teacher = lesson ? teachers.find(t => t.id === lesson.teacherId) : null;
                    return (
                      <td key={day} className="p-3 border-b border-r border-slate-100 last:border-r-0 h-44 min-w-[180px]">
                        {lesson ? (
                          <div className="bg-white border-2 border-slate-100 h-full w-full rounded-[2rem] p-6 flex flex-col justify-between group/lesson shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                            {isAdmin && (
                              <button onClick={() => removeLesson(lesson.id)} className="absolute top-4 right-4 opacity-0 group-hover/lesson:opacity-100 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm z-10">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                            <div>
                              <p className="font-black text-slate-900 text-xs leading-tight uppercase mb-2">{lesson.subjectName}</p>
                              <p className="text-[10px] font-bold text-slate-400">{teacher?.name || 'O\'qituvchi'}</p>
                            </div>
                            <span className="text-[9px] bg-slate-50 px-3 py-1.5 rounded-full font-black text-slate-500 uppercase self-start">
                              {classes.find(c => c.id === selectedClassId)?.room}-xona
                            </span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimetablePanel;
