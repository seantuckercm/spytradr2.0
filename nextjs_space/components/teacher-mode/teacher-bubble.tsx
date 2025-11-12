
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, X, BookOpen, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TeacherTip } from '@/lib/constants/teacher-tips';

interface TeacherBubbleProps {
  tip: TeacherTip | null;
  onDismiss: () => void;
  onDontShowAgain?: () => void;
}

export function TeacherBubble({ tip, onDismiss, onDontShowAgain }: TeacherBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand after a short delay when tip appears
  useEffect(() => {
    if (tip) {
      const timer = setTimeout(() => setIsExpanded(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(false);
    }
  }, [tip]);

  if (!tip) return null;

  const categoryColors = {
    'getting-started': 'bg-blue-500',
    'analysis': 'bg-purple-500',
    'automation': 'bg-green-500',
    'risk': 'bg-orange-500',
    'advanced': 'bg-pink-500',
  };

  const categoryIcons = {
    'getting-started': BookOpen,
    'analysis': Lightbulb,
    'automation': GraduationCap,
    'risk': GraduationCap,
    'advanced': GraduationCap,
  };

  const Icon = categoryIcons[tip.category];

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Button
                size="lg"
                className={cn(
                  'h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all',
                  categoryColors[tip.category]
                )}
                onClick={() => setIsExpanded(true)}
              >
                <GraduationCap className="h-8 w-8 animate-bounce" />
              </Button>
            </motion.div>
          )}

          {isExpanded && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-96"
            >
              <Card className="shadow-2xl border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-2 rounded-full', categoryColors[tip.category])}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {tip.category.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={onDismiss}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip.message}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onDismiss}
                      className="flex-1"
                    >
                      Got it!
                    </Button>
                    {tip.showOnce && onDontShowAgain && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onDontShowAgain}
                        className="flex-1"
                      >
                        Don't show again
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
