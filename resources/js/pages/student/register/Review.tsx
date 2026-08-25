import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Student Login',
        href: '/login',
    },
    {
        title: 'Registration - Review Application',
        href: '/student-register/review',
    },
];

export default function Review({ data }: { data: any }) {
    const { post, processing } = useForm({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/student-register/complete');
    };

    const handleRestart = () => {
        router.post('/student-register/restart');
    };

    return (
        <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 sm:px-6 lg:px-8">
            <Head title="Student Registration - Review" />

            <div className="sm:mx-auto sm:w-full sm:max-w-5xl">
                <div className="overflow-hidden rounded-lg bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-green-600 px-6 py-4 text-white">
                        <h2 className="text-center text-2xl font-bold">
                            REVIEW APPLICATION
                        </h2>
                        <p className="text-center text-green-100">
                            ST. RITA'S COLLEGE OF BALINGASAG, INC.
                        </p>
                        <p className="text-center text-green-100">
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-medium text-white">
                                    ✓
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Family Background
                                </span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-6 px-6 py-6">
                        {/* Student Information */}
                        <div className="border-b pb-6">
                            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                    1
                                </span>
                                Student Information
                            </h3>
                            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Student ID:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.student_id}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Email:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.email}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Full Name:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.first_name} {data.middle_name}{' '}
                                        {data.last_name}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Entry Status:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.entry_status}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Program:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.program}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Major:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.major || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="border-b pb-6">
                            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                    2
                                </span>
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Home Address:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.home_address}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Birthday:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.birthday}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Place of Birth:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.place_of_birth}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Religion:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.religion}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Gender:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.gender}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Contact Number:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.contact_no}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Nationality:
                                    </span>
                                    <p className="text-gray-900">
                                        {data.nationality}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Academic Background */}
                        <div className="border-b pb-6">
                            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                    3
                                </span>
                                Academic Background
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Elementary School:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.elementary_school}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Year Graduated:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.elementary_year_graduated}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Junior High School:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.junior_high_school}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Year Graduated:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.junior_high_year_graduated}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Senior High School:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.senior_high_school}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Year Graduated:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.senior_high_year_graduated}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Family Background */}
                        <div className="pb-6">
                            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                    4
                                </span>
                                Family Background
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Mother's Name:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.mother_name}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Mother's Contact:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.mother_contact}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Father's Name:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.father_name}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">
                                            Father's Contact:
                                        </span>
                                        <p className="text-gray-900">
                                            {data.father_contact}
                                        </p>
                                    </div>
                                </div>
                                {(data.guardian_name ||
                                    data.guardian_relation ||
                                    data.guardian_contact) && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <span className="font-medium text-gray-700">
                                                Guardian's Name:
                                            </span>
                                            <p className="text-gray-900">
                                                {data.guardian_name || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">
                                                Relationship:
                                            </span>
                                            <p className="text-gray-900">
                                                {data.guardian_relation ||
                                                    'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">
                                                Guardian's Contact:
                                            </span>
                                            <p className="text-gray-900">
                                                {data.guardian_contact || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Important Notice */}
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <h4 className="mb-2 text-sm font-medium text-yellow-800">
                                Important Notice:
                            </h4>
                            <ul className="space-y-1 text-sm text-yellow-700">
                                <li>
                                    • Please review all information carefully
                                    before submitting
                                </li>
                                <li>
                                    • Once submitted, your account will require
                                    admin approval
                                </li>
                                <li>
                                    • You will be notified once your account is
                                    activated
                                </li>
                                <li>
                                    • Make sure all information is accurate and
                                    complete
                                </li>
                            </ul>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between border-t pt-6">
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={handleRestart}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Start Over
                                </button>
                                <Link
                                    href="/student-register/step4"
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
                                className="rounded-md border border-transparent bg-green-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                            >
                                {processing
                                    ? 'Submitting...'
                                    : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
