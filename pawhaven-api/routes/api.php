<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AdoptionApplicationController;
use App\Http\Controllers\Api\AnimalController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StrayReportController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/animals', [AnimalController::class, 'index']);
Route::get('/animals/{animal}', [AnimalController::class, 'show']);

Route::get('/stray-reports', [StrayReportController::class, 'index']);
Route::get('/stray-reports/{report}', [StrayReportController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/stray-reports', [StrayReportController::class, 'store']);
    Route::match(['put', 'patch', 'post'], '/stray-reports/{report}', [StrayReportController::class, 'update']);
    Route::delete('/stray-reports/{report}/photos/{photo}', [StrayReportController::class, 'destroyPhoto']);

    Route::get('/adoption-applications', [AdoptionApplicationController::class, 'index']);
    Route::post('/adoption-applications', [AdoptionApplicationController::class, 'store']);
    Route::get('/adoption-applications/{application}', [AdoptionApplicationController::class, 'show']);
    Route::post('/adoption-applications/{application}/withdraw', [AdoptionApplicationController::class, 'withdraw']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/animals', [AnimalController::class, 'store']);
    Route::match(['put', 'patch', 'post'], '/animals/{animal}', [AnimalController::class, 'update']);
    Route::delete('/animals/{animal}', [AnimalController::class, 'destroy']);
    Route::delete('/animals/{animal}/photos/{photo}', [AnimalController::class, 'destroyPhoto']);

    Route::delete('/stray-reports/{report}', [StrayReportController::class, 'destroy']);

    Route::get('/admin/adoption-applications', [AdoptionApplicationController::class, 'adminIndex']);
    Route::patch('/adoption-applications/{application}/review', [AdoptionApplicationController::class, 'review']);

    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::patch('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::get('/admin/stats', [DashboardController::class, 'stats']);
});
