"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { buildDefaultState, getModulesState, isModuleEnabled } from "@/services/platform-config";
import type { ModulesState, SobayanModule } from "@/types/platform-config";

interface ModulesContextValue {
  modulesState: ModulesState;
  isEnabled: (moduleId: SobayanModule) => boolean;
  loading: boolean;
}

const ModulesContext = createContext<ModulesContextValue>({
  modulesState: buildDefaultState(),
  isEnabled: () => true,
  loading: true
});

export function ModulesProvider({ children }: { children: React.ReactNode }) {
  const [modulesState, setModulesState] = useState<ModulesState>(buildDefaultState());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModulesState()
      .then(setModulesState)
      .finally(() => setLoading(false));
  }, []);

  function isEnabled(moduleId: SobayanModule) {
    return isModuleEnabled(modulesState, moduleId);
  }

  return (
    <ModulesContext.Provider value={{ modulesState, isEnabled, loading }}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules() {
  return useContext(ModulesContext);
}
