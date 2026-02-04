
import React, { useState, useEffect } from 'react';
import { ViewType, Teacher, SchoolClass, Lesson, Subject, AppSettings } from './types';
import Sidebar from './components/Sidebar';
import TeacherPanel from './components/TeacherPanel';
import ClassPanel from './components/ClassPanel';
import SubjectPanel from './components/SubjectPanel';
import TimetablePanel from './components/TimetablePanel';
import SettingsPanel from './components/SettingsPanel';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_session') === 'active';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [activeView, setActiveView] = useState<ViewType>('timetable');
  const [triggerAdd, setTriggerAdd] = useState(false);

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    schoolName: 'Maktab Jadvali Pro',
    dashboardTitle: 'Boshqaruv Markazi',
    dashboardSubtitle: 'O\'quv jarayonini aqlli boshqarish tizimi',
    bannerUrl: 'https://images.unsplash.com/photo-1523050335392-938511794214?auto=format&fit=crop&q=80&w=1000',
    brandColor: '#4f46e5'
  });
  const [loading, setLoading] = useState(true);
  const [criticalError, setCriticalError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'shohruz' && loginForm.password === 'shohruz') {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_session', 'active');
      setLoginError('');
      setShowLoginModal(false);
    } else {
      setLoginError('Login yoki parol xato!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_session');
    setActiveView('timetable');
  };

  const resetTrigger = () => setTriggerAdd(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: cls, error: clsErr } = await supabase.from('classes').select('*').order('name');
        if (clsErr) throw clsErr;

        const { data: sub } = await supabase.from('subjects').select('*');
        const { data: tch } = await supabase.from('teachers').select('*');
        const { data: les } = await supabase.from('lessons').select('*');
        const { data: tchSub } = await supabase.from('teacher_subjects').select('*');
        
        const { data: sett } = await supabase.from('app_settings').select('*').maybeSingle();

        if (cls) setClasses(cls);
        if (sub) setSubjects(sub.map(s => ({ ...s, id: s.id, classId: s.class_id, name: s.name, weeklyHours: s.weekly_hours })));
        if (les) setLessons(les.map(l => ({ 
          ...l, 
          classId: l.class_id, 
          teacherId: l.teacher_id, 
          subjectName: l.subject_name, 
          period: parseInt(l.period as any) 
        })));
        
        if (tch) {
          const mappedTeachers = tch.map(t => ({
            id: t.id,
            name: t.name,
            mainSubject: t.main_subject,
            phone: t.phone,
            availableSlots: t.available_slots || [],
            subjectIds: tchSub?.filter(ts => ts.teacher_id === t.id).map(ts => ts.subject_id) || []
          }));
          setTeachers(mappedTeachers);
        }

        if (sett) {
            setSettings({
                id: sett.id,
                schoolName: sett.school_name,
                dashboardTitle: sett.dashboard_title,
                dashboardSubtitle: sett.dashboard_subtitle,
                bannerUrl: sett.banner_url,
                brandColor: sett.brand_color
            });
        }
      } catch (error: any) {
        console.error('Baza bilan ulanishda xatolik:', error);
        setCriticalError(error.message || 'Supabase bilan ulanishda xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (criticalError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Xatolik Yuz Berdi</h2>
        <p className="text-slate-400 max-w-md mb-8">{criticalError}</p>
        <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all">Qayta yuklash</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black uppercase tracking-widest animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar 
        activeView={activeView} 
        setActiveView={(v) => { setActiveView(v); resetTrigger(); }} 
        onLogout={handleLogout} 
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setShowLoginModal(true)}
        settings={settings}
      />
      
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {activeView === 'classes' && (
          <ClassPanel 
            classes={classes} 
            setClasses={setClasses} 
            isAdmin={true} 
            autoOpenAdd={triggerAdd}
            onModalClose={resetTrigger}
          />
        )}
        {activeView === 'subjects' && (
          <SubjectPanel 
            classes={classes} 
            subjects={subjects} 
            setSubjects={setSubjects} 
            teachers={teachers}
            isAdmin={true} 
            autoOpenAdd={triggerAdd}
            onModalClose={resetTrigger}
          />
        )}
        {activeView === 'teachers' && (
          <TeacherPanel 
            teachers={teachers} 
            setTeachers={setTeachers} 
            subjects={subjects} 
            setSubjects={setSubjects}
            lessons={lessons}
            setLessons={setLessons}
            classes={classes}
            isAdmin={true}
            autoOpenAdd={triggerAdd}
            onModalClose={resetTrigger}
          />
        )}
        {activeView === 'timetable' && (
          <TimetablePanel 
            teachers={teachers} 
            classes={classes} 
            lessons={lessons} 
            setLessons={setLessons} 
            subjects={subjects}
            isAdmin={true}
          />
        )}
        {activeView === 'settings' && isLoggedIn && (
          <SettingsPanel 
            settings={settings} 
            setSettings={setSettings} 
          />
        )}
      </main>

      {!isLoggedIn && (
        <button 
          onClick={() => setShowLoginModal(true)}
          className="fixed bottom-10 right-10 bg-indigo-600 hover:bg-indigo-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 group"
          title="Admin Kirish"
        >
          <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-3xl mx-auto mb-4">S</div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Tizimiga Kirish</h2>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Faqat vakolatli xodimlar uchun</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login</label>
                <input 
                  autoFocus
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-black transition-all" 
                  value={loginForm.username} 
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                  placeholder="shohruz"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parol</label>
                <input 
                  type="password"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-black transition-all" 
                  value={loginForm.password} 
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                  placeholder="••••••••"
                />
              </div>
              {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{loginError}</p>}
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all">Kirish</button>
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200">Bekor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
