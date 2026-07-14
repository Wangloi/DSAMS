import { Form } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <Card className="overflow-hidden border-red-200/80 shadow-sm dark:border-red-900/50 dark:bg-slate-900">
            <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600" />
            <CardHeader className="border-b border-red-100/80 pb-4 dark:border-red-900/30">
                <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Danger zone</CardTitle>
                        <CardDescription className="mt-1 text-sm">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100">
                    <p className="font-medium">Before you continue</p>
                    <p className="mt-1 text-red-800/90 dark:text-red-200/80">
                        You will lose access to attendance records, evaluations, and other data tied to this account.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" data-test="delete-user-button" className="h-10">
                            Delete account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-slate-200 dark:border-slate-700 dark:bg-slate-900 sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">Delete your account?</DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400">
                                This permanently removes your account and all related data. Enter your password to confirm.
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-4"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            className="h-11 border-slate-300 dark:border-slate-600 dark:bg-slate-950"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2 sm:gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-slate-300 dark:border-slate-600"
                                                onClick={() => resetAndClearErrors()}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>

                                        <Button variant="destructive" disabled={processing} asChild>
                                            <button type="submit" data-test="confirm-delete-user-button">
                                                {processing ? 'Deleting…' : 'Confirm delete'}
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
