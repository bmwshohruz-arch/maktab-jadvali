
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { supabase } from '../supabase';

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const payload = {
        school_name: formData.schoolName,
        dashboard_title: formData.dashboardTitle,
        dashboard_subtitle: formData.dashboardSubtitle,
        banner_url: formData.bannerUrl,
        brand_color: formData.brandColor
      };

      let error;
      if (settings.id) {
        const { error: err } = await supabase
          .from('app_settings')
          .update(payload)
          .eq('id', settings.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('app_settings')
          .insert([payload]);
        error = err;
      }

      if (!error) {
        setSettings(formData);
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-12">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Tizim Sozlamalari</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs mt-2 ml-1">Brending va tashqi ko'rinish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Maktab/Tashkilot Nomi</label>
                <input 
                  required
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black transition-all" 
                  value={formData.schoolName}
                  onChange={e => setFormData({...formData, schoolName: e.target.value})}
                  placeholder="Masalan: 42-IDUM"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dashboard Sarlavhasi</label>
                  <input 
                    required
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black transition-all" 
                    value={formData.dashboardTitle}
                    onChange={e => setFormData({...formData, dashboardTitle: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brend Rangi</label>
                  <div className="flex gap-4">
                    <input 
                      type="color"
                      className="w-20 h-16 bg-slate-50 border-2 border-transparent rounded-2xl cursor-pointer p-2" 
                      value={formData.brandColor}
                      onChange={e => setFormData({...formData, brandColor: e.target.value})}
                    />
                    <input 
                      className="flex-1 px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black uppercase" 
                      value={formData.brandColor}
                      onChange={e => setFormData({...formData, brandColor: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dashboard Izohi (Subtitle)</label>
                <textarea 
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black min-h-[100px] resize-none" 
                  value={formData.dashboardSubtitle}
                  onChange={e => setFormData({...formData, dashboardSubtitle: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner Rasm URL</label>
                <input 
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black" 
                  value={formData.bannerUrl}
                  onChange={e => setFormData({...formData, bannerUrl: e.target.value})}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
              </button>
              {saveStatus === 'success' && <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Muvaffaqiyatli saqlandi!</span>}
              {saveStatus === 'error' && <span className="text-red-500 font-black text-[10px] uppercase tracking-widest">Xatolik yuz berdi!</span>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Jonli Ko'rinish (Preview)</label>
          <div className="bg-slate-900 rounded-[3.5rem] p-4 shadow-2xl overflow-hidden">
             <div className="bg-white rounded-[3rem] overflow-hidden min-h-[400px]">
                <div className="h-32 w-full relative">
                  <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-8">
                      <h4 className="text-xl font-black text-white leading-tight">{formData.dashboardTitle}</h4>
                      <p className="text-[8px] text-white/70 uppercase font-bold tracking-widest line-clamp-1">{formData.dashboardSubtitle}</p>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: formData.brandColor }}></div>
                        <span className="font-black text-slate-800 text-sm">{formData.schoolName}</span>
                    </div>
                    <div className="h-4 w-3/4 bg-slate-100 rounded-full"></div>
                    <div className="h-4 w-1/2 bg-slate-100 rounded-full"></div>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="h-20 bg-slate-50 rounded-2xl border border-slate-100"></div>
                        <div className="h-20 bg-slate-50 rounded-2xl border border-slate-100"></div>
                    </div>
                </div>
             </div>
          </div>
          <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem]">
              <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                Ushbu sozlamalar tizimning barcha qismlariga ta'sir qiladi. Banner rasmi uchun Unsplash yoki shunga o'xshash servislar havolasidan foydalanish tavsiya etiladi.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
