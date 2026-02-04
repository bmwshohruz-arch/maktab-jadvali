
import React, { useState } from 'react';
import { Teacher, SchoolClass, Lesson, Day, Subject } from '../types';
import { supabase } from '../supabase';
import { GoogleGenAI, Type } from "@google/genai";

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

  const handleSaveToDB = async (newLessons: any[]) => {
    if (!isAdmin) return;
    
    // Avvalgi darslarni o'chirish
    await supabase.from('lessons').delete().eq('class_id', selectedClassId);
    
    const payload = newLessons.map(l => ({
      class_id: selectedClassId,
      teacher_id: l.teacherId,
      subject_name: l.subjectName,
      day: l.day,
      period: l.period
    }));

    const { data, error } = await supabase.from('lessons').insert(payload).select();
    if (data) {
        const mappedData = data.map(d => ({
            id: d.id,
            classId: d.class_id,
            teacherId: d.teacher_id,
            subjectName: d.subject_name,
            day: d.day as Day,
            period: d.period
        }));
        setLessons([...lessons.filter(l => l.classId !== selectedClassId), ...mappedData]);
    }
  };

  const generateWithAI = async () => {
    if (!isAdmin) return;
    if (teachers.length === 0 || subjects.length === 0) {
        alert("Avval o'qituvchilar va fanlarni kiritib oling!");
        return;
    }

    const currentClass = classes.find(c => c.id === selectedClassId);
    if (!currentClass) return;

    setIsGenerating(true);
    setGenMessage('Gemini AI ma\'lumotlarni tahlil qilmoqda...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Boshqa sinflarning bandligini aniqlash (o'qituvchi to'qnashuvini oldini olish uchun)
      const otherLessons = lessons.filter(l => l.classId !== selectedClassId);
      const classSubjects = subjects.filter(s => s.classId === selectedClassId);
      
      const teacherContext = teachers.map(t => ({
        id: t.id,
        name: t.name,
        availableSlots: t.availableSlots,
        teachingSubjectIds: t.subjectIds
      }));

      const subjectContext = classSubjects.map(s => ({
        id: s.id,
        name: s.name,
        hours: s.weeklyHours,
        teacherId: teachers.find(t => t.subjectIds.includes(s.id))?.id
      }));

      const busyContext = otherLessons.map(l => ({
        teacherId: l.teacherId,
        day: l.day,
        period: l.period
      }));

      const prompt = `
        Siz maktab o'quv bo'limi mudiri va dars jadvali tuzuvchi mutaxassissiz. 
        "${currentClass.name}" sinfi uchun haftalik dars jadvalini tuzishingiz kerak.
        
        MA'LUMOTLAR:
        1. Fanlar ro'yxati (haftalik soati bilan): ${JSON.stringify(subjectContext)}
        2. O'qituvchilar va ularning bo'sh vaqtlari: ${JSON.stringify(teacherContext)}
        3. O'qituvchilarning boshqa sinflarda dars o'tadigan vaqtlari (to'qnashuv bo'lmasligi kerak!): ${JSON.stringify(busyContext)}
        
        QOIDALAR:
        - Har bir fanning haftalik soatiga qat'iy amal qiling.
        - O'qituvchi faqat o'zining "availableSlots" vaqtida dars o'tishi mumkin.
        - Bir vaqtda bir o'qituvchi ikki xil joyda bo'la olmaydi.
        - Bir kunda bir xil fandan ko'pi bilan 2 ta dars bo'lishi mumkin.
        - Kunlik darslar soni 1 dan 6 gacha bo'lishi mumkin.
        - Ish kunlari: Dushanba, Seshanba, Chorshanba, Payshanba, Juma, Shanba.
        
        Jadvalni JSON formatida qaytaring. Har bir obyektda subjectName, teacherId, day (to'liq nomi bilan), period (1-6) bo'lishi shart.
      `;

      setGenMessage('Optimal dars taqsimoti hisoblanmoqda...');

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subjectName: { type: Type.STRING },
                teacherId: { type: Type.STRING },
                day: { type: Type.STRING },
                period: { type: Type.INTEGER }
              },
              required: ["subjectName", "teacherId", "day", "period"]
            }
          }
        }
      });

      const generatedSchedule = JSON.parse(response.text);
      setGenMessage('Ma\'lumotlar bazaga saqlanmoqda...');
      await handleSaveToDB(generatedSchedule);
      
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Jadval tuzishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki ma'lumotlar to'g'riligini tekshiring.");
    } finally {
      setIsGenerating(false);
      setGenMessage('');
    }
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
            {isAdmin ? "Aqlli dars jadvali boshqaruvi" : "Maktab o'quv rejasi"}
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
              onClick={generateWithAI}
              disabled={isGenerating || subjects.length === 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl ${
                isGenerating 
                ? 'bg-indigo-50 text-indigo-400 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:scale-105 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                   <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                   <span>Tuzilmoqda...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>AI Jadval Tuzish</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isGenerating && (
        <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-2xl animate-pulse flex items-center justify-center gap-6">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-white font-black uppercase tracking-widest text-sm italic">{genMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
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
                      <td key={day} className="p-3 border-b border-r border-slate-100 last:border-r-0 h-44 min-w-[200px]">
                        {lesson ? (
                          <div className="bg-white border-2 border-slate-100 h-full w-full rounded-[2.2rem] p-6 flex flex-col justify-between group/lesson shadow-sm hover:shadow-2xl hover:border-indigo-400 transition-all duration-500 relative overflow-hidden animate-in zoom-in">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                            {isAdmin && (
                              <button onClick={() => removeLesson(lesson.id)} className="absolute top-4 right-4 opacity-0 group-hover/lesson:opacity-100 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm z-10">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                            <div>
                              <p className="font-black text-slate-900 text-[13px] leading-tight uppercase mb-2 line-clamp-2">{lesson.subjectName}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">{teacher?.name?.[0]}</div>
                                <p className="text-[10px] font-bold text-slate-400 truncate">{teacher?.name || 'O\'qituvchi'}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-[9px] bg-indigo-50 px-3 py-1.5 rounded-full font-black text-indigo-600 uppercase">
                                  {classes.find(c => c.id === selectedClassId)?.room}-xona
                                </span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic">Maktab Pro</span>
                            </div>
                          </div>
                        ) : (
                          isAdmin && (
                            <div className="h-full w-full border-2 border-dashed border-slate-50 rounded-[2.2rem] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bo'sh soat</p>
                            </div>
                          )
                        )}
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
