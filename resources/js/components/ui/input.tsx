import * as React from "react"
import { cn } from "@/lib/utils"
import {
    focusNextFormField,
    focusPreviousFormField,
    openDatePicker,
} from "@/lib/formFocusNavigation"

export interface InputProps extends React.ComponentProps<"input"> {
    /**
     * Whether pressing Enter advances focus to the next form field.
     * Defaults to true (unless type="search" or type="submit").
     */
    autoFocusNext?: boolean;
    /**
     * Automatically advance focus to the next field when maxLength is reached.
     * Defaults to false so standard typing is never interrupted.
     */
    autoAdvanceOnComplete?: boolean;
    /**
     * Whether to automatically open the native date/time picker when focused.
     * Defaults to true for date/datetime/time inputs.
     */
    /**
     * Explicit error flag to trigger visual error borders and aria-invalid.
     */
    hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type,
            autoFocusNext = true,
            autoAdvanceOnComplete = false,
            autoOpenPicker = true,
            hasError,
            onFocus,
            onClick,
            onKeyDown,
            onInput,
            ...props
        },
        ref
    ) => {
        const isDateOrTime =
            type === "date" ||
            type === "datetime-local" ||
            type === "time" ||
            type === "month" ||
            type === "week";

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            if (isDateOrTime && autoOpenPicker) {
                openDatePicker(e.currentTarget);
            }
            onFocus?.(e);
        };

        const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
            if (isDateOrTime && autoOpenPicker) {
                openDatePicker(e.currentTarget);
            }
            onClick?.(e);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (isDateOrTime && (e.key === "ArrowDown" || e.key === " " || e.key === "F4")) {
                if (openDatePicker(e.currentTarget)) {
                    e.preventDefault();
                }
            }

            if (e.key === "Enter" && autoFocusNext && type !== "search" && type !== "submit") {
                if (e.currentTarget.getAttribute("data-no-auto-advance") === "true") {
                    onKeyDown?.(e);
                    return;
                }

                if (e.shiftKey) {
                    if (focusPreviousFormField(e.currentTarget)) {
                        e.preventDefault();
                    }
                } else {
                    // Check validity before advancing if field has required or pattern constraints
                    if (
                        typeof e.currentTarget.checkValidity === "function" &&
                        !e.currentTarget.checkValidity()
                    ) {
                        e.currentTarget.reportValidity?.();
                        e.preventDefault();
                        onKeyDown?.(e);
                        return;
                    }

                    if (focusNextFormField(e.currentTarget)) {
                        e.preventDefault();
                    }
                }
            }

            onKeyDown?.(e);
        };

        const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
            onInput?.(e);

            // Only advance automatically if explicitly configured for fixed-length structured inputs
            if (
                autoAdvanceOnComplete &&
                props.maxLength &&
                e.currentTarget.value.length >= props.maxLength
            ) {
                focusNextFormField(e.currentTarget);
            }
        };

        const isInvalid =
            props["aria-invalid"] === true ||
            props["aria-invalid"] === "true" ||
            hasError;

        return (
            <input
                ref={ref}
                type={type}
                data-slot="input"
                aria-invalid={isInvalid ? "true" : props["aria-invalid"]}
                onFocus={handleFocus}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                className={cn(
                    "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    // High-contrast, clear, visible focus indicator to guide users through forms
                    "focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:outline-none dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500/40",
                    isInvalid
                        ? "!border-red-500 !ring-2 !ring-red-500/25 focus-visible:!border-red-500 focus-visible:!ring-red-500/35 dark:!border-red-500 dark:!ring-red-500/30"
                        : "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";

export { Input };
