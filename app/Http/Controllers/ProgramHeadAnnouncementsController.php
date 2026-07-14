<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramHeadAnnouncementsController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::query()
            ->where('is_archived', false)
            ->where(function ($query) {
                $query->where('target_audience', 'all')
                    ->orWhere('target_audience', 'student')
                    ->orWhere('target_audience', 'head');
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($a) {
                $status = $a->status ?? 'Published';
                if ($a->is_archived) {
                    $status = 'Archived';
                }
                if ($a->scheduled_at && $a->scheduled_at->isFuture()) {
                    $status = 'Scheduled';
                }

                $fullDate = null;
                if ($a->event_date) {
                    $eventTime = $a->event_time ?? '00:00';
                    $fullDate = Carbon::parse($a->event_date.' '.$eventTime)->format('Y-m-d H:i');
                } else {
                    $fullDate = $a->created_at->format('Y-m-d H:i');
                }

                return [
                    'id' => (string) $a->id,
                    'title' => (string) $a->title,
                    'content' => (string) $a->content,
                    'category' => (string) $a->category,
                    'status' => $status,
                    'date' => $a->created_at->format('M d'),
                    'full_date' => $fullDate,
                    'views' => (int) $a->views,
                ];
            });

        $stats = [
            'totalAnnouncements' => $announcements->count(),
            'totalViews' => $announcements->sum('views'),
            'active' => $announcements->where('status', 'Published')->count(),
            'scheduled' => $announcements->where('status', 'Scheduled')->count(),
            'archived' => $announcements->where('status', 'Archived')->count(),
        ];

        return Inertia::render('program-head/Announcements', [
            'announcements' => $announcements,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'category' => ['required', 'string'],
            'status' => ['required', 'string'],
            'target_audience' => ['required', 'string'],
        ]);

        $announcement = Announcement::create($validated);
        app(StudentNotificationDispatcher::class)->announcementCreated($announcement);

        return redirect()->back()->with('success', 'Announcement created successfully.');
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'category' => ['required', 'string'],
            'status' => ['required', 'string'],
            'target_audience' => ['required', 'string'],
        ]);

        $announcement->update($validated);

        return redirect()->back()->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return redirect()->back()->with('success', 'Announcement deleted successfully.');
    }
}
