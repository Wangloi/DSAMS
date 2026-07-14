import { Head, router, usePage } from '@inertiajs/react';
import { Star, UserRoundCog } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
        setForm(prev => ({ ...prev, rating }));
    };

    const handleSubmit = () => {
        if (!form.name.trim() || form.rating === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Required Fields',
                text: 'Please provide your name and select a rating.',
            });
            return;
        }

        // Here you would typically submit to a public evaluation response endpoint
        // For now, just show success
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl shadow-lg">
                    <CardHeader className="text-center bg-gradient-to-r from-[#0b2d66] to-[#1e40af] text-white rounded-t-lg">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <UserRoundCog className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl">{evaluation.name}</CardTitle>
                        <p className="text-white/80">{evaluation.event}</p>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        <div className="text-center">
                            <p className="text-slate-600 mb-6">
                                Please take a moment to share your feedback about this event.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Your Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your full name"
                                    className="h-11"
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label className="text-sm font-medium">
                                    Rating *
                                </Label>
                                <div className="flex items-center justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleRatingClick(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="p-1 hover:scale-110 transition-transform"
                                        >
                                            <Star
                                                className={`h-8 w-8 ${
                                                    star <= (hoveredRating || form.rating)
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-slate-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                {form.rating > 0 && (
                                    <p className="text-center text-sm text-slate-600">
                                        {form.rating} star{form.rating !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="comment" className="text-sm font-medium">
                                    Comments (Optional)
                                </Label>
                                <Textarea
                                    id="comment"
                                    value={form.comment}
                                    onChange={(e) => setForm(prev => ({ ...prev, comment: e.target.value }))}
                                    placeholder="Share your thoughts about the event..."
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button
                                onClick={handleSubmit}
                                className="w-full h-12 bg-[#0b2d66] hover:bg-[#1e40af] text-white font-medium"
                                disabled={!form.name.trim() || form.rating === 0}
                            >
                                Submit Evaluation
                            </Button>

                            <p className="text-xs text-center text-slate-500">
                                Your feedback helps us improve future events.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
