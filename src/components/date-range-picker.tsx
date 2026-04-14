'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  dateRange: 'today' | 'yesterday' | '7days' | '30days' | 'custom';
  className?: string;
  setDateRange: (range: 'today' | 'yesterday' | '7days' | '30days' | 'custom') => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  setDateRange,
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  const presets = [
    { label: '今日', value: 'today' },
    { label: '昨日', value: 'yesterday' },
    { label: '近7天', value: '7days' },
    { label: '近30天', value: '30days' },
    { label: '自定义', value: 'custom' },
  ];

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today':
        return '今日';
      case 'yesterday':
        return '昨日';
      case '7days':
        return '近7天';
      case '30days':
        return '近30天';
      case 'custom':
        return '自定义日期';
      default:
        return '今日';
    }
  };

  const handlePresetSelect = (preset: string) => {
    setDateRange(preset as 'today' | 'yesterday' | '7days' | '30days' | 'custom');
    setOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-45 justify-start text-left font-normal rounded-xl',
              'bg-white/40 dark:bg-white/5 backdrop-blur-lg backdrop-saturate-[1.5]',
              'border border-white/25 dark:border-white/10',
              'shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.3)]',
              'hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
              'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              !getDateRangeLabel() && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDateRangeLabel()}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-45 p-2 rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-black/40 border border-white/30 dark:border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.15),inset_1px_1px_0_rgba(255,255,255,0.5)]"
          align="start"
        >
          <div className="space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={dateRange === preset.value ? 'glass' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-xl transition-all duration-200',
                  dateRange !== preset.value &&
                    'hover:bg-white/30 dark:hover:bg-white/10 hover:backdrop-blur-sm'
                )}
                onClick={() => handlePresetSelect(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
