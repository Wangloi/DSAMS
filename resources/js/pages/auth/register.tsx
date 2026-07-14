import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, GraduationCap, IdCard, Lock, Mail, User, UserPlus, Users } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import VideoBackground from '@/components/VideoBackground';
import { landing, login } from '@/routes';

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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/register', {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="relative min-h-svh overflow-hidden">
            <VideoBackground />

            <div className="absolute inset-0 bg-blue-900/50" />
            <div className="flex min-h-svh items-center justify-center px-5 py-6">
                <Head title="Register" />

                <div className="mx-auto w-full max-w-md">
                    <div className="rounded-3xl bg-white/40 p-6 shadow-sm backdrop-blur">
                        <div className="mb-4">
                            <Link
                                href={landing()}
                                className="inline-flex items-center gap-2 text-slate-700 transition-colors hover:text-slate-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-[#1b2f8a] to-[#0b1c5c] px-4 py-4 text-center text-white shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                                <UserPlus className="h-7 w-7 text-white" />
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold">Join</h1>
                            <p className="text-2xl font-semibold">to OSAMS!</p>
                            <p className="mt-1 text-xs text-white/90">
                                Register to your OSAMS account!
                            </p>
                        </div>

                        <form onSubmit={submit} className="mt-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm text-slate-900">
                                        Username
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            name="name"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            placeholder="Enter your username"
                                            className="h-10 rounded-xl bg-slate-100 pl-10"
                                        />
                                    </div>
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="student_id" className="text-sm text-slate-900">
                                        Student ID
                                    </Label>
                                    <div className="relative">
                                        <IdCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            id="student_id"
                                            type="text"
                                            required
                                            tabIndex={2}
                                            name="student_id"
                                            value={form.data.student_id}
                                            onChange={(e) => form.setData('student_id', e.target.value)}
                                            placeholder="Enter your student ID"
                                            className="h-10 rounded-xl bg-slate-100 pl-10"
                                        />
                                    </div>
                                    <InputError message={form.errors.student_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm text-slate-900">
                                        School Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            tabIndex={3}
                                            autoComplete="email"
                                            name="email"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            placeholder="yourname@srcb.edu.ph"
                                            className="h-10 rounded-xl bg-slate-100 pl-10"
                                        />
                                    </div>
                                    <InputError message={form.errors.email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course" className="text-sm text-slate-900">
                                        Course
                                    </Label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <select
                                            id="course"
                                            name="course"
                                            required
                                            tabIndex={4}
                                            value={form.data.course}
                                            onChange={(e) => form.setData('course', e.target.value)}
                                            className="h-10 w-full rounded-xl bg-slate-100 pl-10 pr-3 text-sm text-slate-900"
                                        >
                                            <option value="" disabled>
                                                Select your course
                                            </option>
                                            <option value="BSIT">BSIT</option>
                                            <option value="BSBA">BSBA</option>
                                            <option value="BSED">BSED</option>
                                            <option value="BEED">BEED</option>
                                        </select>
                                    </div>
                                    <InputError message={form.errors.course} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm text-slate-900">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            tabIndex={6}
                                            autoComplete="new-password"
                                            name="password"
                                            value={form.data.password}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            placeholder="Enter your password"
                                            className="h-10 rounded-xl bg-slate-100 pl-10"
                                        />
                                    </div>
                                    <InputError message={form.errors.password} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-sm text-slate-900">
                                        Confirm password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            tabIndex={7}
                                            autoComplete="new-password"
                                            name="password_confirmation"
                                            value={form.data.password_confirmation}
                                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm password"
                                            className="h-10 rounded-xl bg-slate-100 pl-10"
                                        />
                                    </div>
                                    <InputError message={form.errors.password_confirmation} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm text-slate-900">
                                    Role
                                </Label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                    <select
                                        id="role"
                                        name="role"
                                        required
                                        tabIndex={5}
                                        value={form.data.role}
                                        onChange={(e) => form.setData('role', e.target.value)}
                                        className="h-10 w-full rounded-xl bg-slate-100 pl-10 pr-3 text-sm text-slate-900"
                                    >
                                        <option value="" disabled>
                                            Select your role
                                        </option>
                                        <option value="student">Student</option>
                                        <option value="program_head">Program Head</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <InputError message={form.errors.role} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-10 w-full rounded-xl bg-[#3b66d7] text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#335cc7] active:translate-y-0"
                                tabIndex={8}
                                disabled={form.processing}
                                data-test="register-user-button"
                            >
                                {form.processing ? <Spinner /> : <UserPlus className="mr-2 h-5 w-5" />}
                                Create account
                            </Button>

                            <div className="mt-3 text-center text-sm text-black">
                                Already have an account?{' '}
                                <TextLink href={login()} tabIndex={9}>
                                    Log in
                                </TextLink>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
