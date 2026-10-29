import * as React from "react"
import { cn } from "@/lib/utils"
import { focusNextFormField } from "@/lib/formFocusNavigation"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoFocusNextOnCtrlEnter?: boolean;
  hasError?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoFocusNextOnCtrlEnter = true, hasError, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (autoFocusNextOnCtrlEnter && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (focusNextFormField(e.currentTarget)) {
          e.preventDefault();
        }
      }
      onKeyDown?.(e);
    };

    const isInvalid =
      props["aria-invalid"] === true ||
      props["aria-invalid"] === "true" ||
      hasError;

    return (
      <textarea
        className={cn(
          "border-input placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:outline-none dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500/40",
          isInvalid &&
            "!border-red-500 !ring-2 !ring-red-500/25 focus-visible:!border-red-500 focus-visible:!ring-red-500/35 dark:!border-red-500 dark:!ring-red-500/30",
          className
        )}
        ref={ref}
        aria-invalid={isInvalid ? "true" : props["aria-invalid"]}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
