
import React, { useState, useEffect } from 'react';
import { SchoolClass } from '../types';
import { supabase } from '../supabase';

interface ClassPanelProps {
  classes: SchoolClass[];
  setClasses: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  isAdmin: boolean;
  autoOpenAdd?: boolean;
  onModalClose?: () => void;
}

const ClassPanel: React.FC<ClassPanelProps> = ({ classes, setClasses, isAdmin, autoOpenAdd, onModalClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState({ name: '', room: '' });

  useEffect(() => {
    if (autoOpenAdd && isAdmin) {
      setIsAdding(true);
    }
  }, [autoOpenAdd, isAdmin]);

  const closeModals = () => {
    setIsAdding(false);
    setEditingClass(null);
    if (onModalClose) onModalClose();
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    if (editingClass) {
      const { data, error } = await supabase
        .from('classes')
        .update(formData)
        .eq('id', editingClass.id)
        .select();

      if (data) {
        setClasses(classes.map(c => c.id === editingClass.id ? data[0] : c));
        closeModals();
      }
    } else {
      const { data, error } = await supabase
        .from('classes')
        .insert([formData])
        .select();

      if (data) {
        setClasses([...classes, data[0]]);
        closeModals();
      }
    }
    setFormData({ name: '', room: '' });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (!error) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Sinflar</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs mt-2 ml-1">Mavjud sinflar va xonalar</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setIsAdding(true); setEditingClass(null); setFormData({ name: '', room: '' }); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-indigo-100 flex items-center gap-3 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Sinf Qo'shish
          </button>
        )}
      </div>

      {(isAdding || editingClass) && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">{editingClass ? 'Sinfni Tahrirlash' : 'Yangi Sinf'}</h3>
            <form onSubmit={handleAddOrUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sinf Nomi</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Masalan: 9-A" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xona Raqami</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Masalan: 304" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100">Saqlash</button>
                <button type="button" onClick={closeModals} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Bekor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {classes.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">{c.name}</h3>
            <div className="flex items-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              {c.room}-xona
            </div>
            {isAdmin && (
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button onClick={() => { setEditingClass(c); setFormData({ name: c.name, room: c.room }); }} className="p-3 text-slate-200 hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassPanel;
