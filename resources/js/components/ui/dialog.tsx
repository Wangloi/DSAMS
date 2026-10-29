import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const dialogSizeClasses: Record<DialogSize, string> = {
  sm: "sm:max-w-md",       // ~448px (confirmations, alerts, compact prompts)
  md: "sm:max-w-lg",       // ~512px (default standard dialogs)
  lg: "sm:max-w-2xl",      // ~672px (form dialogs, standard wizards)
  xl: "sm:max-w-4xl",      // ~896px (wide multi-column forms)
  "2xl": "sm:max-w-6xl",   // ~1152px (heavy dashboards/detail views)
  full: "sm:max-w-[96vw] max-h-[94vh]",
};

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-150",
        className
      )}
      {...props}
    />
  )
}

interface DialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  overlayClassName?: string;
  size?: DialogSize;
  showCloseButton?: boolean;
  preventClose?: boolean;
}

function DialogContent({
  className,
  children,
  overlayClassName,
  size = "md",
  showCloseButton = true,
  preventClose = false,
  onPointerDownOutside,
  onInteractOutside,
  onEscapeKeyDown,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        onPointerDownOutside={(e) => {
          if (preventClose) {
            e.preventDefault();
          } else {
            onPointerDownOutside?.(e);
          }
        }}
        onInteractOutside={(e) => {
          if (preventClose) {
            e.preventDefault();
          } else {
            onInteractOutside?.(e);
          }
        }}
        onEscapeKeyDown={(e) => {
          if (preventClose) {
            e.preventDefault();
          } else {
            onEscapeKeyDown?.(e);
          }
        }}
        className={cn(
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xl duration-150 focus:outline-none",
          dialogSizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            aria-label="Close dialog"
            className="ring-offset-background absolute top-4 right-4 z-50 rounded-lg p-1.5 text-red-500 transition-all duration-150 cursor-pointer hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 focus:ring-2 focus:ring-red-400/40 focus:outline-hidden disabled:cursor-not-allowed disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

export { ConfirmationDialog, type ConfirmationDialogProps, type ConfirmationVariant } from "./confirmation-dialog"

