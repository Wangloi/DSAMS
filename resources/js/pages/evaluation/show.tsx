import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Head, usePage } from '@inertiajs/react';
import { Star, UserRoundCog, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';

type Evaluation = {
    id: number;
    name: string;
    event: string;
    qr_code_path?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type PageProps = {
    evaluation: Evaluation;
};

export default function EvaluationShow() {
    const { props } = usePage<PageProps>();
    const evaluation = props.evaluation;

    const [form, setForm] = useState({
        name: '',
        rating: 0,
        comment: '',
    });

    const [hoveredRating, setHoveredRating] = useState(0);

    const handleRatingClick = (rating: number) => {
        setForm((prev) => ({ ...prev, rating }));
    };

    const handleSubmit = () => {
        if (!form.name.trim() || form.rating === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Required Fields',
                text: 'Please provide your name and select a rating.',
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Thank You!',
            text: 'Your evaluation has been submitted successfully.',
            timer: 3000,
            showConfirmButton: false,
        });

        // Reset form
        setForm({
            name: '',
            rating: 0,
            comment: '',
        });
    };

    return (
        <>
            <Head title={`Evaluation: ${evaluation.name}`} />
            <div className="relative flex min-h-screen items-center justify-center bg-slate-50 p-4 transition-colors duration-500 dark:bg-[#020617]">
                {/* Visual Depth Layers - Mesh Gradients */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-blue-600/10 mix-blend-multiply blur-[120px] dark:bg-blue-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 mix-blend-multiply blur-[120px] dark:bg-indigo-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px] dark:bg-emerald-600/5" />
                </div>

                <Card className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/40">
                    <CardHeader className="relative overflow-hidden bg-[#0b2d66] p-6 text-center text-white sm:p-8">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 h-[200px] w-[200px] translate-x-1/3 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-2xl" />
                        
                        <div className="relative z-10">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                                <UserRoundCog className="h-6 w-6 text-blue-300" />
                            </div>
                            <CardTitle className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                {evaluation.name}
                            </CardTitle>
                            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-200/85 uppercase tracking-wider">
                                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                                {evaluation.event}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-5 p-6 sm:p-8">
                        <div className="text-center">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                                Please take a moment to share your feedback about this event. Your review helps us improve future campus events.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="name"
                                    className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                >
                                    Your Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter your full name"
                                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/30"
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                                    Rating *
                                </Label>
                                <div className="flex items-center justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() =>
                                                handleRatingClick(star)
                                            }
                                            onMouseEnter={() =>
                                                setHoveredRating(star)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredRating(0)
                                            }
                                            className="p-1 transition-transform hover:scale-110 active:scale-95"
                                        >
                                            <Star
                                                className={`h-8 w-8 transition-colors ${
                                                    star <=
                                                    (hoveredRating ||
                                                        form.rating)
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-slate-300 dark:text-slate-650'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                {form.rating > 0 && (
                                    <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        {form.rating} star{form.rating !== 1 ? 's' : ''} Selected
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="comment"
                                    className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                >
                                    Comments (Optional)
                                </Label>
                                <Textarea
                                    id="comment"
                                    value={form.comment}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            comment: e.target.value,
                                        }))
                                    }
                                    placeholder="Share your thoughts about the event..."
                                    rows={4}
                                    className="resize-none rounded-2xl border-slate-200 bg-slate-50 p-4 leading-relaxed focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/30"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button
                                onClick={handleSubmit}
                                className="h-12 w-full rounded-2xl bg-[#0b2d66] text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-blue-900/10 transition-all hover:bg-[#1e40af] active:scale-95 disabled:opacity-50"
                                disabled={
                                    !form.name.trim() || form.rating === 0
                                }
                            >
                                Submit Evaluation
                            </Button>

                            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                OSAMS • Office of Student Affairs
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
