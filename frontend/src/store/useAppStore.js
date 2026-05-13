import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      role: null, // 'asha' | 'doctor' | 'district'
      ashaId: null,
      district: null,
      state: null,
      language: 'en',
      isOnline: navigator.onLine,
      offlineQueueCount: 0,

      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      setAsha: (ashaData) => set({ ...ashaData, role: 'asha' }),
      setDoctor: (docData) => set({ ...docData, role: 'doctor' }),
      setDistrictRole: (distData) => set({ ...distData, role: 'district' }),
      setOnline: (isOnline) => set({ isOnline }),
      incrementQueue: () => set((state) => ({ offlineQueueCount: state.offlineQueueCount + 1 })),
      clearSession: () => set({ role: null, ashaId: null, district: null, state: null }),
    }),
    {
      name: 'matruvani-storage',
      partialize: (state) => ({ language: state.language, role: state.role, ashaId: state.ashaId, district: state.district, state: state.state }),
    }
  )
)
