import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Student Login',
        href: '/login',
    },
    {
        title: 'Registration - Step 4: Family Background',
        href: '/student-register/step4',
    },
];

export default function Step4FamilyBackground({ data }: { data: any }) {
    const {
        data: formData,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        mother_name: data.mother_name || '',
        mother_contact: data.mother_contact || '',
        father_name: data.father_name || '',
        father_contact: data.father_contact || '',
        guardian_name: data.guardian_name || '',
        guardian_relation: data.guardian_relation || '',
        guardian_contact: data.guardian_contact || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/student-register/step4');
    };

    return (
        <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 sm:px-6 lg:px-8">
            <Head title="Student Registration - Step 4" />

            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="overflow-hidden rounded-lg bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-blue-600 px-6 py-4 text-white">
                        <h2 className="text-center text-2xl font-bold">
                            FAMILY BACKGROUND
                        </h2>
                        <p className="text-center text-blue-100">
                            ST. RITA'S COLLEGE OF BALINGASAG, INC.
                        </p>
                        <p className="text-center text-blue-100">
                            Academic Year 2024-2025
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="border-b bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-medium text-white">
                                    ✓
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Student Information
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-medium text-white">
                                    ✓
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Personal Information
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-medium text-white">
                                    ✓
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Academic Background
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                                    4
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Family Background
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-6 px-6 py-6">
                        {/* Parents Information */}
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Parents Information
                            </h3>

                            {/* Mother Information */}
                            <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                <h4 className="text-md mb-3 font-medium text-gray-900">
                                    Mother
                                </h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="mother_name"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Mother's Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="mother_name"
                                            value={formData.mother_name}
                                            onChange={(e) =>
                                                setData(
                                                    'mother_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Juanita Santos"
                                            required
                                        />
                                        {errors.mother_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.mother_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="mother_contact"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            id="mother_contact"
                                            value={formData.mother_contact}
                                            onChange={(e) =>
                                                setData(
                                                    'mother_contact',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., 09123456789"
                                            required
                                        />
                                        {errors.mother_contact && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.mother_contact}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Father Information */}
                            <div className="rounded-lg bg-gray-50 p-4">
                                <h4 className="text-md mb-3 font-medium text-gray-900">
                                    Father
                                </h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="father_name"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Father's Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="father_name"
                                            value={formData.father_name}
                                            onChange={(e) =>
                                                setData(
                                                    'father_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Pedro Santos"
                                            required
                                        />
                                        {errors.father_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.father_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="father_contact"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            id="father_contact"
                                            value={formData.father_contact}
                                            onChange={(e) =>
                                                setData(
                                                    'father_contact',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., 09123456789"
                                            required
                                        />
                                        {errors.father_contact && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.father_contact}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guardian Information */}
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Guardian Information (if applicable)
                            </h3>
                            <p className="mb-4 text-sm text-gray-600">
                                Fill this section only if someone other than
                                your parents will be your guardian.
                            </p>

                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label
                                            htmlFor="guardian_name"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Guardian's Name
                                        </label>
                                        <input
                                            type="text"
                                            id="guardian_name"
                                            value={formData.guardian_name}
                                            onChange={(e) =>
                                                setData(
                                                    'guardian_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Maria Reyes"
                                        />
                                        {errors.guardian_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.guardian_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="guardian_relation"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Relationship
                                        </label>
                                        <input
                                            type="text"
                                            id="guardian_relation"
                                            value={formData.guardian_relation}
                                            onChange={(e) =>
                                                setData(
                                                    'guardian_relation',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Aunt, Uncle, Grandmother"
                                        />
                                        {errors.guardian_relation && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.guardian_relation}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="guardian_contact"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Contact Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="guardian_contact"
                                            value={formData.guardian_contact}
                                            onChange={(e) =>
                                                setData(
                                                    'guardian_contact',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., 09123456789"
                                        />
                                        {errors.guardian_contact && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.guardian_contact}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Complete Summary */}
                        <div className="rounded-lg bg-blue-50 p-4">
                            <h4 className="mb-2 text-sm font-medium text-gray-900">
                                Complete Registration Summary:
                            </h4>
                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
                                <div>
                                    <strong>Name:</strong> {data.first_name}{' '}
                                    {data.middle_name} {data.last_name}
                                </div>
                                <div>
                                    <strong>Student ID:</strong>{' '}
                                    {data.student_id}
                                </div>
                                <div>
                                    <strong>Email:</strong> {data.email}
                                </div>
                                <div>
                                    <strong>Program:</strong> {data.program}
                                </div>
                                <div>
                                    <strong>Address:</strong>{' '}
                                    {data.home_address}
                                </div>
                                <div>
                                    <strong>Contact:</strong> {data.contact_no}
                                </div>
                                <div>
                                    <strong>Birthday:</strong> {data.birthday}
                                </div>
                                <div>
                                    <strong>Gender:</strong> {data.gender}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between border-t pt-6">
                            <div className="flex space-x-3">
                                <Link
                                    href="/student-register/step3"
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Previous
                                </Link>
                                <Link
                                    href="/login"
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Cancel
                                </Link>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                            >
                                {processing
                                    ? 'Saving...'
                                    : 'Review Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
