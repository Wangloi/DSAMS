import { Palette } from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SettingsPageLayout from '@/layouts/settings/settings-page-layout';

export default function Appearance() {
    return (
        <SettingsPageLayout title="Appearance settings">
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="h-1.5 bg-gradient-to-r from-[#23509A] via-[#000D6A] to-[#23509A]" />
                <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#23509A]/10 text-[#23509A] dark:bg-[#23509A]/20 dark:text-blue-300">
                            <Palette className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                Appearance
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm">
                                Choose how DSAMS looks on this device.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <AppearanceTabs />
                </CardContent>
            </Card>
        </SettingsPageLayout>
    );
}
