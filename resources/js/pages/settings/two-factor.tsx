import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import SettingsPageLayout from '@/layouts/settings/settings-page-layout';
import { Form } from '@inertiajs/react';
import { Shield, ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

type Props = {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    return (
        <SettingsPageLayout title="Two-Factor Authentication">
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="h-1.5 bg-gradient-to-r from-[#23509A] via-[#000D6A] to-[#23509A]" />
                <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#23509A]/10 text-[#23509A] dark:bg-[#23509A]/20 dark:text-blue-300">
                            <Shield className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                Two-Factor Authentication
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm">
                                Manage your two-factor authentication (2FA) settings to add an extra layer of security to your account.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {twoFactorEnabled ? (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                                    Enabled
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Your account is protected with two-factor authentication.
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                With two-factor authentication enabled, you will
                                be prompted for a secure, random pin during
                                login, which you can retrieve from the
                                TOTP-supported application (such as Google Authenticator) on your phone.
                            </p>

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={recoveryCodesList}
                                fetchRecoveryCodes={fetchRecoveryCodes}
                                errors={errors}
                            />

                            <div className="pt-2">
                                <Form
                                    action="/user/two-factor-authentication"
                                    method="delete"
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <Button
                                            variant="destructive"
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2"
                                        >
                                            <ShieldBan className="h-4 w-4" />
                                            {processing ? 'Disabling...' : 'Disable 2FA'}
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">Disabled</Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Two-factor authentication is currently disabled.
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                When you enable two-factor authentication, you
                                will be prompted for a secure 6-digit pin during login.
                                This pin can be retrieved from an authenticator
                                application on your phone.
                            </p>

                            <div className="pt-2">
                                {hasSetupData ? (
                                    <Button
                                        onClick={() => setShowSetupModal(true)}
                                        className="gap-2 bg-[#23509A] hover:bg-[#1a3d75] text-white"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        Continue Setup
                                    </Button>
                                ) : (
                                    <Form
                                        action="/user/two-factor-authentication"
                                        method="post"
                                        options={{ preserveScroll: true }}
                                        onSuccess={() => setShowSetupModal(true)}
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="gap-2 bg-[#23509A] hover:bg-[#1a3d75] text-white"
                                            >
                                                <ShieldCheck className="h-4 w-4" />
                                                {processing ? 'Enabling...' : 'Enable 2FA'}
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        </div>
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />
                </CardContent>
            </Card>
        </SettingsPageLayout>
    );
}
