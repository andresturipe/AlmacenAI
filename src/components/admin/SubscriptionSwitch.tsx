"use client";

import { useState, useTransition } from "react";
import { toggleOrganizationSubscription } from "../actions";
import { toast } from "sonner";

interface SubscriptionSwitchProps {
  organizationId: string;
  initialStatus: string;
}

export function SubscriptionSwitch({
  organizationId,
  initialStatus,
}: SubscriptionSwitchProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);

  const handleToggle = () => {
    const nextStatus = status === "active" ? "inactive" : "active";
    
    startTransition(async () => {
      const result = await toggleOrganizationSubscription(organizationId, status);
      if (result.success) {
        setStatus(nextStatus);
        toast.success(`Organización ${nextStatus === "active" ? "activada" : "desactivada"}`);
      } else {
        toast.error("Error al actualizar la suscripción");
      }
    });
  };

  const isActive = status === "active";

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 ${
        isActive ? "bg-yellow-500" : "bg-zinc-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isActive ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
