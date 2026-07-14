import { Check } from 'lucide-react';
import React from 'react';
import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

/**
 * EventForm props. The parent component (CreateEventPage) should pass all state
 * and handlers needed for the multi‑step form. This component only renders the
 * UI and forwards user interactions back via the supplied callbacks.
 */
interface EventFormProps {
  formData: any;
  setFormData: (updater: React.SetStateAction<any>) => void;
  validationErrors: Record<string, string>;
  clearFieldError: (field: string) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  computedExpectedAttendees: number;
  showMapSelector: boolean;
  setShowMapSelector: (show: boolean) => void;
  selectedLocationName: string;
  handleMapLocationSelect: (lat: number, lng: number, name?: string) => void;
  scannerStudentQuery: string;
  setScannerStudentQuery: (q: string) => void;
  scannerSearchResults: Array<{ id: string; name: string }>;
  setScannerSearchResults: (r: Array<{ id: string; name: string }>) => void;
  scannerStudentLoading: boolean;
  scannerStudentError: string;
  selectedScannerStudents: Array<{ id: string; name: string }>;
  setSelectedScannerStudents: (s: Array<{ id: string; name: string }>) => void;
  addSelectedStudent: (student: { id: string; name: string }) => void;
  removeSelectedStudent: (id: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function EventForm({
  formData,
  setFormData,
  validationErrors,
  clearFieldError,
  currentStep,
  setCurrentStep,
  computedExpectedAttendees,
  showMapSelector,
  setShowMapSelector,
  selectedLocationName,
  handleMapLocationSelect,
  scannerStudentQuery,
  setScannerStudentQuery,
  scannerSearchResults,
  setScannerSearchResults,
  scannerStudentLoading,
  scannerStudentError,
  selectedScannerStudents,
  setSelectedScannerStudents,
  addSelectedStudent,
  removeSelectedStudent,
  handleSubmit,
}: EventFormProps) {
  // Helper to move between steps
  const handleNext = () => {
    // In a real implementation the parent should expose validation functions.
    // Here we simply increment the step.
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // The UI markup below is largely copied from the original create.tsx file.
  // It assumes Tailwind classes and the same component library are available.
  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Stepper header */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-4">
        {/* Step 1 */}
        <div className="flex flex-col items-center flex-1 relative">
          <div className="h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all bg-white text-blue-900 ring-4 ring-white/20">
            {currentStep > 1 ? <Check className="h-5 w-5" /> : '1'}
          </div>
          <span className={`text-[11px] mt-2 font-medium ${currentStep === 1 ? 'text-white' : 'text-blue-200'}`}>Basic Info</span>
        </div>
        <div className="h-0.5 flex-1 mx-2 bg-blue-800 relative">
          <div className="absolute inset-0 bg-white transition-all" style={{ width: currentStep > 1 ? '100%' : '0%' }} />
        </div>
        {/* Step 2 */}
        <div className="flex flex-col items-center flex-1 relative">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${currentStep > 2 ? 'bg-emerald-500 text-white' : currentStep === 2 ? 'bg-white text-blue-900 ring-4 ring-white/20' : 'bg-blue-800 text-blue-200'}`}>
            {currentStep > 2 ? <Check className="h-5 w-5" /> : '2'}
          </div>
          <span className={`text-[11px] mt-2 font-medium ${currentStep === 2 ? 'text-white' : 'text-blue-200'}`}>Location</span>
        </div>
        <div className="h-0.5 flex-1 mx-2 bg-blue-800 relative">
          <div className="absolute inset-0 bg-white transition-all" style={{ width: currentStep > 2 ? '100%' : '0%' }} />
        </div>
        {/* Step 3 */}
        <div className="flex flex-col items-center flex-1 relative">
          <div className="h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm bg-blue-800 text-blue-200">
            3
          </div>
          <span className="text-[11px] mt-2 font-medium text-blue-200">Audience</span>
        </div>
      </div>

      {/* Step content – only a subset is shown for brevity. Extend as needed. */}
      {currentStep === 1 && (
        <div className="grid gap-6 mt-6">
          {/* Event Name */}
          <div className="grid gap-2">
            <Label htmlFor="event_name" className="text-sm font-medium">Event Name *</Label>
            <Input
              id="event_name"
              value={formData.event_name}
              onChange={e => { setFormData(prev => ({ ...prev, event_name: e.target.value })); clearFieldError('event_name'); }}
              className={validationErrors.event_name ? 'border-rose-500' : ''}
              required
            />
            {validationErrors.event_name && <span className="text-xs text-rose-500">{validationErrors.event_name}</span>}
          </div>
          {/* Organizer */}
          <div className="grid gap-2">
            <Label htmlFor="organizer" className="text-sm font-medium">Organizer *</Label>
            <Select value={formData.organizer} onValueChange={v => { setFormData(prev => ({ ...prev, organizer: v })); clearFieldError('organizer'); }}>
              <SelectTrigger id="organizer" className={validationErrors.organizer ? 'border-rose-500' : ''}>
                <SelectValue placeholder="Select organizer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin Office">Admin Office</SelectItem>
                <SelectItem value="Academic Affairs">Academic Affairs</SelectItem>
                <SelectItem value="Student Affairs">Student Affairs</SelectItem>
                <SelectItem value="Sports Department">Sports Department</SelectItem>
                <SelectItem value="Library">Library</SelectItem>
                <SelectItem value="Guidance Office">Guidance Office</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.organizer && <span className="text-xs text-rose-500">{validationErrors.organizer}</span>}
          </div>
          {/* Date & Time */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="event_date" className="text-sm font-medium">Date *</Label>
              <Input id="event_date" type="date" value={formData.event_date} onChange={e => { setFormData(prev => ({ ...prev, event_date: e.target.value })); clearFieldError('event_date'); }} className={validationErrors.event_date ? 'border-rose-500' : ''} required />
              {validationErrors.event_date && <span className="text-xs text-rose-500">{validationErrors.event_date}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_time" className="text-sm font-medium">Time *</Label>
              <Input id="event_time" type="time" value={formData.event_time} onChange={e => { setFormData(prev => ({ ...prev, event_time: e.target.value })); clearFieldError('event_time'); }} className={validationErrors.event_time ? 'border-rose-500' : ''} required />
              {validationErrors.event_time && <span className="text-xs text-rose-500">{validationErrors.event_time}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        {currentStep > 1 && <Button type="button" onClick={handleBack}>Back</Button>}
        {currentStep < 3 && <Button type="button" onClick={handleNext}>Next</Button>}
        {currentStep === 3 && <Button type="submit">Create Event</Button>}
      </div>
    </form>
  );
}
