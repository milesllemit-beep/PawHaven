<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\RescueCaseController as AdminRescueCaseController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AdoptionApplicationController;
use App\Http\Controllers\Api\AnimalController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Rescuer\DashboardController as RescuerDashboardController;
use App\Http\Controllers\Api\Rescuer\RescueCaseController as RescuerRescueCaseController;
use App\Http\Controllers\Api\Rescuer\RescueMilestoneController as RescuerRescueMilestoneController;
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

Route::middleware(['auth:sanctum', 'role:rescuer'])->prefix('rescuer')->group(function () {
    Route::get('/dashboard', [RescuerDashboardController::class, 'index']);

    Route::get('/cases', [RescuerRescueCaseController::class, 'index']);
    Route::post('/cases', [RescuerRescueCaseController::class, 'store']);
    Route::get('/cases/{case}', [RescuerRescueCaseController::class, 'show']);
    Route::match(['put', 'patch', 'post'], '/cases/{case}', [RescuerRescueCaseController::class, 'update']);
    Route::patch('/cases/{case}/status', [RescuerRescueCaseController::class, 'updateStatus']);
    Route::delete('/cases/{case}', [RescuerRescueCaseController::class, 'destroy']);

    Route::post('/cases/{case}/photos', [RescuerRescueCaseController::class, 'storePhoto']);
    Route::delete('/cases/{case}/photos/{photo}', [RescuerRescueCaseController::class, 'destroyPhoto']);

    Route::post('/cases/{case}/milestones', [RescuerRescueMilestoneController::class, 'store']);
    Route::match(['put', 'patch', 'post'], '/cases/{case}/milestones/{milestone}', [RescuerRescueMilestoneController::class, 'update'])->scopeBindings();
    Route::delete('/cases/{case}/milestones/{milestone}', [RescuerRescueMilestoneController::class, 'destroy'])->scopeBindings();
    Route::delete('/cases/{case}/milestones/{milestone}/photos/{photo}', [RescuerRescueMilestoneController::class, 'destroyPhoto'])->scopeBindings();
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/rescue-cases', [AdminRescueCaseController::class, 'index']);
    Route::get('/admin/rescue-cases/{case}', [AdminRescueCaseController::class, 'show']);
    Route::patch('/admin/rescue-cases/{case}/status', [AdminRescueCaseController::class, 'updateStatus']);
    Route::patch('/admin/rescue-cases/{case}/publish', [AdminRescueCaseController::class, 'publish']);

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
