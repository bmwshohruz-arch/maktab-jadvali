
import React, { useState, useEffect } from 'react';
import { SchoolClass, Subject, Teacher } from '../types';
import { supabase } from '../supabase';

interface SubjectPanelProps {
  classes: SchoolClass[];
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  teachers: Teacher[]; // Added teachers prop
  isAdmin: boolean;
  autoOpenAdd?: boolean;
  onModalClose?: () => void;
}

const SubjectPanel: React.FC<SubjectPanelProps> = ({ classes, subjects, setSubjects, teachers, isAdmin, autoOpenAdd, onModalClose }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', weeklyHours: 1 });

  useEffect(() => {
    if (autoOpenAdd && isAdmin) {
      if (!selectedClassId && classes.length > 0) {
        setSelectedClassId(classes[0].id);
      }
      setIsAdding(true);
    }
  }, [autoOpenAdd, isAdmin, classes]);

  const closeModals = () => {
    setIsAdding(false);
    if (onModalClose) onModalClose();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !isAdmin) return;

    const { data, error } = await supabase
      .from('subjects')
      .insert([{
        class_id: selectedClassId,
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
      setFormData({ name: '', weeklyHours: 1 });
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
      <div className="mb-12">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Fanlar</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs mt-2 ml-1">O'quv rejasini shakllantiring</p>
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
              <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{selectedClass?.name} sinfi darslari</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Haftalik yuklama: {classSubjects.reduce((a,c) => a+c.weeklyHours, 0)} soat</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
                  >
                    Fan Qo'shish
                  </button>
                )}
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
            <div className="bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex items-center justify-center min-h-[500px]">
                <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Chapdan sinf tanlang</p>
            </div>
          )}
        </div>
      </div>

      {isAdding && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Fan Biriktirish</h3>
            <form onSubmit={handleAdd} className="space-y-6">
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
