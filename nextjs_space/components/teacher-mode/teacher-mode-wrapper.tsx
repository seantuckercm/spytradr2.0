
'use client';

import { useTeacherMode } from '@/hooks/use-teacher-mode';
import { TeacherBubble } from './teacher-bubble';

export function TeacherModeWrapper() {
  const { currentTip, dismissTip, disableTip } = useTeacherMode();

  return (
    <TeacherBubble
      tip={currentTip}
      onDismiss={dismissTip}
      onDontShowAgain={() => {
        if (currentTip) {
          disableTip(currentTip.id);
        }
      }}
    />
  );
}
