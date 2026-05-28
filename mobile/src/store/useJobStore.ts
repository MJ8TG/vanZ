import { create } from 'zustand';

export interface Location {
  name: string;
  lat: number;
  lon: number;
}

export interface JobDraft {
  serviceType: string;
  pickup: Location | null;
  dropoff: Location | null;
  vehicleSize: string;
  date: string;
  description: string;
  budget: string;
}

interface JobStore {
  draft: JobDraft;
  updateDraft: (data: Partial<JobDraft>) => void;
  resetDraft: () => void;
}

const initialDraft: JobDraft = {
  serviceType: 'Déménagement',
  pickup: null,
  dropoff: null,
  vehicleSize: 'Moyen',
  date: '',
  description: '',
  budget: '',
};

export const useJobStore = create<JobStore>((set) => ({
  draft: initialDraft,
  updateDraft: (data) => set((state) => ({ draft: { ...state.draft, ...data } })),
  resetDraft: () => set({ draft: initialDraft }),
}));
