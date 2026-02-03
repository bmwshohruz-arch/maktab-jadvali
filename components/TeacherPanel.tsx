
import React, { useState, useEffect } from 'react';
import { Teacher, Lesson, Day, SchoolClass, Subject } from '../types';
import { supabase } from '../supabase';

interface TeacherPanelProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  classes: SchoolClass[];
  isAdmin: boolean;
  autoOpenAdd?: boolean;
  onModalClose?: () => void;
}

const TeacherPanel: React.FC<TeacherPanelProps> = ({ teachers, setTeachers, subjects, setSubjects, lessons, setLessons, classes, isAdmin, autoOpenAdd, onModalClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  const days = Object.values(Day);
  const periods = [1, 2, 3, 4, 5, 6];
  const initialSlots = days.flatMap(d => periods.map(p => `${d}-${p}`));

  const [formData, setFormData] = useState({
    name: '',
    mainSubject: '',
    phone: '',
    availableSlots: initialSlots,
    subjectIds: [] as string[]
  });

  useEffect(() => {
    if (autoOpenAdd && isAdmin) {
      setIsAdding(true);
      setEditingTeacher(null);
      resetForm();
    }
  }, [autoOpenAdd, isAdmin]);

  const closeModals = () => {
    setIsAdding(false);
    setEditingTeacher(null);
    if (onModalClose) onModalClose();
  };

  const resetForm = () => setFormData({ 
    name: '', 
    mainSubject: '', 
    phone: '', 
    availableSlots: initialSlots, 
    subjectIds: [] 
  });

  const handleEdit = (teacher: Teacher) => {
    if (!isAdmin) return;
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      mainSubject: teacher.mainSubject,
      phone: teacher.phone,
      availableSlots: teacher.availableSlots,
      subjectIds: teacher.subjectIds
    });
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const payload = {
      name: formData.name,
      main_subject: formData.mainSubject,
      phone: formData.phone,
      available_slots: formData.availableSlots
    };

    if (editingTeacher) {
      const { error: teacherError } = await supabase
        .from('teachers')
        .update(payload)
        .eq('id', editingTeacher.id);

      if (!teacherError) {
        await supabase.from('teacher_subjects').delete().eq('teacher_id', editingTeacher.id);
        if (formData.subjectIds.length > 0) {
          const pivotData = formData.subjectIds.map(sId => ({
            teacher_id: editingTeacher.id,
            subject_id: sId
          }));
          await supabase.from('teacher_subjects').insert(pivotData);
        }

        setTeachers(teachers.map(t => t.id === editingTeacher.id ? { ...t, ...formData } : t));
        closeModals();
      }
    } else {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert([payload])
        .select();

      if (teacherData) {
        const newTeacherId = teacherData[0].id;
        if (formData.subjectIds.length > 0) {
          const pivotData = formData.subjectIds.map(sId => ({
            teacher_id: newTeacherId,
            subject_id: sId
          }));
          await supabase.from('teacher_subjects').insert(pivotData);
        }

        const newTeacher: Teacher = {
          id: newTeacherId,
          name: teacherData[0].name,
          mainSubject: teacherData[0].main_subject,
          phone: teacherData[0].phone,
          availableSlots: teacherData[0].available_slots,
          subjectIds: formData.subjectIds
        };

        setTeachers([...teachers, newTeacher]);
        closeModals();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("O'qituvchini o'chirmoqchimisiz?")) return;
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (!error) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const toggleSubject = (sId: string) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(sId) ? prev.subjectIds.filter(id => id !== sId) : [...prev.subjectIds, sId]
    }));
  };

  const toggleSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availableSlots: prev.availableSlots.includes(slot) 
        ? prev.availableSlots.filter(s => s !== slot) 
        : [...prev.availableSlots, slot]
    }));
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">O'qituvchilar</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs mt-2 ml-1">Xodimlar va ularning ish grafigi</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setIsAdding(true); setEditingTeacher(null); resetForm(); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-indigo-100 flex items-center gap-3 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            O'qituvchi Qo'shish
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {teachers.map(t => (
          <div key={t.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
             <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-100">{t.name[0]}</div>
                <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{t.name}</h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">{t.mainSubject}</span>
                      <span className="text-slate-400 text-[10px] font-bold">{t.phone}</span>
                    </div>
                </div>
             </div>
             
             <div className="flex flex-wrap gap-2 mb-8 min-h-[40px]">
                {t.subjectIds.map(sId => {
                    const s = subjects.find(sub => sub.id === sId);
                    const c = classes.find(cl => cl.id === s?.classId);
                    return s ? (
                        <span key={sId} className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-black uppercase rounded-xl border border-slate-100">
                            {s.name} ({c?.name})
                        </span>
                    ) : null;
                })}
             </div>

             <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {t.availableSlots.length} ta dars sloti ochiq
                </div>
                {isAdmin && (
                  <div className="flex gap-4">
                    <button onClick={() => handleEdit(t)} className="text-indigo-600 hover:text-indigo-800 font-bold uppercase text-[10px] tracking-widest transition-colors flex items-center gap-1">
                      Tahrirlash
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600 font-bold uppercase text-[10px] tracking-widest transition-colors">O'chirish</button>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

      {isAdding && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl w-full max-w-6xl my-8 animate-in zoom-in duration-500">
            <div className="flex justify-between items-start mb-8">
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{editingTeacher ? 'Tahrirlash' : 'O\'qituvchi Qo\'shish'}</h3>
                <button onClick={closeModals} className="p-4 bg-slate-100 rounded-3xl hover:bg-slate-200">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ism Familiya</label>
                      <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Aliyev Valijon" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon Nomeri</label>
                      <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+998 90 123 45 67" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mutaxassisligi (Asosiy fan)</label>
                      <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black" value={formData.mainSubject} onChange={e => setFormData({...formData, mainSubject: e.target.value})} placeholder="Informatika" />
                  </div>

                  <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dars Beradigan Fanlari</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {subjects.map(s => (
                            <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                                className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${formData.subjectIds.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}
                            >
                                <p className="font-black text-sm">{s.name} ({classes.find(cl => cl.id === s.classId)?.name})</p>
                            </button>
                        ))}
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Haftalik Ish Grafigi (Kunlar va Soatlar)</label>
                  <div className="bg-slate-50 p-6 rounded-[3rem] border-2 border-slate-100 overflow-x-auto">
                      <table className="w-full border-separate border-spacing-2">
                          <thead>
                              <tr>
                                  <th className="w-12"></th>
                                  {days.map(d => <th key={d} className="text-[10px] font-black text-slate-400 uppercase">{d.substring(0, 3)}</th>)}
                              </tr>
                          </thead>
                          <tbody>
                              {periods.map(p => (
                                  <tr key={p}>
                                      <td className="text-[10px] font-black text-slate-400 text-center">{p}</td>
                                      {days.map(d => {
                                          const slot = `${d}-${p}`;
                                          const active = formData.availableSlots.includes(slot);
                                          return (
                                              <td key={slot}>
                                                  <button type="button" onClick={() => toggleSlot(slot)}
                                                      className={`w-full h-12 rounded-xl transition-all border-2 ${active ? 'bg-indigo-600 border-indigo-500 shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                                                  />
                                              </td>
                                          );
                                      })}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="submit" className="flex-[2] bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-indigo-700">Saqlash</button>
                    <button type="button" onClick={closeModals} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs">Bekor</button>
                  </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPanel;
