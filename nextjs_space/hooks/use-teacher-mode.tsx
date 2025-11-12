
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { TEACHER_TIPS, type TeacherTipTrigger, type TeacherTip } from '@/lib/constants/teacher-tips';

interface TeacherModeContextValue {
  currentTip: TeacherTip | null;
  showTip: (trigger: TeacherTipTrigger) => void;
  dismissTip: () => void;
  disableTip: (trigger: TeacherTipTrigger) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const TeacherModeContext = createContext<TeacherModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'spytradr_teacher_mode';
const DISABLED_TIPS_KEY = 'spytradr_disabled_tips';

interface TeacherModeProviderProps {
  children: ReactNode;
}

export function TeacherModeProvider({ children }: TeacherModeProviderProps) {
  const [currentTip, setCurrentTip] = useState<TeacherTip | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [disabledTips, setDisabledTips] = useState<Set<TeacherTipTrigger>>(new Set());
  const [tipQueue, setTipQueue] = useState<TeacherTipTrigger[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedEnabled = localStorage.getItem(STORAGE_KEY);
      if (savedEnabled !== null) {
        setIsEnabled(savedEnabled === 'true');
      }

      const savedDisabledTips = localStorage.getItem(DISABLED_TIPS_KEY);
      if (savedDisabledTips) {
        setDisabledTips(new Set(JSON.parse(savedDisabledTips)));
      }
    } catch (error) {
      console.error('Failed to load teacher mode settings:', error);
    }
  }, []);

  // Save enabled state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isEnabled));
    } catch (error) {
      console.error('Failed to save teacher mode setting:', error);
    }
  }, [isEnabled]);

  // Save disabled tips to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DISABLED_TIPS_KEY, JSON.stringify([...disabledTips]));
    } catch (error) {
      console.error('Failed to save disabled tips:', error);
    }
  }, [disabledTips]);

  // Process tip queue
  useEffect(() => {
    if (tipQueue.length > 0 && !currentTip) {
      const nextTipId = tipQueue[0];
      const nextTip = TEACHER_TIPS[nextTipId];
      
      if (nextTip && !disabledTips.has(nextTipId)) {
        setCurrentTip(nextTip);
        setTipQueue(prev => prev.slice(1));
      } else {
        setTipQueue(prev => prev.slice(1));
      }
    }
  }, [tipQueue, currentTip, disabledTips]);

  const showTip = useCallback((trigger: TeacherTipTrigger) => {
    if (!isEnabled) return;
    
    const tip = TEACHER_TIPS[trigger];
    if (!tip) return;

    // Check if this tip should be shown
    if (disabledTips.has(trigger)) {
      return;
    }

    // If a tip is currently showing, queue this one
    if (currentTip) {
      setTipQueue(prev => {
        // Avoid duplicate tips in queue
        if (prev.includes(trigger)) return prev;
        return [...prev, trigger];
      });
    } else {
      setCurrentTip(tip);
    }
  }, [isEnabled, currentTip, disabledTips]);

  const dismissTip = useCallback(() => {
    setCurrentTip(null);
  }, []);

  const disableTip = useCallback((trigger: TeacherTipTrigger) => {
    setDisabledTips(prev => {
      const newSet = new Set(prev);
      newSet.add(trigger);
      return newSet;
    });
    setCurrentTip(null);
  }, []);

  const setEnabledWrapper = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      setCurrentTip(null);
      setTipQueue([]);
    }
  }, []);

  const value: TeacherModeContextValue = {
    currentTip,
    showTip,
    dismissTip,
    disableTip,
    isEnabled,
    setEnabled: setEnabledWrapper,
  };

  return (
    <TeacherModeContext.Provider value={value}>
      {children}
    </TeacherModeContext.Provider>
  );
}

export function useTeacherMode() {
  const context = useContext(TeacherModeContext);
  if (!context) {
    throw new Error('useTeacherMode must be used within TeacherModeProvider');
  }
  return context;
}

// Helper hook for triggering tips with auto-dismiss
export function useTeacherTip(trigger: TeacherTipTrigger, condition: boolean = false) {
  const { showTip } = useTeacherMode();

  useEffect(() => {
    if (condition) {
      // Add a small delay so the UI can render first
      const timer = setTimeout(() => {
        showTip(trigger);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [condition, trigger, showTip]);
}
