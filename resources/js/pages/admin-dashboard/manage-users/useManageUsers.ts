import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import type { UserForm, UserRow } from './types';

type QrCodeDataUrl = string | null;

export function useManageUsers(errors: Record<string, string> = {}) {
    const [open, setOpen] = useState(false);
    const [phOpen, setPhOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);

    const emptyForm: UserForm = {
        name: '',
        program: '',
        student_id: '',
        email: '',
        password: 'password123',
        first_name: '',
        middle_name: '',
        last_name: '',
        course: '',
        year_level: '',
        role: 'Student',
        officer_features: [],
    };

    const [form, setForm] = useState<UserForm>(emptyForm);

    const hasAnyError = useMemo(() => Object.keys(errors).length > 0, [errors]);

    const resetForm = () => setForm(emptyForm);

    const closeModal = () => {
        setOpen(false);
        setPhOpen(false);
        setEditingUser(null);
        resetForm();
    };

    const openCreateModal = () => {
        setEditingUser(null);
        resetForm();
        setOpen(true);
    };

    const openCreatePHModal = () => {
        setEditingUser(null);
        resetForm();
        setPhOpen(true);
    };

    const openEditModal = (user: UserRow) => {
        setEditingUser(user);

        const userType = String((user as any)?.userType ?? '').toLowerCase();
        if (userType === 'program_head') {
            setForm({
                ...emptyForm,
                name: user.name ?? '',
                email: user.email ?? '',
                program: user.program ?? user.course ?? '',
                password: '',
                role: user.role ?? 'Program Head',
                officer_features: user.officer_features ?? [],
            });
            setPhOpen(true);
            return;
        }

        setForm({
            student_id: user.student_id ?? '',
            email: user.email ?? '',
            password: '',
            first_name: user.first_name ?? '',
            middle_name: user.middle_name ?? '',
            last_name: user.last_name ?? '',
            course: user.course ?? '',
            year_level: user.year_level ?? '',
            role: user.role ?? 'Student',
            officer_features: user.officer_features ?? [],
        });
        setOpen(true);
    };

    const showSaveSuccessAlert = (mode: 'create' | 'update') => {
        Swal.fire({
            icon: 'success',
            title: mode === 'update' ? 'Account updated' : 'Account created',
            text:
                mode === 'update'
                    ? 'Student account has been updated successfully.'
                    : 'Student account has been added successfully.',
            timer: 2000,
            showConfirmButton: false,
        });
    };

    const validateRequiredFields = (mode: 'create' | 'update') => {
        const required: Array<{ key: keyof UserForm; label: string }> = [
            { key: 'student_id', label: 'Student ID' },
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'year_level', label: 'Grade/Year Level' },
            { key: 'course', label: 'Section/Course' },
        ];

        const missing = required
            .filter(({ key }) => !String(form[key] ?? '').trim())
            .map((r) => r.label);

        if (missing.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Missing required fields',
                text: `Please fill: ${missing.join(', ')}`,
                toast: true,
                position: 'top-end',
                timer: 3500,
                showConfirmButton: false,
                timerProgressBar: true,
            });
            return false;
        }

        return true;
    };

    const showValidationErrorAlert = (formErrors?: Record<string, string>) => {
        const firstMessage = formErrors
            ? Object.values(formErrors).find(Boolean)
            : undefined;

        Swal.fire({
            icon: 'error',
            title: 'Please check your inputs',
            text:
                firstMessage ??
                'Some fields have errors. Please review the form.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
            timerProgressBar: true,
        });
    };

    const createUser = (qrCodeDataUrl: QrCodeDataUrl) => {
        router.post(
            '/admin/manage-users',
            {
                ...form,
                qr_code_data_url: qrCodeDataUrl,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    showSaveSuccessAlert('create');
                },
                onError: (formErrors) => {
                    setOpen(true);
                    showValidationErrorAlert(formErrors);
                },
            },
        );
    };

    const updateUser = (
        userId: number | string,
        qrCodeDataUrl: QrCodeDataUrl,
    ) => {
        const id =
            typeof userId === 'number'
                ? userId
                : Number.parseInt(String(userId), 10);

        if (!Number.isFinite(id) || id <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Update failed',
                text: 'Missing user id. Please close the modal and try editing again.',
            });
            return;
        }

        router.put(
            `/admin/manage-users/${id}`,
            {
                id,
                ...form,
                qr_code_data_url: qrCodeDataUrl,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    showSaveSuccessAlert('update');
                },
                onError: (formErrors) => {
                    setOpen(true);
                    showValidationErrorAlert(formErrors);
                },
            },
        );
    };

    const updateProgramHead = (
        programHeadId: number,
        payload: {
            name: string;
            email: string;
            program?: string;
            password?: string;
        },
    ) => {
        router.put(`/admin/program-heads/${programHeadId}`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Account updated',
                    text: 'Program Head account has been updated successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: (formErrors) => {
                setPhOpen(true);
                showValidationErrorAlert(formErrors);
            },
        });
    };

    const createProgramHead = () => {
        router.post(
            '/admin/program-heads',
            {
                name: form.name,
                email: form.email,
                program: form.program,
                password: form.password,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: 'success',
                        title: 'Account created',
                        text: 'Program Head account has been created successfully.',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: (formErrors) => {
                    setPhOpen(true);
                    showValidationErrorAlert(formErrors);
                },
            },
        );
    };

    const submitProgramHead = () => {
        if (editingUser) {
            const programHeadId = Number((editingUser as any)?.program_head_id);
            if (!Number.isFinite(programHeadId) || programHeadId <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Update failed',
                    text: 'Missing program head id. Please refresh the page and try again.',
                });
                return;
            }

            const name = String(form.name ?? '').trim();
            const email = String(form.email ?? '').trim();
            if (!name || !email) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing required fields',
                    text: 'Please fill: Name, Email',
                    toast: true,
                    position: 'top-end',
                    timer: 3500,
                    showConfirmButton: false,
                    timerProgressBar: true,
                });
                return;
            }

            updateProgramHead(programHeadId, {
                name,
                email,
                program: String(form.program ?? '').trim() || undefined,
                password: String(form.password ?? '').trim() || undefined,
            });
        } else {
            const name = String(form.name ?? '').trim();
            const email = String(form.email ?? '').trim();
            const password = String(form.password ?? '').trim();
            if (!name || !email || !password) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing required fields',
                    text: 'Please fill: Name, Email, Password',
                    toast: true,
                    position: 'top-end',
                    timer: 3500,
                    showConfirmButton: false,
                    timerProgressBar: true,
                });
                return;
            }
            createProgramHead();
        }
    };

    const submit = (qrCodeDataUrl: QrCodeDataUrl = null) => {
        if (editingUser) {
            if (!validateRequiredFields('update')) return;
            if (!editingUser.id) {
                Swal.fire({
                    icon: 'error',
                    title: 'Update failed',
                    text: 'Missing user id. Please close the modal and try editing again.',
                });
                return;
            }
            updateUser(editingUser.id, qrCodeDataUrl);
        } else {
            if (!validateRequiredFields('create')) return;
            createUser(qrCodeDataUrl);
        }
    };

    const confirmAndDeleteUser = async (user: UserRow) => {
        const id = Number((user as any)?.id);
        if (!id || Number.isNaN(id)) {
            Swal.fire({
                icon: 'error',
                title: 'Delete failed',
                text: 'Missing user id. Please refresh the page and try again.',
            });
            return;
        }

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Archive account?',
            text: `This will move ${user.name} to the archive. You can restore the account later from the Archive page.`,
            showCancelButton: true,
            confirmButtonText: 'Archive',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#f59e0b',
        });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/manage-users/${id}/archive`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Archived',
                        text: 'Account has been archived successfully.',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Archive failed',
                        text: 'Unable to archive the account. Please try again.',
                    });
                },
            },
        );
    };

    return {
        open,
        setOpen,
        phOpen,
        setPhOpen,
        editingUser,
        form,
        setForm,
        hasAnyError,
        closeModal,
        openCreateModal,
        openCreatePHModal,
        openEditModal,
        submit,
        submitProgramHead,
        confirmAndDeleteUser,
        approveStudent: (userId: number) => {
            router.put(
                `/admin/manage-users/${userId}/status/approve`,
                { status: 'approved' },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Approved',
                            text: 'Student account has been approved.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Approval failed',
                            text: 'Unable to approve the account. Please try again.',
                        });
                    },
                },
            );
        },
        rejectStudent: (userId: number) => {
            router.put(
                `/admin/manage-users/${userId}/status/approve`,
                { status: 'rejected' },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Rejected',
                            text: 'Student account has been rejected.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Rejection failed',
                            text: 'Unable to reject the account. Please try again.',
                        });
                    },
                },
            );
        },
        setPendingStudent: (userId: number) => {
            router.put(
                `/admin/manage-users/${userId}/status/approve`,
                { status: 'pending' },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Pending',
                            text: 'Student account has been set to pending.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Update failed',
                            text: 'Unable to set account to pending. Please try again.',
                        });
                    },
                },
            );
        },
        approveProgramHead: (phId: number) => {
            router.put(
                `/admin/manage-users/program-heads/${phId}/verification/approve`,
                { status: 'approved' },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Approved',
                            text: 'Program Head account has been approved.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Approval failed',
                            text: 'Unable to approve the account. Please try again.',
                        });
                    },
                },
            );
        },
        rejectProgramHead: (phId: number) => {
            router.put(
                `/admin/manage-users/program-heads/${phId}/verification/reject`,
                { status: 'rejected' },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Rejected',
                            text: 'Program Head account has been rejected.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Rejection failed',
                            text: 'Unable to reject the account. Please try again.',
                        });
                    },
                },
            );
        },
        setPendingProgramHead: (phId: number) => {
            router.put(
                `/admin/manage-users/program-heads/${phId}/verification/approve`,
                { status: 'pending' },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Pending',
                            text: 'Program Head account has been set to pending.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Update failed',
                            text: 'Unable to set account to pending. Please try again.',
                        });
                    },
                },
            );
        },
    };
}
