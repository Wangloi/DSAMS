import { CalendarDays } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { FormRequiredNotice } from '@/components/ui/form-required-notice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';

type EventData = {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  description?: string;
  courses?: string[];
  year_levels?: string[];
};

type EventModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData?: EventData;
  onSaved: () => void;
};

export default function EventModal({ open, onOpenChange, mode, initialData, onSaved }: EventModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormErrors({});
    setTouched({});
    setIsSubmitting(false);

    if (mode === 'edit' && initialData) {
      setTitle(initialData.title);
      setDate(initialData.date);
      setTime(initialData.time);
      setLocation(initialData.location);
      setDescription(initialData.description ?? '');
    } else if (mode === 'create' && initialData) {
      setDate(initialData.date);
      setTime(initialData.time);
    } else {
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setDescription('');
    }
  }, [mode, initialData, open]);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const clearFieldError = (key: string) => {
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleBlur = (field: string, value: string) => {
    markTouched(field);
    if (!value.trim()) {
      let msg = 'This field is required.';
      if (field === 'title') msg = 'Please enter an event title.';
      if (field === 'date') msg = 'Please select an event date.';
      if (field === 'time') msg = 'Please select an event time.';
      if (field === 'location') msg = 'Please enter an event location.';
      setFormErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Please enter an event title.';
    if (!date.trim()) errs.date = 'Please select an event date.';
    if (!time.trim()) errs.time = 'Please select an event time.';
    if (!location.trim()) errs.location = 'Please enter an event location.';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setTimeout(() => {
        focusFirstInvalidField(containerRef.current);
      }, 50);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const payload = {
      event_name: title.trim(),
      event_date: date.trim(),
      event_time: time.trim(),
      location: location.trim(),
      description: description.trim(),
    };

    try {
      if (mode === 'create') {
        const res = await fetch('/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.errors) {
            setFormErrors(data.errors);
            setTimeout(() => focusFirstInvalidField(containerRef.current), 50);
            return;
          }
          throw new Error('Failed to create event');
        }
      } else if (mode === 'edit' && initialData?.id) {
        const res = await fetch(`/admin/events/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.errors) {
            setFormErrors(data.errors);
            setTimeout(() => focusFirstInvalidField(containerRef.current), 50);
            return;
          }
          throw new Error('Failed to update event');
        }
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error('Error saving event', e);
      alert('Failed to save event. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {mode === 'create' ? 'Create New Event' : 'Edit Event'}
          </DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className="space-y-4 py-2">
          <FormRequiredNotice message="Fields marked with * or Required must be completed." />

          <div className="space-y-1.5">
            <Label htmlFor="event_title" required showRequiredBadge>
              Event Title
            </Label>
            <Input
              id="event_title"
              placeholder="e.g. Annual College Sports Fest"
              value={title}
              hasError={!!formErrors.title}
              aria-describedby={formErrors.title ? "event_title-error" : undefined}
              onBlur={(e) => handleBlur('title', e.target.value)}
              onChange={(e) => {
                clearFieldError('title');
                setTitle(e.target.value);
              }}
            />
            <InputError id="event_title-error" message={formErrors.title} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="event_date" required showRequiredBadge>
                Event Date
              </Label>
              <Input
                id="event_date"
                type="date"
                value={date}
                hasError={!!formErrors.date}
                aria-describedby={formErrors.date ? "event_date-error" : undefined}
                onBlur={(e) => handleBlur('date', e.target.value)}
                onChange={(e) => {
                  clearFieldError('date');
                  setDate(e.target.value);
                }}
              />
              <InputError id="event_date-error" message={formErrors.date} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event_time" required showRequiredBadge>
                Event Time
              </Label>
              <Input
                id="event_time"
                type="time"
                value={time}
                hasError={!!formErrors.time}
                aria-describedby={formErrors.time ? "event_time-error" : undefined}
                onBlur={(e) => handleBlur('time', e.target.value)}
                onChange={(e) => {
                  clearFieldError('time');
                  setTime(e.target.value);
                }}
              />
              <InputError id="event_time-error" message={formErrors.time} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event_location" required showRequiredBadge>
              Location / Venue
            </Label>
            <Input
              id="event_location"
              placeholder="e.g. College Gymnasium"
              value={location}
              hasError={!!formErrors.location}
              aria-describedby={formErrors.location ? "event_location-error" : undefined}
              onBlur={(e) => handleBlur('location', e.target.value)}
              onChange={(e) => {
                clearFieldError('location');
                setLocation(e.target.value);
              }}
            />
            <InputError id="event_location-error" message={formErrors.location} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event_description" optional>
              Description
            </Label>
            <Textarea
              id="event_description"
              placeholder="Enter optional event description or notes..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            className="cursor-pointer"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : mode === 'create'
              ? 'Create Event'
              : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
