import { CalendarDays } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title);
      setDate(initialData.date);
      setTime(initialData.time);
      setLocation(initialData.location);
      setDescription(initialData.description ?? '');
    } else if (mode === 'create' && initialData) {
      // prefill date/time if provided
      setDate(initialData.date);
      setTime(initialData.time);
    } else {
      // reset
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setDescription('');
    }
  }, [mode, initialData]);

  const handleSubmit = async () => {
    const payload = {
      event_name: title,
      event_date: date,
      event_time: time,
      location,
      description,
    };

    try {
      if (mode === 'create') {
        await fetch('/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (mode === 'edit' && initialData?.id) {
        await fetch(`/admin/events/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error('Error saving event', e);
      alert('Failed to save event');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Event' : 'Edit Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Event Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
          <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <textarea
            placeholder="Description (optional)"
            className="w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>{mode === 'create' ? 'Create' : 'Update'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
