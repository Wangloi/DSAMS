<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Services\StudentNotificationDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminAnnouncementController extends Controller
{
    public function index()
    {
        $announcements = [];
        $stats = [
            'totalAnnouncements' => 0,
            'totalViews' => 0,
            'active' => 0,
            'scheduled' => 0,
            'archived' => 0,
        ];

        if (Schema::hasTable('announcements')) {
            $columns = Schema::getColumnListing('announcements');
            $hasStatus = in_array('status', $columns, true);
            $hasIsArchived = in_array('is_archived', $columns, true);
            $hasScheduledAt = in_array('scheduled_at', $columns, true) || in_array('publish_at', $columns, true);
            $scheduledAtColumn = in_array('scheduled_at', $columns, true) ? 'scheduled_at' : (in_array('publish_at', $columns, true) ? 'publish_at' : null);
            $viewsColumn = null;
            foreach (['views', 'view_count', 'total_views'] as $candidate) {
                if (in_array($candidate, $columns, true)) {
                    $viewsColumn = $candidate;
                    break;
                }
            }

            $select = array_values(array_filter([
                'id',
                'title',
                in_array('category', $columns, true) ? 'category' : null,
                $hasStatus ? 'status' : null,
                $hasIsArchived ? 'is_archived' : null,
                $scheduledAtColumn,
                $viewsColumn,
                in_array('event_date', $columns, true) ? 'event_date' : null,
                in_array('created_at', $columns, true) ? 'created_at' : null,
                in_array('updated_at', $columns, true) ? 'updated_at' : null,
            ]));

            $rows = Announcement::query()->orderByDesc('id')->get($select);

            $announcements = $rows->map(function ($a) use ($hasStatus, $hasIsArchived, $scheduledAtColumn, $viewsColumn) {
                $status = $hasStatus ? (string) ($a->status ?? 'Published') : 'Published';
                if ($hasIsArchived && (bool) ($a->is_archived ?? false)) {
                    $status = 'Archived';
                }
                if ($scheduledAtColumn && ! empty($a->{$scheduledAtColumn})) {
                    if (in_array(strtolower($status), ['published', 'draft', ''], true)) {
                        $status = 'Scheduled';
                    }
                }

                $category = (string) (($a->category ?? '') ?: 'General');
                if (! in_array($category, ['Event', 'Discipline', 'Lost & Found', 'General'], true)) {
                    $category = 'General';
                }

                return [
                    'id' => (string) $a->id,
                    'title' => (string) ($a->title ?? ''),
                    'category' => $category,
                    'status' => $status,
                    'date' => ! empty($a->event_date)
                        ? Carbon::parse($a->event_date)->format('M d')
                        : (optional($a->created_at)->format('M d') ?? ''),
                    'views' => $viewsColumn ? (int) ($a->{$viewsColumn} ?? 0) : 0,
                ];
            })->values();

            $stats['totalAnnouncements'] = (int) $announcements->count();
            $stats['totalViews'] = (int) ($viewsColumn
                ? (int) DB::table('announcements')->sum($viewsColumn)
                : (int) $announcements->sum('views'));
            $stats['active'] = (int) $announcements->where('status', 'Published')->count();
            $stats['scheduled'] = (int) $announcements->where('status', 'Scheduled')->count();
            $stats['archived'] = (int) $announcements->where('status', 'Archived')->count();
        }

        return Inertia::render('admin-dashboard/announcement/index', [
            'announcements' => $announcements,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'event_time' => ['nullable'],
            'target_audience' => ['nullable', 'string', 'max:255'],
        ]);

        if (! Schema::hasTable('announcements')) {
            return redirect()->back()->with('error', 'Announcements table is missing.')->setStatusCode(303);
        }

        $data = [
            'title' => $validated['title'],
            'content' => $validated['content'] ?? '',
            'target_audience' => $validated['target_audience'] ?? 'student',
        ];

        $columns = Schema::getColumnListing('announcements');
        foreach (['category', 'status', 'event_date', 'event_time'] as $field) {
            if (in_array($field, $columns, true) && isset($validated[$field])) {
                $data[$field] = $validated[$field];
            }
        }

        $announcement = Announcement::create($data);
        app(StudentNotificationDispatcher::class)->announcementCreated($announcement);

        return redirect()->back()->with('success', 'Announcement created.')->setStatusCode(303);
    }

    public function show(Announcement $announcement)
    {
        return response()->json($announcement);
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'event_time' => ['nullable'],
            'target_audience' => ['nullable', 'string', 'max:255'],
        ]);

        $data = [
            'title' => $validated['title'],
            'content' => $validated['content'] ?? '',
            'target_audience' => $validated['target_audience'] ?? 'student',
        ];

        $columns = Schema::getColumnListing('announcements');
        foreach (['category', 'status', 'event_date', 'event_time'] as $field) {
            if (in_array($field, $columns, true) && isset($validated[$field])) {
                $data[$field] = $validated[$field];
            }
        }

        $announcement->update($data);

        return redirect()->back()->with('success', 'Announcement updated.')->setStatusCode(303);
    }

    public function archive(Announcement $announcement): RedirectResponse
    {
        $columns = Schema::getColumnListing('announcements');

        if (in_array('is_archived', $columns, true)) {
            $announcement->update(['is_archived' => true]);
        } elseif (in_array('status', $columns, true)) {
            $announcement->update(['status' => 'Archived']);
        }

        return redirect()->back()->with('success', 'Announcement archived.')->setStatusCode(303);
    }

    public function unarchive(Announcement $announcement): RedirectResponse
    {
        $columns = Schema::getColumnListing('announcements');

        if (in_array('is_archived', $columns, true)) {
            $announcement->update(['is_archived' => false]);
        } elseif (in_array('status', $columns, true)) {
            $announcement->update(['status' => 'Published']);
        }

        return redirect()->back()->with('success', 'Announcement restored.')->setStatusCode(303);
    }
}
