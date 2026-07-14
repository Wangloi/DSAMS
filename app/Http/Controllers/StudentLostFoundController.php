<?php

namespace App\Http\Controllers;

use App\Models\FoundItem;
use App\Models\LostReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class StudentLostFoundController extends Controller
{
    protected function studentIdentifier(): ?string
    {
        $user = auth()->user();
        if (is_object($user) && isset($user->student_id)) {
            return (string) $user->student_id;
        }
        if (is_object($user) && isset($user->id)) {
            return (string) $user->id;
        }

        return null;
    }

    public function foundItems(Request $request): JsonResponse
    {
        $studentIdentifier = $this->studentIdentifier();

        $items = FoundItem::query()
            ->where('is_archived', false)
            ->where(function ($q) {
                $q->whereNull('status')
                    ->orWhereIn('status', ['Unclaimed', 'In Storage']);
            })
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (FoundItem $item) {
                $dateFound = $item->date_found ? Carbon::parse($item->date_found) : null;
                $timeFound = $item->time_found ? Carbon::parse($item->time_found) : null;

                return [
                    'id' => $item->id,
                    'title' => $item->item_description,
                    'foundAt' => trim(($dateFound ? $dateFound->format('M d, Y') : '') . ($timeFound ? (' at ' . $timeFound->format('h:i A')) : '')),
                    'location' => $item->place_found,
                    'foundBy' => $item->finder_name,
                    'status' => $item->status,
                    'imageUrl' => $item->image_path ? Storage::url($item->image_path) : null,
                ];
            });

        $myClaims = FoundItem::query()
            ->where('claimed_by', $studentIdentifier)
            ->orderByDesc('claimed_at')
            ->get()
            ->map(function (FoundItem $item) {
                $dateFound = $item->date_found ? Carbon::parse($item->date_found) : null;
                $timeFound = $item->time_found ? Carbon::parse($item->time_found) : null;

                return [
                    'id' => $item->id,
                    'title' => $item->item_description,
                    'foundAt' => trim(($dateFound ? $dateFound->format('M d, Y') : '') . ($timeFound ? (' at ' . $timeFound->format('h:i A')) : '')),
                    'location' => $item->place_found,
                    'foundBy' => $item->finder_name,
                    'status' => $item->status,
                    'contactInfo' => $item->contact_info,
                    'imageUrl' => $item->image_path ? Storage::url($item->image_path) : null,
                    'claimedAt' => $item->claimed_at ? Carbon::parse($item->claimed_at)->format('M d, Y') : null,
                    'adminNotes' => $item->admin_notes,
                ];
            });

        return response()->json([
            'items' => $items,
            'myClaims' => $myClaims
        ]);
    }

    public function myLostReports(Request $request): JsonResponse
    {
        $studentIdentifier = $this->studentIdentifier();
        if (!$studentIdentifier) {
            return response()->json(['items' => []]);
        }

        $items = LostReport::query()
            ->where('student_identifier', $studentIdentifier)
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (LostReport $report) {
                $dateLost = $report->date_lost ? Carbon::parse($report->date_lost) : null;
                $timeLost = $report->time_lost ? Carbon::parse($report->time_lost) : null;

                return [
                    'id' => $report->id,
                    'title' => $report->item_description,
                    'lostAt' => trim(($dateLost ? $dateLost->format('M d, Y') : '') . ($timeLost ? (' at ' . $timeLost->format('h:i A')) : '')),
                    'location' => $report->last_seen_location,
                    'contactInfo' => $report->contact_info,
                    'status' => $report->status,
                    'imageUrl' => $report->image_path ? Storage::url($report->image_path) : null,
                ];
            });

        return response()->json(['items' => $items]);
    }

    public function storeLostReport(Request $request): RedirectResponse
    {
        $studentIdentifier = $this->studentIdentifier();
        if (!$studentIdentifier) {
            return redirect()->back()->with('error', 'Unable to identify student.');
        }

        $validated = $request->validate([
            'item_description' => ['required', 'string'],
            'date_lost' => ['required', 'date'],
            'time_lost' => ['nullable', 'date_format:H:i'],
            'last_seen_location' => ['required', 'string', 'max:255'],
            'contact_info' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('lost-reports', 'public');
        }

        LostReport::create([
            'student_identifier' => $studentIdentifier,
            'item_description' => $validated['item_description'],
            'date_lost' => $validated['date_lost'],
            'time_lost' => $validated['time_lost'] ?? null,
            'last_seen_location' => $validated['last_seen_location'],
            'contact_info' => $validated['contact_info'] ?? null,
            'image_path' => $imagePath,
            'status' => 'Pending',
        ]);

        return redirect()->back()->with('success', 'Lost item report submitted.');
    }

    public function storeFoundItem(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'date_found' => ['required', 'date'],
            'time_found' => ['required', 'date_format:H:i'],
            'item_description' => ['required', 'string'],
            'place_found' => ['required', 'string', 'max:255'],
            'contact_info' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('found-items', 'public');
        }

        $finderName = null;
        $program = null;
        $yearLevel = null;

        if (is_object($user)) {
            $finderName = isset($user->name) ? (string) $user->name : null;
            $program = isset($user->program) ? (string) $user->program : null;
            $yearLevel = isset($user->year_level) ? (string) $user->year_level : null;
        }

        FoundItem::create([
            'date_found' => $validated['date_found'],
            'time_found' => $validated['time_found'],
            'item_description' => $validated['item_description'],
            'place_found' => $validated['place_found'],
            'finder_name' => $finderName ?: 'Student',
            'contact_info' => $validated['contact_info'] ?? null,
            'program' => $program ?: '—',
            'year_level' => $yearLevel ?: '—',
            'image_path' => $imagePath,
            'status' => 'In Storage',
            'is_archived' => false,
        ]);

        return redirect()->back()->with('success', 'Found item reported successfully.');
    }

    public function claim(Request $request, FoundItem $foundItem): RedirectResponse
    {
        if ($foundItem->is_archived) {
            return redirect()->back()->with('error', 'Item is not available.');
        }

        $status = $foundItem->status ? (string) $foundItem->status : '';

        if ($status === 'Claimed') {
            return redirect()->back()->with('error', 'Item has already been claimed.');
        }

        if ($status === 'Verification Pending') {
            return redirect()->back()->with('error', 'Claim is already pending verification.');
        }

        if ($status !== '' && !in_array($status, ['Unclaimed', 'In Storage'], true)) {
            return redirect()->back()->with('error', 'Item is not available for claiming.');
        }

        $studentIdentifier = $this->studentIdentifier();

        $foundItem->update([
            'status' => 'Verification Pending',
            'claimed_by' => $studentIdentifier,
            'claimed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Claim submitted. Please wait for verification.');
    }
}
