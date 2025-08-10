import { create } from "zustand";

interface AppState {
  viewMode: "simple" | "expert";
  setViewMode: (mode: "simple" | "expert") => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  viewMode: (typeof window !== "undefined" ? localStorage.getItem("genelens-view-mode") : null) === "expert" ? "expert" : "simple",
  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (typeof window !== "undefined") {
      localStorage.setItem("genelens-view-mode", mode);
    }
  },
}));
