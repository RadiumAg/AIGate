"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar rounded-2xl border border-white/25 bg-white/15 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_1px_1px_0_rgba(255,255,255,0.55),inset_0_0_12px_rgba(255,255,255,0.12)] backdrop-blur-2xl backdrop-saturate-[1.8] dark:border-white/10 dark:bg-black/20 [--cell-radius:1rem] [--cell-size:--spacing(9)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) rounded-2xl border border-white/30 bg-white/35 p-0 text-foreground/80 shadow-[0_6px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl backdrop-saturate-[1.6] transition-all duration-200 hover:scale-[1.03] hover:bg-white/55 hover:text-foreground hover:shadow-[0_10px_28px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.55)] aria-disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) rounded-2xl border border-white/30 bg-white/35 p-0 text-foreground/80 shadow-[0_6px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl backdrop-saturate-[1.6] transition-all duration-200 hover:scale-[1.03] hover:bg-white/55 hover:text-foreground hover:shadow-[0_10px_28px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.55)] aria-disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "cn-calendar-dropdown-root relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none rounded-full border border-white/25 bg-white/25 px-4 py-1.5 text-sm font-medium text-foreground/90 shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl backdrop-saturate-[1.6] dark:border-white/10 dark:bg-white/[0.08]",
          captionLayout === "label"
            ? "text-sm"
            : "cn-calendar-caption-label flex items-center gap-1 [&>svg]:size-3.5 [&>svg]:text-muted-foreground/80",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground/70 select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-white/[0.14] after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-white/[0.14] dark:bg-white/[0.08] dark:after:bg-white/[0.08]",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "rounded-none bg-white/[0.10] dark:bg-white/[0.06]",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-white/[0.14] after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-white/[0.14] dark:bg-white/[0.08] dark:after:bg-white/[0.08]",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-(--cell-radius) bg-white/[0.18] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] data-[selected=true]:rounded-none dark:bg-white/[0.10]",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/45 aria-selected:text-muted-foreground/60",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground/35 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("cn-rtl-flip size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("cn-rtl-flip size-4", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-(--cell-radius) border border-transparent leading-none font-normal text-foreground/90 shadow-none group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-white/30 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-white/20 hover:border-white/20 hover:bg-white/[0.10] hover:backdrop-blur-md hover:shadow-[0_6px_18px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.28)] data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:border-white/20 data-[range-end=true]:bg-white/[0.26] data-[range-end=true]:text-foreground data-[range-end=true]:shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.45)] data-[range-middle=true]:rounded-none data-[range-middle=true]:border-transparent data-[range-middle=true]:bg-white/[0.12] data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:border-white/20 data-[range-start=true]:bg-white/[0.26] data-[range-start=true]:text-foreground data-[range-start=true]:shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.45)] data-[selected-single=true]:border-white/25 data-[selected-single=true]:bg-white/[0.28] data-[selected-single=true]:text-foreground data-[selected-single=true]:shadow-[0_10px_28px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.5)] dark:hover:bg-white/[0.08] dark:data-[range-middle=true]:bg-white/[0.08] dark:data-[range-start=true]:bg-white/[0.18] dark:data-[range-end=true]:bg-white/[0.18] dark:data-[selected-single=true]:bg-white/[0.20] [&>span]:text-xs [&>span]:opacity-65",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
