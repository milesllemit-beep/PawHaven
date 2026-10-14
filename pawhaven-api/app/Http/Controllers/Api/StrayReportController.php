<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStrayReportRequest;
use App\Http\Requests\UpdateStrayReportRequest;
use App\Http\Resources\StrayReportResource;
use App\Models\StrayReport;
use App\Models\StrayReportPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class StrayReportController extends Controller
{
    /**
     * List stray reports (lost, found, injured) with filtering.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'in:lost,found,injured'],
            'species' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:open,resolved,all'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $filters = collect($validated)->only(['search', 'type', 'species'])->all();

        $status = $validated['status'] ?? StrayReport::STATUS_OPEN;
        if ($status !== 'all') {
            $filters['status'] = $status;
        }

        $reports = StrayReport::query()
            ->filter($filters)
            ->with(['photos', 'reporter'])
            ->latest()
            ->paginate($validated['per_page'] ?? 12)
            ->withQueryString();

        return StrayReportResource::collection($reports);
    }

    /**
     * Show a single stray report.
     */
    public function show(StrayReport $report): StrayReportResource
    {
        $report->load(['photos', 'reporter']);

        return new StrayReportResource($report);
    }

    /**
     * File a new stray report.
     */
    public function store(StoreStrayReportRequest $request): JsonResponse
    {
        $report = StrayReport::create([
            ...$request->safe()->except('photos'),
            'reported_by' => $request->user()->id,
        ]);

        $this->storePhotos($report, $request->file('photos') ?? []);

        return (new StrayReportResource($report->load(['photos', 'reporter'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update a stray report the user owns (or any report if admin).
     */
    public function update(UpdateStrayReportRequest $request, StrayReport $report): StrayReportResource
    {
        Gate::authorize('update', $report);

        $report->update($request->safe()->except('photos'));

        $this->storePhotos($report, $request->file('photos') ?? []);

        return new StrayReportResource($report->load(['photos', 'reporter']));
    }

    /**
     * Delete a stray report (admins only).
     */
    public function destroy(StrayReport $report): JsonResponse
    {
        Gate::authorize('delete', $report);

        $report->delete();

        return response()->json(['message' => 'Report deleted.']);
    }

    /**
     * Delete a single photo from a report the user owns (or any if admin).
     */
    public function destroyPhoto(StrayReport $report, StrayReportPhoto $photo): JsonResponse
    {
        Gate::authorize('update', $report);
        abort_unless($photo->stray_report_id === $report->id, Response::HTTP_NOT_FOUND);

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['message' => 'Photo deleted.']);
    }

    /**
     * Persist uploaded photos for the given report.
     *
     * @param  array<int, UploadedFile>  $photos
     */
    private function storePhotos(StrayReport $report, array $photos): void
    {
        if ($photos === []) {
            return;
        }

        $order = (int) $report->photos()->max('sort_order');

        foreach ($photos as $photo) {
            $path = $photo->store('stray-reports', 'public');

            $report->photos()->create([
                'path' => $path,
                'sort_order' => ++$order,
            ]);
        }
    }
}
