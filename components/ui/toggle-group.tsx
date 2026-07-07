'use client'

import type { ComponentProps } from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center rounded-xl border border-stone-300 bg-background px-4 py-2 text-sm font-medium text-stone-500 transition-all hover:border-stone-400 hover:bg-accent hover:text-stone-700 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-teal-600 data-[state=on]:bg-teal-50 data-[state=on]:text-teal-800 data-[state=on]:shadow-[0_2px_10px_rgba(13,148,136,.12)]',
  {
    variants: {
      size: {
        default: 'h-10',
        sm: 'h-9 px-3',
        lg: 'h-12 px-5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn('flex flex-wrap gap-2', className)}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  size,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleGroupItemVariants>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleGroupItemVariants({ size, className }))}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
