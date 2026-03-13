import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  class: string;
  isLoggedIn: boolean;
}

interface AppState {
  user: User | null;
  currentLesson: string | null;
  score: number;
  login: (username: string, className: string) => void;
  logout: () => void;
  setLesson: (lesson: string) => void;
  setScore: (score: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentLesson: null,
      score: 0,
      login: (username, className) => set({ user: { username, class: className, isLoggedIn: true } }),
      logout: () => set({ user: null, currentLesson: null, score: 0 }),
      setLesson: (lesson) => set({ currentLesson: lesson }),
      setScore: (newScore) => set((state) => ({ score: state.score + newScore })),
    }),
    {
      name: 'grammar-pal-storage',
    }
  )
);
