import { router } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { adminLostFoundStore, adminLostFoundUpdate } from '@/routes';

type FormState = {
    dateFound: string;
    timeFound: string;
    itemDescription: string;
    placeFound: string;
    finderName: string;
    contactInfo: string;
    program: string;
    yearLevel: string;
    status: 'Claimed' | 'In Storage' | 'Verification Pending' | 'Unclaimed';
    image: File | null;
};

const emptyForm: FormState = {
    dateFound: '',
    timeFound: '',
    itemDescription: '',
    placeFound: '',
    finderName: '',
    contactInfo: '',
    program: '',
    yearLevel: '',
    status: 'In Storage',
    image: null,
};

type Props = {
    editingItem: FoundItemRow | null;
    setEditingItem: React.Dispatch<React.SetStateAction<FoundItemRow | null>>;
};

type FoundItemRow = {
    id: string;
    title: string;
    foundAt: string;
    dateFound: string;
    timeFound: string;
    location: string;
    status: 'Claimed' | 'In Storage' | 'Verification Pending' | 'Unclaimed';
    imageUrl?: string;
};

export default function AddFoundItemDialog({ editingItem, setEditingItem }: Props) {
    const [open, setOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);

    const getCurrentDateTimeDefaults = () => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateFound = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeFound = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        return { dateFound, timeFound };
    };

    const canSubmit = useMemo(() => {
        return (
            String(form.dateFound).trim() &&
            String(form.timeFound).trim() &&
            String(form.itemDescription).trim() &&
            String(form.placeFound).trim() &&
            String(form.finderName).trim() &&
            String(form.program).trim() &&
            String(form.yearLevel).trim()
        );
    }, [form]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('open_add') === 'true' && !open) {
            openForCreate();
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('open_add');
            window.history.replaceState({}, '', url.pathname + url.search);
        }

        if (editingItem) {
            setForm({
                dateFound: editingItem.dateFound,
                timeFound: editingItem.timeFound,
                itemDescription: editingItem.title,
                placeFound: editingItem.location,
                finderName: '',
                contactInfo: '',
                program: '',
                yearLevel: '',
                status: editingItem.status,
                image: null,
            });
            setOpen(true);
        } else {
            // Check again if we're not triggered by URL to reset
            if (urlParams.get('open_add') !== 'true') {
                setForm(emptyForm);
            }
        }
    }, [editingItem]);

    const close = () => {
        setOpen(false);
        setEditingItem(null);
        setForm(emptyForm);
    };

    const openForCreate = () => {
        const { dateFound, timeFound } = getCurrentDateTimeDefaults();
        setForm({ ...emptyForm, dateFound, timeFound });
        setOpen(true);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            close();
            return;
        }

        if (!editingItem) {
            openForCreate();
            return;
        }

        setOpen(true);
    };

    const onSubmit = () => {
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('date_found', form.dateFound);
        formData.append('time_found', form.timeFound);
        formData.append('item_description', form.itemDescription);
        formData.append('place_found', form.placeFound);
        formData.append('finder_name', form.finderName);
        formData.append('contact_info', form.contactInfo);
        formData.append('program', form.program);
        formData.append('year_level', form.yearLevel);
        if (editingItem) formData.append('status', form.status);
        if (form.image) formData.append('image', form.image);

        if (editingItem) {
            router.put(adminLostFoundUpdate(editingItem.id), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    close();
                },
                onFinish: () => {
                    setIsProcessing(false);
                }
            });
        } else {
            router.post(adminLostFoundStore(), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    close();
                },
                onFinish: () => {
                    setIsProcessing(false);
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button type="button" className="gap-2 bg-white/15 text-white hover:bg-white/25 transition-colors" onClick={openForCreate}>
                <PlusCircle className="h-4 w-4" />
                Add Found Item
            </Button>

            <DialogContent className="sm:max-w-3xl overflow-hidden p-0">
                <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-white">{editingItem ? 'Edit Found Item' : 'Add Found Item'}</DialogTitle>
                        <DialogDescription className="text-white/80">
                            {editingItem
                                ? 'Update the details for the found item.'
                                : 'Record the details for the newly found item.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="dateFound">Date Found *</Label>
                            <Input
                                id="dateFound"
                                type="date"
                                value={form.dateFound}
                                onChange={(e) => setForm((p) => ({ ...p, dateFound: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="timeFound">Time Found *</Label>
                            <Input
                                id="timeFound"
                                type="time"
                                value={form.timeFound}
                                onChange={(e) => setForm((p) => ({ ...p, timeFound: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="itemDescription">Item Description *</Label>
                        <textarea
                            id="itemDescription"
                            value={form.itemDescription}
                            onChange={(e) => setForm((p) => ({ ...p, itemDescription: e.target.value }))}
                            rows={4}
                            placeholder="Describe the found item in detail..."
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="placeFound">Place Found *</Label>
                        <Input
                            id="placeFound"
                            placeholder="e.g., Library - 2nd Floor, Cafeteria, Room 301"
                            value={form.placeFound}
                            onChange={(e) => setForm((p) => ({ ...p, placeFound: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="finderName">Finder's Name *</Label>
                            <Input
                                id="finderName"
                                value={form.finderName}
                                onChange={(e) => setForm((p) => ({ ...p, finderName: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="contactInfo">Contact Information</Label>
                            <Input
                                id="contactInfo"
                                placeholder="Email or phone number"
                                value={form.contactInfo}
                                onChange={(e) => setForm((p) => ({ ...p, contactInfo: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="program">Program *</Label>
                            <Input
                                id="program"
                                placeholder="e.g., Computer Science"
                                value={form.program}
                                onChange={(e) => setForm((p) => ({ ...p, program: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Year Level *</Label>
                            <Select value={form.yearLevel} onValueChange={(v) => setForm((p) => ({ ...p, yearLevel: v }))}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select Year Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                    <SelectItem value="5th Year">5th Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {editingItem && (
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as typeof form.status }))}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="In Storage">In Storage</SelectItem>
                                    <SelectItem value="Verification Pending">Verification Pending</SelectItem>
                                    <SelectItem value="Claimed">Claimed</SelectItem>
                                    <SelectItem value="Unclaimed">Unclaimed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="image">Item Image (Optional)</Label>
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" className="h-10" onClick={close} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button type="button" className="h-10 bg-blue-600 hover:bg-blue-700" disabled={!canSubmit || isProcessing} onClick={onSubmit}>
                            {isProcessing ? 'Saving...' : editingItem ? 'Update Found Item' : 'Add Found Item'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
