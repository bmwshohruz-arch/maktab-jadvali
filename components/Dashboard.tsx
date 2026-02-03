
import React from 'react';
import { Teacher, SchoolClass, Lesson, ViewType, Subject, AppSettings } from '../types';

interface DashboardProps {
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  lessons: Lesson[];
  setActiveView: (view: ViewType) => void;
  settings: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ teachers, classes, subjects, lessons, setActiveView, settings }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative h-64 w-full rounded-[3rem] overflow-hidden mb-12 shadow-2xl">
          <img 
            src={settings.bannerUrl} 
            alt="School Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent flex flex-col justify-center px-12">
              <h2 className="text-5xl font-black text-white tracking-tighter italic mb-2">{settings.dashboardTitle}</h2>
              <p className="text-slate-200 font-bold uppercase tracking-widest text-xs opacity-80">{settings.dashboardSubtitle}</p>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          label="O'qituvchilar" 
          count={teachers.length} 
          color="bg-indigo-600" 
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          onClick={() => setActiveView('teachers')}
        />
        <StatCard 
          label="Sinflar" 
          count={classes.length} 
          color="bg-purple-600" 
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
          onClick={() => setActiveView('classes')}
        />
        <StatCard 
          label="Fanlar" 
          count={subjects.length} 
          color="bg-pink-600" 
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          onClick={() => setActiveView('subjects')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase text-xs">Yaqinda qo'shilganlar</h3>
            <button onClick={() => setActiveView('teachers')} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Barchasi</button>
          </div>
          <div className="space-y-4">
            {teachers.slice(-3).map(t => (
              <div 
                key={t.id} 
                onClick={() => setActiveView('teachers')}
                className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-indigo-50 hover:translate-x-1 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 tracking-tight">{t.name}</p>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">{t.mainSubject}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-slate-400 text-xs italic text-center py-8 font-medium">Ma'lumot mavjud emas</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase text-xs">Dars jadvali progressi</h3>
            <button onClick={() => setActiveView('timetable')} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">To'liq jadval</button>
          </div>
          <div className="space-y-6">
            {classes.slice(0, 5).map(c => {
              const classLessons = lessons.filter(l => l.classId === c.id).length;
              const completion = Math.min((classLessons / 36) * 100, 100);
              return (
                <div key={c.id} className="space-y-3 cursor-pointer group" onClick={() => setActiveView('timetable')}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="group-hover:text-indigo-600 transition-colors">{c.name} sinfi</span>
                    <span className={completion === 100 ? 'text-emerald-500' : 'text-indigo-500'}>
                        {classLessons}/36 soat ({Math.round(completion)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-50">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out shadow-sm ${completion === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {classes.length === 0 && <p className="text-slate-400 text-xs italic text-center py-8 font-medium">Sinflar mavjud emas</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; count: number; color: string; icon: string; onClick: () => void }> = ({ label, count, color, icon, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-6 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.05] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`}></div>
    <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-${color}/20 group-hover:scale-110 transition-transform duration-300`}>
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
      </svg>
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-800 tracking-tighter">{count}</p>
    </div>
  </div>
);

export default Dashboard;
