
import React from 'react';
import { ViewType, AppSettings } from '../types';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  settings: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout, isLoggedIn, onLoginClick, settings }) => {
  const navItems: { id: ViewType; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'timetable', label: 'Dars Jadvali', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002-2z' },
    { id: 'classes', label: 'Sinflar', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16' },
    { id: 'subjects', label: 'Fanlar', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13' },
    { id: 'teachers', label: 'O\'qituvchilar', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857' },
    { id: 'settings', label: 'Sozlamalar', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', adminOnly: true },
  ];

  return (
    <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-50">
      <div className="p-8">
        <div className="flex items-center gap-3">
            <div 
                className="w-10 h-10 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg"
                style={{ backgroundColor: settings.brandColor }}
            >
                {settings.schoolName[0]}
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic line-clamp-1">{settings.schoolName}</h1>
        </div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 ml-1">Boshqaruv Tizimi</p>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          (!item.adminOnly || isLoggedIn) && (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 translate-x-2' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
              </svg>
              <span className="font-black text-sm uppercase tracking-wider">{item.label}</span>
            </button>
          )
        ))}
      </nav>

      <div className="p-8 border-t border-slate-800">
        {isLoggedIn ? (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold border-2 border-indigo-400">S</div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight">Admin</p>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest">SHOHRUZ</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
            >
              Chiqish
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/20 p-4 rounded-2xl border border-dashed border-slate-700">
             <p className="text-slate-500 text-[9px] font-bold uppercase text-center tracking-widest">Tizimni tahrirlash uchun admin sifatida kiring</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
