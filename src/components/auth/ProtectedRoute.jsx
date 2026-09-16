import React from "react";
import { useApp } from "../../lib/store";
import { PortalLogin } from "./PortalLogin";

export const ProtectedRoute = ({ role, children }) => {
  const { currentSession, authReady } = useApp();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Checking session…
      </div>
    );
  }

  if (!currentSession) {
    return <PortalLogin expectedRole={role} />;
  }

  if (currentSession.role !== role) {
    return <PortalLogin expectedRole={role} blockedSession={currentSession} />;
  }

  return children;
};
