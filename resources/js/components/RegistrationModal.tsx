import { useForm, router } from '@inertiajs/react';
import { X, ArrowLeft, ArrowRight, User, Mail, Lock, Phone, Calendar, MapPin, GraduationCap, Users, Check } from 'lucide-react';
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
    const [currentStep, setCurrentStep] = useState(1);
    const [registrationData, setRegistrationData] = useState<any>({});
    const [validationErrors, setValidationErrors] = useState<any>({});

    const { data: formData, setData, post, processing, errors, reset } = useForm({
        // Step 1: Student Information
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
        
        // Step 2: Personal Information
        home_address: '',
        birthday: '',
        place_of_birth: '',
        religion: '',
        gender: '',
        contact_no: '',
        nationality: '',
        
        // Step 3: Academic Background
        elementary_school: '',
        elementary_year_graduated: '',
        junior_high_school: '',
        junior_high_year_graduated: '',
        senior_high_school: '',
        senior_high_year_graduated: '',
        
        // Step 4: Family Background
        mother_name: '',
        mother_contact: '',
        father_name: '',
        father_contact: '',
        guardian_name: '',
        guardian_relation: '',
        guardian_contact: '',
    });

    const totalSteps = 4;

    const submitStep = (step: number) => {
        const endpoint = `/student-register/step${step}`;
        
        // Clear previous errors
        setValidationErrors({});
        
        // Debug: Log the form data being sent
        console.log('Submitting step', step, 'with data:', formData);
        
        // Use fetch instead of Inertia post for JSON responses
        fetch(endpoint, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                // If we get HTML instead of JSON, it's likely a validation error
                return response.text().then(html => {
                    console.log('Received HTML instead of JSON:', html.substring(0, 200));
                    throw new Error('Server returned HTML instead of JSON. Check validation rules.');
                });
            }
        })
        .then(data => {
            console.log('Received data:', data);
            
            if (data.success) {
                // Store current data and move to next step
                setRegistrationData((prev: any) => ({ ...prev, ...formData }));
                if (step < totalSteps) {
                    setCurrentStep(step + 1);
                } else {
                    // Registration complete, show success message and close modal
                    alert(data.message || 'Registration completed successfully!');
                    onClose();
                    setCurrentStep(1);
                    reset();
                    setRegistrationData({});
                    // Reload page to show success message
                    window.location.reload();
                }
            } else if (data.errors) {
                // Handle validation errors
                console.error('Validation errors:', data.errors);
                setValidationErrors(data.errors);
                
                const firstError = Object.values(data.errors)[0];
                if (Array.isArray(firstError)) {
                    alert(firstError[0]);
                } else {
                    alert('Please check all required fields and try again.');
                }
            } else if (data.error) {
                // Handle general errors
                console.error('General error:', data.error);
                alert(data.error);
            } else {
                alert('An unknown error occurred. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        if (confirm('Are you sure you want to cancel registration? All progress will be lost.')) {
            onClose();
            setCurrentStep(1);
            reset();
            setRegistrationData({});
            setValidationErrors({});
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white text-center mb-4">Student Information</h3>
                            
                            <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm text-white/90">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-10 rounded-lg bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                <InputError message={validationErrors.email?.[0] || errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="student_id" className="text-sm text-white/90">Student ID</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                    <Input
                                        id="student_id"
                                        name="student_id"
                                        type="text"
                                        autoComplete="username"
                                        value={formData.student_id}
                                        onChange={(e) => setData('student_id', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                        placeholder="Enter your student ID"
                                        required
                                    />
                                </div>
                                <InputError message={validationErrors.student_id?.[0] || errors.student_id} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm text-white/90">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                            placeholder="Password"
                                            required
                                        />
                                    </div>
                                    <InputError message={validationErrors.password?.[0] || errors.password} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-sm text-white/90">Confirm</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                            placeholder="Confirm password"
                                            required
                                        />
                                    </div>
                                    <InputError message={validationErrors.password_confirmation?.[0] || errors.password_confirmation} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-sm text-white/90">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="Last Name"
                                        required
                                    />
                                    <InputError message={validationErrors.last_name?.[0] || errors.last_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-sm text-white/90">First Name</Label>
                                    <Input
                                        id="first_name"
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="First Name"
                                        required
                                    />
                                    <InputError message={validationErrors.first_name?.[0] || errors.first_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="middle_name" className="text-sm text-white/90">Middle Name</Label>
                                    <Input
                                        id="middle_name"
                                        type="text"
                                        value={formData.middle_name}
                                        onChange={(e) => setData('middle_name', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="Middle"
                                    />
                                    <InputError message={validationErrors.middle_name?.[0] || errors.middle_name} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm text-white/90">Entry Status</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {entryStatusOptions.map((status) => (
                                        <label key={status} className="flex items-center space-x-2 text-white/80 text-sm">
                                            <Checkbox
                                                checked={formData.entry_status === status}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setData('entry_status', status);
                                                }}
                                                className="border-white/30"
                                            />
                                            <span>{status}</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={validationErrors.entry_status?.[0] || errors.entry_status} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="program" className="text-sm text-white/90">Program</Label>
                                    <Input
                                        id="program"
                                        type="text"
                                        value={formData.program}
                                        onChange={(e) => setData('program', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="e.g., BS Computer Science"
                                        required
                                    />
                                    <InputError message={validationErrors.program?.[0] || errors.program} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="major" className="text-sm text-white/90">Major</Label>
                                    <Input
                                        id="major"
                                        type="text"
                                        value={formData.major}
                                        onChange={(e) => setData('major', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="e.g., Software Dev"
                                    />
                                    <InputError message={validationErrors.major?.[0] || errors.major} />
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                );

            case 2:
                return (
                    <>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white text-center mb-4">Personal Information</h3>
                            
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="home_address" className="text-sm text-white/90">Home Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                                    <textarea
                                        id="home_address"
                                        value={formData.home_address}
                                        onChange={(e) => setData('home_address', e.target.value)}
                                        className="w-full h-24 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10 pt-2 resize-none focus:outline-none focus:ring-2 focus:ring-white/30"
                                        placeholder="Enter your complete home address&#10;Example:&#10;123 Main Street&#10;Barangay Poblacion&#10;Balingasag, Misamis Oriental&#10;9000"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-white/60 mt-1">Include street, barangay, city/municipality, province, and postal code</p>
                                <InputError message={validationErrors.home_address?.[0] || errors.home_address} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birthday" className="text-sm text-white/90">Birthday</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                    <Input
                                        id="birthday"
                                        type="date"
                                        value={formData.birthday}
                                        onChange={(e) => setData('birthday', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white pl-10"
                                        required
                                    />
                                </div>
                                <InputError message={validationErrors.birthday?.[0] || errors.birthday} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="place_of_birth" className="text-sm text-white/90">Place of Birth</Label>
                                    <Input
                                        id="place_of_birth"
                                        type="text"
                                        value={formData.place_of_birth}
                                        onChange={(e) => setData('place_of_birth', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="City, Province"
                                        required
                                    />
                                    <InputError message={errors.place_of_birth} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="religion" className="text-sm text-white/90">Religion</Label>
                                    <Input
                                        id="religion"
                                        type="text"
                                        value={formData.religion}
                                        onChange={(e) => setData('religion', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="e.g., Roman Catholic"
                                        required
                                    />
                                    <InputError message={errors.religion} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nationality" className="text-sm text-white/90">Nationality</Label>
                                    <Input
                                        id="nationality"
                                        type="text"
                                        value={formData.nationality}
                                        onChange={(e) => setData('nationality', e.target.value)}
                                        className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                        placeholder="e.g., Filipino"
                                        required
                                    />
                                    <InputError message={errors.nationality} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_no" className="text-sm text-white/90">Contact Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                        <Input
                                            id="contact_no"
                                            type="tel"
                                            value={formData.contact_no}
                                            onChange={(e) => setData('contact_no', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50 pl-10"
                                            placeholder="09123456789"
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.contact_no} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-white/90">Gender</Label>
                                    <div className="flex space-x-4 pt-2">
                                        <label className="flex items-center space-x-2 text-white/80">
                                            <Checkbox
                                                checked={formData.gender === 'Male'}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setData('gender', 'Male');
                                                }}
                                                className="border-white/30"
                                            />
                                            <span>Male</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-white/80">
                                            <Checkbox
                                                checked={formData.gender === 'Female'}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setData('gender', 'Female');
                                                }}
                                                className="border-white/30"
                                            />
                                            <span>Female</span>
                                        </label>
                                    </div>
                                    <InputError message={errors.gender} />
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 3:
                return (
                    <>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white text-center mb-4">Academic Background</h3>
                            
                            <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white/90">Elementary Education</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="elementary_school" className="text-sm text-white/90">School</Label>
                                        <Input
                                            id="elementary_school"
                                            type="text"
                                            value={formData.elementary_school}
                                            onChange={(e) => setData('elementary_school', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="School name"
                                            required
                                        />
                                        <InputError message={validationErrors.elementary_school?.[0] || errors.elementary_school} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="elementary_year_graduated" className="text-sm text-white/90">Year Graduated</Label>
                                        <Input
                                            id="elementary_year_graduated"
                                            type="number"
                                            value={formData.elementary_year_graduated}
                                            onChange={(e) => setData('elementary_year_graduated', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="e.g., 2018"
                                            required
                                        />
                                        <InputError message={validationErrors.elementary_year_graduated?.[0] || errors.elementary_year_graduated} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white/90">Junior High School</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="junior_high_school" className="text-sm text-white/90">School</Label>
                                        <Input
                                            id="junior_high_school"
                                            type="text"
                                            value={formData.junior_high_school}
                                            onChange={(e) => setData('junior_high_school', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="School name"
                                            required
                                        />
                                        <InputError message={validationErrors.junior_high_school?.[0] || errors.junior_high_school} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="junior_high_year_graduated" className="text-sm text-white/90">Year Graduated</Label>
                                        <Input
                                            id="junior_high_year_graduated"
                                            type="number"
                                            value={formData.junior_high_year_graduated}
                                            onChange={(e) => setData('junior_high_year_graduated', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="e.g., 2022"
                                            required
                                        />
                                        <InputError message={validationErrors.junior_high_year_graduated?.[0] || errors.junior_high_year_graduated} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white/90">Senior High School</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="senior_high_school" className="text-sm text-white/90">School</Label>
                                        <Input
                                            id="senior_high_school"
                                            type="text"
                                            value={formData.senior_high_school}
                                            onChange={(e) => setData('senior_high_school', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="School name"
                                            required
                                        />
                                        <InputError message={validationErrors.senior_high_school?.[0] || errors.senior_high_school} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="senior_high_year_graduated" className="text-sm text-white/90">Year Graduated</Label>
                                        <Input
                                            id="senior_high_year_graduated"
                                            type="number"
                                            value={formData.senior_high_year_graduated}
                                            onChange={(e) => setData('senior_high_year_graduated', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="e.g., 2024"
                                            required
                                        />
                                        <InputError message={validationErrors.senior_high_year_graduated?.[0] || errors.senior_high_year_graduated} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                );

            case 4:
                return (
                    <>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white text-center mb-4">Family Background</h3>
                            
                            <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white/90 flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Mother's Information
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="mother_name" className="text-sm text-white/90">Mother's Name</Label>
                                        <Input
                                            id="mother_name"
                                            type="text"
                                            value={formData.mother_name}
                                            onChange={(e) => setData('mother_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="Full name"
                                            required
                                        />
                                        <InputError message={validationErrors.mother_name?.[0] || errors.mother_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mother_contact" className="text-sm text-white/90">Contact Number</Label>
                                        <Input
                                            id="mother_contact"
                                            type="tel"
                                            value={formData.mother_contact}
                                            onChange={(e) => setData('mother_contact', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="09123456789"
                                            required
                                        />
                                        <InputError message={validationErrors.mother_contact?.[0] || errors.mother_contact} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white/90 flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Father's Information
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="father_name" className="text-sm text-white/90">Father's Name</Label>
                                        <Input
                                            id="father_name"
                                            type="text"
                                            value={formData.father_name}
                                            onChange={(e) => setData('father_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="Full name"
                                            required
                                        />
                                        <InputError message={validationErrors.father_name?.[0] || errors.father_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="father_contact" className="text-sm text-white/90">Contact Number</Label>
                                        <Input
                                            id="father_contact"
                                            type="tel"
                                            value={formData.father_contact}
                                            onChange={(e) => setData('father_contact', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="09123456789"
                                            required
                                        />
                                        <InputError message={validationErrors.father_contact?.[0] || errors.father_contact} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white/90">Guardian Information (Optional)</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="guardian_name" className="text-sm text-white/90">Guardian's Name</Label>
                                        <Input
                                            id="guardian_name"
                                            type="text"
                                            value={formData.guardian_name}
                                            onChange={(e) => setData('guardian_name', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="Full name"
                                        />
                                        <InputError message={validationErrors.guardian_name?.[0] || errors.guardian_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="guardian_relation" className="text-sm text-white/90">Relationship</Label>
                                        <Input
                                            id="guardian_relation"
                                            type="text"
                                            value={formData.guardian_relation}
                                            onChange={(e) => setData('guardian_relation', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="e.g., Aunt"
                                        />
                                        <InputError message={validationErrors.guardian_relation?.[0] || errors.guardian_relation} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="guardian_contact" className="text-sm text-white/90">Contact</Label>
                                        <Input
                                            id="guardian_contact"
                                            type="tel"
                                            value={formData.guardian_contact}
                                            onChange={(e) => setData('guardian_contact', e.target.value)}
                                            className="h-10 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
                                            placeholder="09123456789"
                                        />
                                        <InputError message={validationErrors.guardian_contact?.[0] || errors.guardian_contact} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                );

            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-b from-[#1b2f8a] to-[#0b1c5c] shadow-2xl">
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
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            {Array.from({ length: totalSteps }, (_, i) => (
                                <div key={i + 1} className="flex items-center">
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                                            i + 1 < currentStep
                                                ? 'bg-green-500 text-white'
                                                : i + 1 === currentStep
                                                ? 'bg-white text-blue-600'
                                                : 'bg-white/20 text-white/60'
                                        }`}
                                    >
                                        {i + 1 < currentStep ? <Check className="h-3 w-3" /> : i + 1}
                                    </div>
                                    {i < totalSteps - 1 && (
                                        <div
                                            className={`mx-2 h-1 w-8 transition-colors ${
                                                i + 1 < currentStep ? 'bg-green-500' : 'bg-white/20'
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-white/60">
                            <span>Student Info</span>
                            <span>Personal Info</span>
                            <span>Academic</span>
                            <span>Family</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
                    {renderStep()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-3">
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    onClick={handleBack}
                                    className="h-10 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            )}
                        </div>
                        
                        <Button
                            type="button"
                            onClick={() => submitStep(currentStep)}
                            disabled={processing}
                            className="h-10 rounded-lg bg-white text-blue-600 hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                        >
                            {processing ? (
                                'Processing...'
                            ) : currentStep === totalSteps ? (
                                'Complete Registration'
                            ) : (
                                <>
                                    Next Step
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
