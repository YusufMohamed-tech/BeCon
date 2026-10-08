'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { togglePlanActive } from './actions';

export function TogglePlan({
  planId,
  isActive,
}: {
  planId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await togglePlanActive(planId, !isActive);
      router.refresh();
    });
  }

  return (
    <button className="btn btn-ghost" disabled={isPending} onClick={toggle}>
      {isActive ? 'تعطيل' : 'تفعيل'}
    </button>
  );
}
