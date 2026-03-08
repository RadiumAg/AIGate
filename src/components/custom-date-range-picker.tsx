'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(startDate || new Date());
  const [tempEndDate, setTempEndDate] = useState<Date>(endDate || new Date());

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate || new Date());
    setTempEndDate(endDate || new Date());
    setOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !(startDate && endDate) && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate && endDate
              ? `${formatDate(startDate)} 至 ${formatDate(endDate)}`
              : '选择日期范围'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-4" align="start">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">开始日期</label>
              <input
                type="date"
                value={formatDate(tempStartDate)}
                onChange={(e) => setTempStartDate(new Date(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">结束日期</label>
              <input
                type="date"
                value={formatDate(tempEndDate)}
                onChange={(e) => setTempEndDate(new Date(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                取消
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={tempStartDate > tempEndDate}>
                确定
              </Button>
            </div>

            {tempStartDate > tempEndDate && (
              <div className="text-sm text-destructive">结束日期不能早于开始日期</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomDateRangePicker;
