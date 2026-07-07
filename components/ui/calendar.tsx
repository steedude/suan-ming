'use client'

import type { ComponentProps } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('p-0', className)}
      classNames={{
        root: 'w-full',
        months: 'flex flex-col gap-4',
        month: 'space-y-4',
        month_caption: 'relative flex h-9 items-center justify-center',
        caption_label: 'hidden',
        dropdowns: 'flex items-center justify-center gap-2 px-10',
        dropdown:
          'border-input bg-background h-8 rounded-md border px-2 text-sm outline-none focus:border-ring focus:ring-ring/20 focus:ring-[3px]',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'absolute left-1 top-0 size-8 bg-transparent p-0 opacity-70 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'absolute right-1 top-0 size-8 bg-transparent p-0 opacity-70 hover:opacity-100',
        ),
        month_grid: 'w-full table-fixed border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: 'relative size-9 p-0 text-center text-sm',
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 rounded-md p-0 font-normal aria-selected:opacity-100',
        ),
        selected:
          'rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'rounded-md bg-accent text-accent-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
