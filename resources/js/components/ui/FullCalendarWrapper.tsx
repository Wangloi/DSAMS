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
  onMoreLinkClick?: (arg: any) => void;
  onEventMouseEnter?: (info: any) => void;
  onEventMouseLeave?: (info: any) => void;
  selectable?: boolean;
  editable?: boolean;
};

export default function FullCalendarWrapper({ 
  events, 
  onDateSelect, 
  onEventClick, 
  onEventDrop,
  onMoreLinkClick,
  onEventMouseEnter,
  onEventMouseLeave,
  selectable = true,
  editable = true
}: FullCalendarWrapperProps) {
  const lastSelectTimeRef = React.useRef(0);

  const triggerDateSelect = useCallback(
    (selectInfo: any) => {
      const now = Date.now();
      if (now - lastSelectTimeRef.current < 250) return;
      lastSelectTimeRef.current = now;
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

  const handleMoreLinkClick = useCallback(
    (arg: any) => {
      if (onMoreLinkClick) {
        onMoreLinkClick(arg);
        return false;
      }
      return 'popover';
    },
    [onMoreLinkClick]
  );

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
      events={events}
      selectable={selectable}
      editable={editable}
      select={triggerDateSelect}
      dateClick={(info: any) => {
        triggerDateSelect({
          startStr: info.dateStr,
          endStr: info.dateStr,
          allDay: info.allDay,
        });
      }}
      eventClick={handleEventClick}
      eventMouseEnter={onEventMouseEnter}
      eventMouseLeave={onEventMouseLeave}
      eventDrop={handleEventDrop}
      moreLinkClick={handleMoreLinkClick}
      dayMaxEvents={true}
      height="100%"
    />
  );
}
