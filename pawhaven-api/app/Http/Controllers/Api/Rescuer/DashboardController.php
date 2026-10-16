<?php

namespace App\Http\Controllers\Api\Rescuer;

use App\Http\Controllers\Controller;
use App\Http\Resources\RescueCasePhotoResource;
use App\Http\Resources\RescueCaseResource;
use App\Http\Resources\RescueMilestoneResource;
use App\Models\RescueCase;
use App\Models\RescueCasePhoto;
use App\Models\RescueMilestone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Return the authenticated rescuer's workspace summary.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $cases = RescueCase::query()->where('rescuer_id', $userId);
        $caseIds = (clone $cases)->select('id');

        return response()->json([
            'profile' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'phone' => $request->user()->phone,
                'location' => $request->user()->location,
                'member_since' => $request->user()->created_at,
            ],
            'stats' => [
                'total_rescued' => (clone $cases)->count(),
                'in_care' => (clone $cases)->where('status', RescueCase::STATUS_IN_CARE)->count(),
                'recovering' => (clone $cases)->where('status', RescueCase::STATUS_RECOVERING)->count(),
                'ready_for_adoption' => (clone $cases)->where('status', RescueCase::STATUS_READY_FOR_ADOPTION)->count(),
                'adopted' => (clone $cases)->where('status', RescueCase::STATUS_ADOPTED)->count(),
            ],
            'recent_cases' => RescueCaseResource::collection(
                (clone $cases)->with('primaryPhoto')->latest()->limit(5)->get()
            ),
            'recent_activity' => $this->recentActivity($caseIds),
            'recent_photos' => $this->recentPhotos($caseIds),
            'passport_highlights' => $this->passportHighlights($cases),
        ]);
    }

    /**
     * The most recent milestones recorded across the rescuer's cases.
     *
     * @param  Builder<RescueCase>  $caseIds
     * @return array<int, array<string, mixed>>
     */
    private function recentActivity($caseIds): array
    {
        return RescueMilestone::query()
            ->whereIn('rescue_case_id', $caseIds)
            ->with(['author', 'rescueCase:id,name,species'])
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(fn (RescueMilestone $milestone) => [
                ...(new RescueMilestoneResource($milestone->load('photos')))->resolve(),
                'case' => $milestone->rescueCase ? [
                    'id' => $milestone->rescueCase->id,
                    'name' => $milestone->rescueCase->name,
                    'species' => $milestone->rescueCase->species,
                ] : null,
            ])
            ->all();
    }

    /**
     * The most recently uploaded case photos.
     *
     * @param  Builder<RescueCase>  $caseIds
     * @return array<int, array<string, mixed>>
     */
    private function recentPhotos($caseIds): array
    {
        return RescueCasePhoto::query()
            ->whereIn('rescue_case_id', $caseIds)
            ->with('rescueCase:id,name,species')
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (RescueCasePhoto $photo) => [
                ...(new RescueCasePhotoResource($photo))->resolve(),
                'case' => $photo->rescueCase ? [
                    'id' => $photo->rescueCase->id,
                    'name' => $photo->rescueCase->name,
                    'species' => $photo->rescueCase->species,
                ] : null,
            ])
            ->all();
    }

    /**
     * Cases with recent milestones, for the Paw Progress Passport section.
     *
     * @param  Builder<RescueCase>  $cases
     * @return array<int, array<string, mixed>>
     */
    private function passportHighlights($cases): array
    {
        return (clone $cases)
            ->has('milestones')
            ->with(['primaryPhoto', 'milestones.photos', 'milestones.author'])
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(fn (RescueCase $case) => [
                'id' => $case->id,
                'name' => $case->name,
                'species' => $case->species,
                'status' => $case->status,
                'primary_photo' => $case->primaryPhoto
                    ? (new RescueCasePhotoResource($case->primaryPhoto))->resolve()
                    : null,
                'milestones_count' => $case->milestones->count(),
                'latest_milestone' => $case->milestones->first()
                    ? (new RescueMilestoneResource($case->milestones->first()))->resolve()
                    : null,
            ])
            ->all();
    }
}
