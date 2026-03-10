'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerWithRangeProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

const DatePickerWithRange: React.FC<DatePickerWithRangeProps> = ({
  startDate,
  endDate,
  className,
  onDateRangeChange,
}) => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      onDateRangeChange(range.from, range.to);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-75 justify-start text-left font-normal rounded-xl',
              'bg-white/40 dark:bg-white/5 backdrop-blur-lg backdrop-saturate-[1.5]',
              'border border-white/25 dark:border-white/10',
              'shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.3)]',
              'hover:bg-white/50 dark:hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
              'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'yyyy-MM-dd', { locale: zhCN })} 至
                  {format(date.to, 'yyyy-MM-dd', { locale: zhCN })}
                </>
              ) : (
                format(date.from, 'yyyy-MM-dd', { locale: zhCN })
              )
            ) : (
              <span>选择日期范围</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-black/40 border border-white/30 dark:border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.15),inset_1px_1px_0_rgba(255,255,255,0.5)]"
          align="start"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={zhCN}
            showOutsideDays={false}
            className="rounded-2xl"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerWithRange;
