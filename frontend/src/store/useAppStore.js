import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      role: null, // 'asha' | 'doctor' | 'district'
      ashaId: null,
      district: null,
      stateName: null,   // Indian state name — renamed to avoid shadowing Zustand's `state` param
      phcName: null,
      language: 'en',
      isOnline: navigator.onLine,
      offlineQueueCount: 0,

      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      setAsha: (ashaData) => set({ ...ashaData, role: 'asha' }),
      setDoctor: (docData) => set({ ...docData, role: 'doctor' }),
      setDistrictRole: (distData) => set({ ...distData, role: 'district' }),
      setOnline: (isOnline) => set({ isOnline }),
      incrementQueue: () => set((s) => ({ offlineQueueCount: s.offlineQueueCount + 1 })),
      clearSession: () => set({ role: null, ashaId: null, district: null, stateName: null, phcName: null }),
    }),
    {
      name: 'matruvani-storage',
      partialize: (s) => ({
        language: s.language,
        role: s.role,
        ashaId: s.ashaId,
        district: s.district,
        stateName: s.stateName,
        phcName: s.phcName,
      }),
    }
  )
)
