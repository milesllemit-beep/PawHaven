<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdoptionApplication;
use App\Models\Animal;
use App\Models\StrayReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Return aggregate moderation statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'users' => [
                'total' => User::count(),
                'admins' => User::where('role', User::ROLE_ADMIN)->count(),
                'regular' => User::where('role', User::ROLE_USER)->count(),
            ],
            'animals' => [
                'total' => Animal::count(),
                'available' => Animal::where('status', Animal::STATUS_AVAILABLE)->count(),
                'pending' => Animal::where('status', Animal::STATUS_PENDING)->count(),
                'adopted' => Animal::where('status', Animal::STATUS_ADOPTED)->count(),
            ],
            'stray_reports' => [
                'total' => StrayReport::count(),
                'lost' => StrayReport::where('type', StrayReport::TYPE_LOST)->count(),
                'found' => StrayReport::where('type', StrayReport::TYPE_FOUND)->count(),
                'injured' => StrayReport::where('type', StrayReport::TYPE_INJURED)->count(),
                'open' => StrayReport::where('status', StrayReport::STATUS_OPEN)->count(),
                'resolved' => StrayReport::where('status', StrayReport::STATUS_RESOLVED)->count(),
            ],
            'adoption_applications' => [
                'total' => AdoptionApplication::count(),
                'pending' => AdoptionApplication::where('status', AdoptionApplication::STATUS_PENDING)->count(),
                'approved' => AdoptionApplication::where('status', AdoptionApplication::STATUS_APPROVED)->count(),
                'rejected' => AdoptionApplication::where('status', AdoptionApplication::STATUS_REJECTED)->count(),
                'withdrawn' => AdoptionApplication::where('status', AdoptionApplication::STATUS_WITHDRAWN)->count(),
            ],
        ]);
    }
}
