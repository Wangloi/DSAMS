import * as LabelPrimitive from "@radix-ui/react-label"
import * as React from "react"

import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean;
  optional?: boolean;
  showRequiredBadge?: boolean;
}

function Label({
  className,
  required,
  optional,
  showRequiredBadge,
  children,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 inline-flex items-center gap-1 flex-wrap",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {required && (
        <>
          <span className="text-red-500 font-bold ml-0.5" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
          {showRequiredBadge && (
            <span className="ml-1 inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 border border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50">
              Required
            </span>
          )}
        </>
      )}
      {optional && (
        <span className="ml-1 text-[11px] font-normal text-slate-400 dark:text-slate-500">
          (Optional)
        </span>
      )}
    </LabelPrimitive.Root>
  )
}

export { Label }

