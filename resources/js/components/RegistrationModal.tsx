import { X, User, Mail, Lock, GraduationCap, Check, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const entryStatusOptions = [
    '1st Year', '2nd Year', '3rd Year', '4th Year',
    'Freshman', 'Returnee', 'Transferee', 'Old Student'
];

export default function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirmation: '',
        student_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        entry_status: '',
        program: '',
        major: '',
    });

    const setField = (key: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
        setIsLoading(true);
        setValidationErrors({});

        axios.post('/student-register/step1', formData)
            .then(res => {
                if (res.data.success) {
                    setIsSubmitted(true);
                } else if (res.data.errors) {
                    setValidationErrors(res.data.errors);
                } else {
                    alert(res.data.error || 'Registration failed. Please try again.');
                }
            })
            .catch(err => {
                if (err.response?.data?.errors) {
                    setValidationErrors(err.response.data.errors);
                } else {
                    console.error('Registration error:', err);
                    alert(err.response?.data?.error || 'An error occurred. Please try again.');
                }
            })
            .finally(() => setIsLoading(false));
    };

    const handleClose = () => {
        if (isSubmitted) {
            onClose();
            return;
        }
        if (confirm('Are you sure you want to cancel registration? All progress will be lost.')) {
            onClose();
            setIsSubmitted(false);
            setValidationErrors({});
            setFormData({
                email: '',
                password: '',
                password_confirmation: '',
                student_id: '',
                first_name: '',
                middle_name: '',
                last_name: '',
                entry_status: '',
                program: '',
                major: '',
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-b from-[#1b2f8a] to-[#0b1c5c] shadow-2xl">
                {/* Header */}
                <div className="relative px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Student Registration</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {!isSubmitted && (
                        <p className="mt-2 text-xs text-white/60">
                            Create your student account. You'll complete your personal & academic info after logging in.
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 py-6 overflow-y-auto max-h-[65vh]">
                    {isSubmitted ? (
                        /* Success state */
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                                <CheckCircle className="h-10 w-10 text-green-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Registration Submitted!</h3>
                                <p className="text-sm text-white/70 max-w-sm">
                                    Your account has been created and is pending activation by the administrator.
                                    Once approved, you can log in and complete your personal information.
                                </p>
                            </div>
                            <Button
                                onClick={() => { onClose(); }}
                                className="mt-4 h-10 rounded-lg bg-white text-blue-700 font-semibold hover:bg-gray-100"
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        /* Registration form — 1 step */
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white text-center mb-4">Student Information</h3>

                            <div className="space-y-3">
                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email" className="text-sm text-white/90">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                        <Input
                                            id="reg-email"
                                            type="email"
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={e => setField('email', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                    <InputError message={validationErrors.email?.[0]} />
                                </div>

                                {/* Student ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="reg-student_id" className="text-sm text-white/90">Student ID</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                        <Input
                                            id="reg-student_id"
                                            type="text"
                                            value={formData.student_id}
                                            onChange={e => setField('student_id', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                            placeholder="Enter your student ID"
                                            required
                                        />
                                    </div>
                                    <InputError message={validationErrors.student_id?.[0]} />
                                </div>

                                {/* Password row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password" className="text-sm text-white/90">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                            <Input
                                                id="reg-password"
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setField('password', e.target.value)}
                                                className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                                placeholder="Password"
                                                required
                                            />
                                        </div>
                                        <InputError message={validationErrors.password?.[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password_confirmation" className="text-sm text-white/90">Confirm</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                            <Input
                                                id="reg-password_confirmation"
                                                type="password"
                                                value={formData.password_confirmation}
                                                onChange={e => setField('password_confirmation', e.target.value)}
                                                className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                                placeholder="Confirm password"
                                                required
                                            />
                                        </div>
                                        <InputError message={validationErrors.password_confirmation?.[0]} />
                                    </div>
                                </div>

                                {/* Name row */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-last_name" className="text-sm text-white/90">Last Name</Label>
                                        <Input
                                            id="reg-last_name"
                                            type="text"
                                            value={formData.last_name}
                                            onChange={e => setField('last_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="Last Name"
                                            required
                                        />
                                        <InputError message={validationErrors.last_name?.[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-first_name" className="text-sm text-white/90">First Name</Label>
                                        <Input
                                            id="reg-first_name"
                                            type="text"
                                            value={formData.first_name}
                                            onChange={e => setField('first_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="First Name"
                                            required
                                        />
                                        <InputError message={validationErrors.first_name?.[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-middle_name" className="text-sm text-white/90">Middle</Label>
                                        <Input
                                            id="reg-middle_name"
                                            type="text"
                                            value={formData.middle_name}
                                            onChange={e => setField('middle_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="Middle"
                                        />
                                    </div>
                                </div>

                                {/* Entry Status */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-white/90">Entry Status</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {entryStatusOptions.map(status => (
                                            <label key={status} className="flex items-center space-x-2 text-white/80 text-sm cursor-pointer">
                                                <Checkbox
                                                    checked={formData.entry_status === status}
                                                    onCheckedChange={checked => {
                                                        if (checked) setField('entry_status', status);
                                                    }}
                                                    className="border-white/30"
                                                />
                                                <span>{status}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={validationErrors.entry_status?.[0]} />
                                </div>

                                {/* Program & Major */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-program" className="text-sm text-white/90">Program</Label>
                                        <Input
                                            id="reg-program"
                                            type="text"
                                            value={formData.program}
                                            onChange={e => setField('program', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="e.g., BS Computer Science"
                                            required
                                        />
                                        <InputError message={validationErrors.program?.[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-major" className="text-sm text-white/90">Major (optional)</Label>
                                        <Input
                                            id="reg-major"
                                            type="text"
                                            value={formData.major}
                                            onChange={e => setField('major', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="e.g., Software Dev"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — only shown on form, not success */}
                {!isSubmitted && (
                    <div className="px-6 py-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-sm text-white/60 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>

                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="h-10 rounded-lg bg-white text-blue-700 hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50"
                            >
                                {isLoading ? 'Submitting…' : 'Create Account'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
