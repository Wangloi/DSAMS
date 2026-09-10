import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import type { PasswordResetRequest } from './types';

interface ManagePasswordResetsTabProps {
    passwordResetRequests?: PasswordResetRequest[];
}

export function ManagePasswordResetsTab({
    passwordResetRequests = [],
}: ManagePasswordResetsTabProps) {
    const pendingRequests = passwordResetRequests.filter(
        (r) => r.status === 'pending',
    );

    return (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0B192C]/50">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                    Pending Password Reset Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full min-w-max text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 text-xs tracking-wider text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-medium">User Email</th>
                                <th className="px-4 py-3 font-medium">User Type</th>
                                <th className="px-4 py-3 font-medium">
                                    Requested At
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900/50">
                            {pendingRequests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                        {request.email}
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        {request.user_type.replace('_', ' ')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(
                                            request.created_at,
                                        ).toLocaleString()}
                                    </td>
                                    <td className="space-x-2 px-4 py-3 text-right">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        'Are you sure you want to approve this request and reset the password to the default static password?',
                                                    )
                                                ) {
                                                    router.post(
                                                        `/admin/password-resets/${request.id}/approve`,
                                                    );
                                                }
                                            }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        'Are you sure you want to reject this request?',
                                                    )
                                                ) {
                                                    router.post(
                                                        `/admin/password-resets/${request.id}/reject`,
                                                    );
                                                }
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {pendingRequests.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-slate-500"
                                    >
                                        No pending password reset requests.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
