import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminPrograms, adminProgramsUpdate } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AdminLayout from '../admin-layout';

interface Program {
    id: string;
    name: string;
    code: string;
    department: string;
    description: string;
    duration: string;
    is_active: boolean;
}

interface EditPageProps {
    program: Program;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin-dashboard',
    },
    {
        title: 'Programs',
        href: adminPrograms(),
    },
    {
        title: 'Edit Program',
        href: '#',
    },
];

export default function AdminProgramsEditPage({ program }: EditPageProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: program.name,
        code: program.code,
        department: program.department || '',
        description: program.description || '',
        duration: program.duration || '',
        is_active: program.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(adminProgramsUpdate(program.id), {
            onSuccess: () => {
                router.visit(adminPrograms());
            },
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Program" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit(adminPrograms())}
                            className="text-slate-600 dark:text-slate-400"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Programs
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Edit Program
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Update program information
                            </p>
                        </div>
                    </div>

                    <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-800 dark:text-white">
                                Program Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Program Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                            placeholder="e.g., Bachelor of Science in Computer Science"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="code"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Program Code *
                                        </Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            value={data.code}
                                            onChange={(e) =>
                                                setData('code', e.target.value)
                                            }
                                            className="bg-white font-mono dark:bg-slate-700 dark:text-slate-300"
                                            placeholder="e.g., BSCS"
                                            required
                                        />
                                        {errors.code && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {errors.code}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="department"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Department
                                        </Label>
                                        <Input
                                            id="department"
                                            type="text"
                                            value={data.department}
                                            onChange={(e) =>
                                                setData(
                                                    'department',
                                                    e.target.value,
                                                )
                                            }
                                            className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                            placeholder="e.g., College of Engineering"
                                        />
                                        {errors.department && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {errors.department}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="duration"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Duration
                                        </Label>
                                        <Input
                                            id="duration"
                                            type="text"
                                            value={data.duration}
                                            onChange={(e) =>
                                                setData(
                                                    'duration',
                                                    e.target.value,
                                                )
                                            }
                                            className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                            placeholder="e.g., 4 years"
                                        />
                                        {errors.duration && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {errors.duration}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="description"
                                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="min-h-[100px] bg-white dark:bg-slate-700 dark:text-slate-300"
                                        placeholder="Enter a detailed description of the program..."
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked: boolean) =>
                                            setData('is_active', checked)
                                        }
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Active Program
                                    </Label>
                                </div>

                                <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.visit(adminPrograms())
                                        }
                                        className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing
                                            ? 'Updating...'
                                            : 'Update Program'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
