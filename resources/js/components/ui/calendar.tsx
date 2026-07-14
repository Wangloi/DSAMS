import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = {
  /** The currently selected date. */
  selected?: Date;
  /** Callback when a date is selected. */
  onSelect?: (date: Date | undefined) => void;
  /** Additional CSS class names applied to the wrapper. */
  className?: string;
};

/**
 * Calendar – a thin single-date-selection wrapper around react-day-picker.
 * Exported as a named export to match `import { Calendar } from '@/components/ui/calendar'`.
 */
function Calendar({ selected, onSelect, className }: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      className={cn("rounded-md border bg-white p-3", className)}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
