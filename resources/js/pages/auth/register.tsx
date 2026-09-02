import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import VideoBackground from '@/components/VideoBackground';
import { landing, login } from '@/routes';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    GraduationCap,
    IdCard,
    Lock,
    Mail,
    User,
    UserPlus,
    Users,
} from 'lucide-react';

export default function Register() {
    const form = useForm({
        name: '',
        student_id: '',
        email: '',
        course: '',
        role: '',
        password: '',
        password_confirmation: '',
    });

    const roleInfo = {
        student: {
            idLabel: 'Student ID',
            idPlaceholder: 'Enter your student ID',
            courseLabel: 'Course',
            coursePlaceholder: 'Select your course',
            courses: [
                { value: 'BSIT', label: 'BSIT' },
                { value: 'BSBA', label: 'BSBA' },
                { value: 'BSED', label: 'BSED' },
                { value: 'BEED', label: 'BEED' },
            ]
        },
        program_head: {
            idLabel: 'Employee ID',
            idPlaceholder: 'Enter your employee ID',
            courseLabel: 'Assigned Program / Department',
            coursePlaceholder: 'Select your program',
            courses: [
                { value: 'BSIT', label: 'IT Department (BSIT)' },
                { value: 'BSBA', label: 'Business Department (BSBA)' },
                { value: 'BSED', label: 'Secondary Education (BSED)' },
                { value: 'BEED', label: 'Elementary Education (BEED)' },
            ]
        },
        admin: {
            idLabel: 'Admin ID',
            idPlaceholder: 'Enter your admin ID',
            courseLabel: 'Office / Department',
            coursePlaceholder: 'Select your office',
            courses: [
                { value: 'OSA', label: 'Office of Student Affairs (OSA)' },
                { value: 'Admin', label: 'Administration Office' },
            ]
        }
    };

    const details = (form.data.role === 'student' || form.data.role === 'program_head' || form.data.role === 'admin')
        ? roleInfo[form.data.role]
        : {
            idLabel: 'ID Number',
            idPlaceholder: 'Select your role first',
            courseLabel: 'Course / Department',
            coursePlaceholder: 'Select your role first',
            courses: []
        };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/register', {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="relative flex h-svh w-full flex-row overflow-hidden bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
            <Head title="Register - Student Affairs Management System" />

            {/* Left: Video Area with White Opacity Overlay (Same as Login Page) */}
            <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-100 md:flex">
                <VideoBackground />
                {/* White Opacity Overlay */}
                <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px]" />

                {/* Desktop Header Navigation */}
                <div className="relative z-10 flex flex-col gap-4 items-start lg:flex-row lg:items-center lg:justify-between p-8 lg:p-12">
                    <Link
                        href={landing()}
                        className="group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-[#1b2f8a] shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-[#162775]"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Dual Institutional Logos Badge */}
                    <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 shadow-md backdrop-blur-md">
                        <img
                            src="/images/SRCB1.png"
                            alt="SRCB Logo"
                            className="h-12 w-12 object-contain transition-transform hover:scale-105"
                        />
                        <span className="h-7 w-px bg-slate-300" />
                        <img
                            src="/images/DSA.png"
                            alt="OSA Logo"
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200 transition-transform hover:scale-105"
                        />
                    </div>
                </div>

                {/* Hero Caption */}
                <div className="relative z-10 max-w-2xl p-8 lg:p-16">
                    <div className="space-y-6">
                        <h1 className="text-4xl leading-tight font-black tracking-tight text-[#1b2f8a] lg:text-6xl">
                            <span className="sr-only">Student Affairs Management System</span>
                            <img
                                src="/images/OSA_BNR1.png"
                                alt="Student Affairs Management System"
                                className="h-auto w-full max-w-md object-contain transition-transform hover:scale-[1.01]"
                            />
                        </h1>

                        <p className="max-w-lg text-base leading-relaxed font-semibold text-slate-700 lg:text-lg">
                            Streamlining student services, activities, event
                            management, and discipline tracking into one modern
                            unified platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: Modern Form Panel (Same layout and styling as Login Page right panel) */}
            <div className="relative z-10 flex h-svh w-full shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-gradient-to-b from-[#1b2f8a] via-[#162775] to-[#101d5c] px-6 py-12 shadow-2xl sm:px-12 md:w-[480px] lg:w-[540px]">
                <div className="my-auto w-full mx-auto max-w-sm space-y-6">
                    


                    {/* Title Header */}
                    <div className="space-y-1 text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight text-white">
                            Create Account
                        </h2>
                        <p className="text-sm text-slate-300/90">
                            Get started with your OSAMS account.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        {/* Role Selection (At the Top) */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="role"
                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                            >
                                Register as
                            </Label>
                            <div className="relative group">
                                <Users className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    tabIndex={1}
                                    value={form.data.role}
                                    onChange={(e) => {
                                        const selectedRole = e.target.value;
                                        form.setData((data) => ({
                                            ...data,
                                            role: selectedRole,
                                            student_id: '',
                                            course: '',
                                        }));
                                    }}
                                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pr-3 pl-11 text-sm text-white focus:border-blue-400 focus:bg-[#162775] focus:outline-none transition-all"
                                >
                                    <option value="" disabled className="bg-[#101d5c] text-slate-400">
                                        Select your role
                                    </option>
                                    <option value="student" className="bg-[#101d5c] text-white">Student</option>
                                    <option value="program_head" className="bg-[#101d5c] text-white">Program Head</option>
                                    <option value="admin" className="bg-[#101d5c] text-white">Admin</option>
                                </select>
                            </div>
                            <InputError message={form.errors.role} />
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="name"
                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                            >
                                Username
                            </Label>
                            <div className="relative group">
                                <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={2}
                                    autoComplete="name"
                                    name="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter your username"
                                    className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                />
                            </div>
                            <InputError message={form.errors.name} />
                        </div>

                        {/* ID Number */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="student_id"
                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                            >
                                {details.idLabel}
                            </Label>
                            <div className="relative group">
                                <IdCard className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                <Input
                                    id="student_id"
                                    type="text"
                                    required
                                    tabIndex={3}
                                    name="student_id"
                                    value={form.data.student_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'student_id',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={details.idPlaceholder}
                                    className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                />
                            </div>
                            <InputError message={form.errors.student_id} />
                        </div>

                        {/* School Email */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                            >
                                School Email
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={4}
                                    autoComplete="email"
                                    name="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="yourname@srcb.edu.ph"
                                    className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                />
                            </div>
                            <InputError message={form.errors.email} />
                        </div>

                        {/* Course/Department */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="course"
                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                            >
                                {details.courseLabel}
                            </Label>
                            <div className="relative group">
                                <GraduationCap className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                <select
                                    id="course"
                                    name="course"
                                    required
                                    tabIndex={5}
                                    value={form.data.course}
                                    onChange={(e) =>
                                        form.setData(
                                            'course',
                                            e.target.value,
                                        )
                                    }
                                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pr-3 pl-11 text-sm text-white focus:border-blue-400 focus:bg-[#162775] focus:outline-none transition-all"
                                >
                                    <option value="" disabled className="bg-[#101d5c] text-slate-400">
                                        {details.coursePlaceholder}
                                    </option>
                                    {details.courses.map((c) => (
                                        <option key={c.value} value={c.value} className="bg-[#101d5c] text-white">
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <InputError message={form.errors.course} />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="password"
                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                            >
                                Password
                            </Label>
                            <div className="relative group">
                                <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password"
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter your password"
                                    className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                />
                            </div>
                            <InputError message={form.errors.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-xs font-semibold tracking-wider text-slate-200 uppercase"
                            >
                                Confirm Password
                            </Label>
                            <div className="relative group">
                                <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-300" />
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={7}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    value={form.data.password_confirmation}
                                    onChange={(e) =>
                                        form.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Confirm password"
                                    className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder-slate-400 transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                />
                            </div>
                            <InputError message={form.errors.password_confirmation} />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="mt-6 h-12 w-full rounded-xl bg-blue-600 font-bold text-white shadow-lg transition-all duration-150 hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 shadow-blue-500/25"
                            tabIndex={8}
                            disabled={form.processing}
                            data-test="register-user-button"
                        >
                            {form.processing ? (
                                <Spinner />
                            ) : (
                                <UserPlus className="mr-2 h-5 w-5" />
                            )}
                            Create account
                        </Button>

                        {/* Redirect Link */}
                        <div className="mt-4 text-center text-xs text-slate-300/90">
                            Already have an account?{' '}
                            <Link
                                href={login()}
                                tabIndex={9}
                                className="font-bold text-white underline underline-offset-4 hover:text-blue-200"
                            >
                                Log in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
