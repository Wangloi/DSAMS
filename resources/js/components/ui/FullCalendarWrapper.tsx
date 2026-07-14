import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { router } from '@inertiajs/react';
import React, { useCallback } from 'react';



type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO string
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
};

type FullCalendarWrapperProps = {
  events: CalendarEvent[];
  onDateSelect?: (dateInfo: DateSelectArg) => void;
  onEventClick?: (clickInfo: EventClickArg) => void;
  onEventDrop?: (dropInfo: EventDropArg) => void;
  selectable?: boolean;
  editable?: boolean;
};

export default function FullCalendarWrapper({ 
  events, 
  onDateSelect, 
  onEventClick, 
  onEventDrop,
  selectable = true,
  editable = true
}: FullCalendarWrapperProps) {
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      if (onDateSelect) {
        onDateSelect(selectInfo);
      }
    },
    [onDateSelect]
  );

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      if (onEventClick) {
        onEventClick(clickInfo);
      }
    },
    [onEventClick]
  );

  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      if (onEventDrop) {
        onEventDrop(dropInfo);
      }
    },
    [onEventDrop]
  );

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
      events={events}
      selectable={selectable}
      editable={editable}
      select={handleDateSelect}
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
      dayMaxEvents={true}
      height="100%"
    />
  );
}
