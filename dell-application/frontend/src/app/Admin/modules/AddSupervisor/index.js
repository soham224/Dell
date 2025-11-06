import React from "react";
import { SupervisorUIProvider } from "./SupervisorUIContext";
import AddSupervisor from "./AddSupervisor";

export function SupervisorPage() {
  return (
    <SupervisorUIProvider>
      <AddSupervisor />
    </SupervisorUIProvider>
  );
}
