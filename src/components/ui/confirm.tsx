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
import { useMemoizedFn, useMount } from 'ahooks';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm?: () => Promise<void> | void;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
  isLoading: boolean;
}

let confirmInstance: {
  show: (options: ConfirmOptions) => Promise<boolean>;
} | null = null;

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmState>({
    isOpen: false,
    options: {},
    resolve: null,
    isLoading: false,
  });

  const show = useMemoizedFn((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        isLoading: false,
        resolve,
      });
    });
  });

  useMount(() => {
    confirmInstance = { show };
    return () => {
      confirmInstance = null;
    };
  });

  const handleConfirm = async () => {
    const { onConfirm } = state.options;
    
    if (onConfirm) {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        await onConfirm();
        state.resolve?.(true);
        setState((prev) => ({ ...prev, isOpen: false, resolve: null, isLoading: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    } else {
      state.resolve?.(true);
      setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }
  };

  const handleCancel = () => {
    if (state.isLoading) return;
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
              disabled={state.isLoading}
              className={`rounded-xl backdrop-blur-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                variant === 'destructive'
                  ? 'bg-red-500/80 hover:bg-red-500 text-white border border-red-500/30'
                  : 'bg-primary/80 hover:bg-primary text-primary-foreground border border-primary/30'
              }`}
            >
              {state.isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  处理中...
                </span>
              ) : (
                confirmText
              )}
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
