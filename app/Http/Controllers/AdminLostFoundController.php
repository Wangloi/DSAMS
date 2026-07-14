<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FoundItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminLostFoundController extends Controller
{
    public function index()
    {
        $foundItems = FoundItem::where('is_archived', false)->orderByDesc('id')->get()->map(function ($item) {
            $dateFound = $item->date_found ? Carbon::parse($item->date_found) : null;
            $timeFound = $item->time_found ? Carbon::parse($item->time_found) : null;

            return [
                'id' => $item->id,
                'title' => $item->item_description,
                'foundAt' => ($dateFound ? $dateFound->format('M d, Y') : '') . ' at ' . ($timeFound ? $timeFound->format('H:i') : ''),
                'dateFound' => $dateFound ? $dateFound->format('Y-m-d') : null,
                'timeFound' => $timeFound ? $timeFound->format('H:i') : null,
                'location' => $item->place_found,
                'status' => $item->status,
                'imageUrl' => $item->image_path ? Storage::url($item->image_path) : null,
            ];
        });

        // Compute real-time KPIs/statistics
        $totalItems = $foundItems->count();
        $statusCounts = $foundItems->groupBy('status')->map->count();
        $stats = [
            'totalItems' => $totalItems,
            'unclaimed' => $statusCounts->get('Unclaimed', 0),
            'claimed' => $statusCounts->get('Claimed', 0),
            'pending' => $statusCounts->get('Verification Pending', 0),
            'inStorage' => $statusCounts->get('In Storage', 0),
        ];

        return Inertia::render('admin-dashboard/lost-found/index', [
            'foundItems' => $foundItems,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date_found' => 'required|date',
            'time_found' => 'required|date_format:H:i',
            'item_description' => 'required|string',
            'place_found' => 'required|string',
            'finder_name' => 'required|string',
            'contact_info' => 'nullable|string',
            'program' => 'required|string',
            'year_level' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('found-items', 'public');
        }

        $item = FoundItem::create([
            'date_found' => $validated['date_found'],
            'time_found' => $validated['time_found'],
            'item_description' => $validated['item_description'],
            'place_found' => $validated['place_found'],
            'finder_name' => $validated['finder_name'],
            'contact_info' => $validated['contact_info'],
            'program' => $validated['program'],
            'year_level' => $validated['year_level'],
            'image_path' => $imagePath,
            'status' => 'In Storage',
        ]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Lost & Found', 'Created', 'Added found item #' . (string) $item->id);
        }

        return redirect()->back()->with('success', 'Found item added successfully.');
    }

    public function update(Request $request, FoundItem $foundItem)
    {
        $validated = $request->validate([
            'date_found' => 'required|date',
            'time_found' => 'required|date_format:H:i',
            'item_description' => 'required|string',
            'place_found' => 'required|string',
            'finder_name' => 'required|string',
            'contact_info' => 'nullable|string',
            'program' => 'required|string',
            'year_level' => 'required|string',
            'status' => 'required|in:Claimed,In Storage,Verification Pending,Unclaimed',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $imagePath = $foundItem->image_path;
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $request->file('image')->store('found-items', 'public');
        }

        $foundItem->update([
            'date_found' => $validated['date_found'],
            'time_found' => $validated['time_found'],
            'item_description' => $validated['item_description'],
            'place_found' => $validated['place_found'],
            'finder_name' => $validated['finder_name'],
            'contact_info' => $validated['contact_info'],
            'program' => $validated['program'],
            'year_level' => $validated['year_level'],
            'image_path' => $imagePath,
            'status' => $validated['status'],
        ]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Lost & Found', 'Updated', 'Updated found item #' . (string) $foundItem->id);
        }

        return redirect()->back()->with('success', 'Found item updated successfully.');
    }

    public function destroy(FoundItem $foundItem)
    {
        $foundItem->update(['is_archived' => true]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Lost & Found', 'Archived', 'Archived found item #' . (string) $foundItem->id);
        }

        return redirect()->back()->with('success', 'Found item archived successfully.');
    }

    public function archive(FoundItem $foundItem): RedirectResponse
    {
        $foundItem->update(['is_archived' => true]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Lost & Found', 'Archived', 'Archived found item #' . (string) $foundItem->id);
        }

        return redirect()->back()->with('success', 'Found item archived successfully.');
    }

    public function unarchive(FoundItem $foundItem): RedirectResponse
    {
        $foundItem->update(['is_archived' => false]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Lost & Found', 'Unarchived', 'Unarchived found item #' . (string) $foundItem->id);
        }

        return redirect()->back()->with('success', 'Found item unarchived successfully.');
    }
}
