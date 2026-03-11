'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMemoizedFn } from 'ahooks';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

let confirmInstance: {
  show: (options: ConfirmOptions) => Promise<boolean>;
} | null = null;

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmState>({
    isOpen: false,
    options: {},
    resolve: null,
  });

  const show = useMemoizedFn((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
      });
    });
  });

  React.useEffect(() => {
    confirmInstance = { show };
    return () => {
      confirmInstance = null;
    };
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const {
    title = '确认操作',
    description = '您确定要执行此操作吗？',
    confirmText = '确认',
    cancelText = '取消',
    variant = 'default',
  } = state.options;

  return (
    <>
      {children}
      <AlertDialog open={state.isOpen} onOpenChange={handleCancel}>
        <AlertDialogContent className="rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/30 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.2),inset_1px_1px_0_rgba(255,255,255,0.6)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={handleCancel}
              className="rounded-xl backdrop-blur-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 border border-white/30 dark:border-white/10 transition-all duration-200"
            >
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={`rounded-xl backdrop-blur-lg transition-all duration-200 ${
                variant === 'destructive'
                  ? 'bg-red-500/80 hover:bg-red-500 text-white border border-red-500/30'
                  : 'bg-primary/80 hover:bg-primary text-primary-foreground border border-primary/30'
              }`}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function confirm(options: string | ConfirmOptions): Promise<boolean> {
  if (!confirmInstance) {
    console.error('ConfirmProvider not found. Please wrap your app with ConfirmProvider.');
    return Promise.resolve(false);
  }

  if (typeof options === 'string') {
    return confirmInstance.show({
      title: '确认操作',
      description: options,
    });
  }

  return confirmInstance.show(options);
}
