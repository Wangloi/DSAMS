import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export function WelcomeBanner() {
    return (
        <Card className="border-0 bg-gradient-to-r from-[#0b1c5c] to-[#0B4DFF] text-white shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Welcome, Admin!</CardTitle>
                <CardDescription className="text-white/90">
                    Here's what's happening with the system today.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
