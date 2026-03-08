'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  dateRange: 'today' | 'yesterday' | '7days' | '30days' | 'custom';
  setDateRange: (range: 'today' | 'yesterday' | '7days' | '30days' | 'custom') => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  setDateRange,
  className,
}) => {
  const [open, setOpen] = useState(false);

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
              'w-45 justify-start text-left font-normal',
              !getDateRangeLabel() && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDateRangeLabel()}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-45 p-2" align="start">
          <div className="space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={dateRange === preset.value ? 'default' : 'ghost'}
                className="w-full justify-start"
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
