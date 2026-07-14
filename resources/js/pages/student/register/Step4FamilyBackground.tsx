import { Head, Link, router, useForm } from '@inertiajs/react';
import React from 'react';
import type { BreadcrumbItem } from '@/types';

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
    const { data: formData, setData, post, processing, errors, reset } = useForm({
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Student Registration - Step 4" />

            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-600 text-white px-6 py-4">
                        <h2 className="text-2xl font-bold text-center">FAMILY BACKGROUND</h2>
                        <p className="text-center text-blue-100">ST. RITA'S COLLEGE OF BALINGASAG, INC.</p>
                        <p className="text-center text-blue-100">Academic Year 2024-2025</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 py-4 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
                                <span className="ml-2 text-sm font-medium text-gray-900">Student Information</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
                                <span className="ml-2 text-sm font-medium text-gray-900">Personal Information</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
                                <span className="ml-2 text-sm font-medium text-gray-900">Academic Background</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                                <span className="ml-2 text-sm font-medium text-gray-900">Family Background</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="px-6 py-6 space-y-6">
                        {/* Parents Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parents Information</h3>
                            
                            {/* Mother Information */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 className="text-md font-medium text-gray-900 mb-3">Mother</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="mother_name" className="block text-sm font-medium text-gray-700">
                                            Mother's Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="mother_name"
                                            value={formData.mother_name}
                                            onChange={(e) => setData('mother_name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Juanita Santos"
                                            required
                                        />
                                        {errors.mother_name && <p className="mt-1 text-sm text-red-600">{errors.mother_name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="mother_contact" className="block text-sm font-medium text-gray-700">
                                            Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            id="mother_contact"
                                            value={formData.mother_contact}
                                            onChange={(e) => setData('mother_contact', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., 09123456789"
                                            required
                                        />
                                        {errors.mother_contact && <p className="mt-1 text-sm text-red-600">{errors.mother_contact}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Father Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-md font-medium text-gray-900 mb-3">Father</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">
                                            Father's Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="father_name"
                                            value={formData.father_name}
                                            onChange={(e) => setData('father_name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Pedro Santos"
                                            required
                                        />
                                        {errors.father_name && <p className="mt-1 text-sm text-red-600">{errors.father_name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="father_contact" className="block text-sm font-medium text-gray-700">
                                            Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            id="father_contact"
                                            value={formData.father_contact}
                                            onChange={(e) => setData('father_contact', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., 09123456789"
                                            required
                                        />
                                        {errors.father_contact && <p className="mt-1 text-sm text-red-600">{errors.father_contact}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guardian Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information (if applicable)</h3>
                            <p className="text-sm text-gray-600 mb-4">Fill this section only if someone other than your parents will be your guardian.</p>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="guardian_name" className="block text-sm font-medium text-gray-700">
                                            Guardian's Name
                                        </label>
                                        <input
                                            type="text"
                                            id="guardian_name"
                                            value={formData.guardian_name}
                                            onChange={(e) => setData('guardian_name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Maria Reyes"
                                        />
                                        {errors.guardian_name && <p className="mt-1 text-sm text-red-600">{errors.guardian_name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="guardian_relation" className="block text-sm font-medium text-gray-700">
                                            Relationship
                                        </label>
                                        <input
                                            type="text"
                                            id="guardian_relation"
                                            value={formData.guardian_relation}
                                            onChange={(e) => setData('guardian_relation', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., Aunt, Uncle, Grandmother"
                                        />
                                        {errors.guardian_relation && <p className="mt-1 text-sm text-red-600">{errors.guardian_relation}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="guardian_contact" className="block text-sm font-medium text-gray-700">
                                            Contact Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="guardian_contact"
                                            value={formData.guardian_contact}
                                            onChange={(e) => setData('guardian_contact', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., 09123456789"
                                        />
                                        {errors.guardian_contact && <p className="mt-1 text-sm text-red-600">{errors.guardian_contact}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Complete Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Complete Registration Summary:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div><strong>Name:</strong> {data.first_name} {data.middle_name} {data.last_name}</div>
                                <div><strong>Student ID:</strong> {data.student_id}</div>
                                <div><strong>Email:</strong> {data.email}</div>
                                <div><strong>Program:</strong> {data.program}</div>
                                <div><strong>Address:</strong> {data.home_address}</div>
                                <div><strong>Contact:</strong> {data.contact_no}</div>
                                <div><strong>Birthday:</strong> {data.birthday}</div>
                                <div><strong>Gender:</strong> {data.gender}</div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6 border-t">
                            <div className="flex space-x-3">
                                <Link
                                    href="/student-register/step3"
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Previous
                                </Link>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </Link>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Review Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
