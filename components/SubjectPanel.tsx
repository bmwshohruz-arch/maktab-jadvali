
import React, { useState, useEffect } from 'react';
import { SchoolClass, Subject, Teacher } from '../types';
import { supabase } from '../supabase';

interface SubjectPanelProps {
  classes: SchoolClass[];
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  teachers: Teacher[];
  isAdmin: boolean;
  autoOpenAdd?: boolean;
  onModalClose?: () => void;
}

const SubjectPanel: React.FC<SubjectPanelProps> = ({ classes, subjects, setSubjects, teachers, isAdmin, autoOpenAdd, onModalClose }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', weeklyHours: 1, classId: '' });

  useEffect(() => {
    if (autoOpenAdd && isAdmin) {
      setIsAdding(true);
      if (selectedClassId) {
        setFormData(prev => ({ ...prev, classId: selectedClassId }));
      } else if (classes.length > 0) {
        setFormData(prev => ({ ...prev, classId: classes[0].id }));
      }
    }
  }, [autoOpenAdd, isAdmin, classes, selectedClassId]);

  const closeModals = () => {
    setIsAdding(false);
    if (onModalClose) onModalClose();
  };

  const openAddModal = () => {
    setFormData({ 
      name: '', 
      weeklyHours: 1, 
      classId: selectedClassId || (classes.length > 0 ? classes[0].id : '') 
    });
    setIsAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !isAdmin) return;

    const { data, error } = await supabase
      .from('subjects')
      .insert([{
        class_id: formData.classId,
        name: formData.name,
        weekly_hours: formData.weeklyHours
      }])
      .select();

    if (data) {
      const newSub: Subject = {
        id: data[0].id,
        classId: data[0].class_id,
        name: data[0].name,
        weeklyHours: data[0].weekly_hours
      };
      setSubjects([...subjects, newSub]);
      // Agar yangi qo'shilgan fan hozirgi tanlangan sinfga tegishli bo'lsa, ko'rinishni yangilash shart emas, chunki subjects state o'zgardi
      closeModals();
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Fanni o'chirmoqchimisiz?")) return;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (!error) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classSubjects = subjects.filter(s => s.classId === selectedClassId);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-12 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Fanlar</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs mt-2 ml-1">O'quv rejasini shakllantiring</p>
        </div>
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-indigo-100 flex items-center gap-3 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Fan Qo'shish
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sinfni Tanlang</label>
          <div className="space-y-2">
            {classes.map(c => {
              const unassignedCount = subjects.filter(s => s.classId === c.id && !teachers.some(t => t.subjectIds.includes(s.id))).length;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClassId(c.id); if (onModalClose) onModalClose(); }}
                  className={`w-full p-6 rounded-3xl text-left transition-all border-2 font-black relative overflow-hidden ${
                    selectedClassId === c.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-2' 
                    : 'bg-white border-white text-slate-500 hover:border-indigo-100 hover:text-indigo-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg">{c.name}</span>
                    {unassignedCount > 0 && (
                      <span className={`text-[8px] px-2 py-0.5 rounded-full ${selectedClassId === c.id ? 'bg-white/20 text-white' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                        {unassignedCount} ta muammo
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {classes.length === 0 && <p className="text-slate-300 text-xs italic p-4">Avval sinflarni qo'shing</p>}
        </div>

        <div className="lg:col-span-3">
          {selectedClassId ? (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[500px]">
              <div className="mb-10">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{selectedClass?.name} sinfi darslari</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Haftalik yuklama: {classSubjects.reduce((a,c) => a+c.weeklyHours, 0)} soat</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classSubjects.map(s => {
                  const assignedTeacher = teachers.find(t => t.subjectIds.includes(s.id));
                  return (
                    <div key={s.id} className={`p-6 bg-slate-50 rounded-2xl border-2 transition-all group flex justify-between items-center ${!assignedTeacher ? 'border-red-100 bg-red-50/20' : 'border-transparent hover:border-indigo-200'}`}>
                      <div>
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${!assignedTeacher ? 'text-red-400' : 'text-indigo-400'}`}>
                            {s.weeklyHours} soat • {assignedTeacher ? 'Biriktirilgan' : 'Tayinlanmagan'}
                          </p>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight">{s.name}</h4>
                          <div className="mt-3 flex items-center gap-2">
                            {assignedTeacher ? (
                              <>
                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] text-indigo-600 font-black">{assignedTeacher.name[0]}</div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{assignedTeacher.name}</span>
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded">O'qituvchi tayinlanmagan!</span>
                            )}
                          </div>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleDelete(s.id)} className="p-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {classSubjects.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">Hali fanlar qo'shilmadi</div>}
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg>
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Chapdan sinfni tanlang yoki yuqoridagi tugma orqali fan qo'shing</p>
                </div>
            </div>
          )}
        </div>
      </div>

      {isAdding && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Fan Qo'shish</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sinfni Tanlang</label>
                <select 
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black transition-all appearance-none"
                  value={formData.classId}
                  onChange={e => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="" disabled>Sinfni tanlang</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fan Nomi</label>
                <input 
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black transition-all" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Informatika"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Haftalik Soat (1-6)</label>
                <div className="grid grid-cols-6 gap-2">
                    {[1,2,3,4,5,6].map(h => (
                        <button 
                            key={h}
                            type="button"
                            onClick={() => setFormData({...formData, weeklyHours: h})}
                            className={`py-3 rounded-xl font-black text-xs transition-all ${formData.weeklyHours === h ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                            {h}
                        </button>
                    ))}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100">Tasdiqlash</button>
                <button type="button" onClick={closeModals} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Bekor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPanel;
