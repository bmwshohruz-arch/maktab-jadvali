
export enum Day {
  MONDAY = 'Dushanba',
  TUESDAY = 'Seshanba',
  WEDNESDAY = 'Chorshanba',
  THURSDAY = 'Payshanba',
  FRIDAY = 'Juma',
  SATURDAY = 'Shanba'
}

export interface SchoolClass {
  id: string;
  name: string;
  room: string;
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  weeklyHours: number;
  assignedTeacherId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  mainSubject: string;
  phone: string;
  availableSlots: string[];
  subjectIds: string[];
}

export interface Lesson {
  id: string;
  classId: string;
  teacherId: string;
  subjectName: string;
  day: Day;
  period: number;
}

export interface AppSettings {
  id?: string;
  schoolName: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  bannerUrl: string;
  brandColor: string;
}

export type ViewType = 'dashboard' | 'classes' | 'subjects' | 'teachers' | 'timetable' | 'settings';
