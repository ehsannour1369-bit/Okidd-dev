import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TeacherSchool {
  id: number;
  name: string;
}

interface TeacherSchoolState {
  selectedSchool: TeacherSchool | null;
  setSelectedSchool: (school: TeacherSchool | null) => void;
}

export const useTeacherSchoolStore = create<TeacherSchoolState>()(
  persist(
    (set) => ({
      selectedSchool: null,
      setSelectedSchool: (school) => set({ selectedSchool: school }),
    }),
    { name: "teacher-school" }
  )
);
