import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Student Login',
        href: '/login',
    },
    {
        title: 'Registration - Step 3: Academic Background',
        href: '/student-register/step3',
    },
];

export default function Step3AcademicBackground({ data }: { data: any }) {
    const {
        data: formData,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        elementary_school: data.elementary_school || '',
        elementary_year_graduated: data.elementary_year_graduated || '',
        junior_high_school: data.junior_high_school || '',
        junior_high_year_graduated: data.junior_high_year_graduated || '',
        senior_high_school: data.senior_high_school || '',
        senior_high_year_graduated: data.senior_high_year_graduated || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/student-register/step3');
    };

    return (
        <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 sm:px-6 lg:px-8">
            <Head title="Student Registration - Step 3" />

            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="overflow-hidden rounded-lg bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-blue-600 px-6 py-4 text-white">
                        <h2 className="text-center text-2xl font-bold">
                            ACADEMIC BACKGROUND
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                                    3
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Academic Background
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-600">
                                    4
                                </div>
                                <span className="ml-2 text-sm text-gray-500">
                                    Family Background
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-6 px-6 py-6">
                        {/* Elementary Education */}
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Elementary Education
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="elementary_school"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        School Attended *
                                    </label>
                                    <input
                                        type="text"
                                        id="elementary_school"
                                        value={formData.elementary_school}
                                        onChange={(e) =>
                                            setData(
                                                'elementary_school',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., Balingasag Central Elementary School"
                                        required
                                    />
                                    {errors.elementary_school && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.elementary_school}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="elementary_year_graduated"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Year Graduated *
                                    </label>
                                    <input
                                        type="number"
                                        id="elementary_year_graduated"
                                        value={
                                            formData.elementary_year_graduated
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'elementary_year_graduated',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., 2018"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        required
                                    />
                                    {errors.elementary_year_graduated && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.elementary_year_graduated}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Junior High School */}
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Junior High School
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="junior_high_school"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        School Attended *
                                    </label>
                                    <input
                                        type="text"
                                        id="junior_high_school"
                                        value={formData.junior_high_school}
                                        onChange={(e) =>
                                            setData(
                                                'junior_high_school',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., St. Rita's College of Balingasag"
                                        required
                                    />
                                    {errors.junior_high_school && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.junior_high_school}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="junior_high_year_graduated"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Year Graduated *
                                    </label>
                                    <input
                                        type="number"
                                        id="junior_high_year_graduated"
                                        value={
                                            formData.junior_high_year_graduated
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'junior_high_year_graduated',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., 2022"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        required
                                    />
                                    {errors.junior_high_year_graduated && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.junior_high_year_graduated}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Senior High School */}
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Senior High School
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="senior_high_school"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        School Attended *
                                    </label>
                                    <input
                                        type="text"
                                        id="senior_high_school"
                                        value={formData.senior_high_school}
                                        onChange={(e) =>
                                            setData(
                                                'senior_high_school',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., St. Rita's College of Balingasag"
                                        required
                                    />
                                    {errors.senior_high_school && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.senior_high_school}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="senior_high_year_graduated"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Year Graduated *
                                    </label>
                                    <input
                                        type="number"
                                        id="senior_high_year_graduated"
                                        value={
                                            formData.senior_high_year_graduated
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'senior_high_year_graduated',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., 2024"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        required
                                    />
                                    {errors.senior_high_year_graduated && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.senior_high_year_graduated}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Summary of Previous Steps */}
                        <div className="rounded-lg bg-gray-50 p-4">
                            <h4 className="mb-2 text-sm font-medium text-gray-900">
                                Registration Summary:
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
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between border-t pt-6">
                            <div className="flex space-x-3">
                                <Link
                                    href="/student-register/step2"
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
                                {processing ? 'Saving...' : 'Next Step'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
