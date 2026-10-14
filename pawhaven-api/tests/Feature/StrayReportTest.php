<?php

namespace Tests\Feature;

use App\Models\StrayReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StrayReportTest extends TestCase
{
    use RefreshDatabase;

    private function png(): UploadedFile
    {
        $content = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        );

        return UploadedFile::fake()->createWithContent('photo.png', $content);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'type' => StrayReport::TYPE_LOST,
            'species' => 'dog',
            'description' => 'Brown dog missing near the park.',
            'location' => 'Central Park',
            'contact_name' => 'Jane Doe',
            'contact_phone' => '555-0100',
        ], $overrides);
    }

    public function test_public_can_list_and_filter_reports_by_type(): void
    {
        StrayReport::factory()->create(['type' => StrayReport::TYPE_LOST, 'location' => 'Central Park', 'description' => 'Missing dog.']);
        StrayReport::factory()->create(['type' => StrayReport::TYPE_FOUND, 'location' => 'Riverside', 'description' => 'Found cat.']);
        StrayReport::factory()->create(['type' => StrayReport::TYPE_INJURED, 'location' => 'Downtown', 'description' => 'Injured bird.']);

        $this->getJson('/api/stray-reports')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'type', 'species', 'location', 'status', 'photos']],
                'meta',
                'links',
            ]);

        $this->getJson('/api/stray-reports?type=injured')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', StrayReport::TYPE_INJURED);

        $this->getJson('/api/stray-reports?search=Park')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_listing_defaults_to_open_and_supports_all(): void
    {
        StrayReport::factory()->create(['status' => StrayReport::STATUS_OPEN]);
        StrayReport::factory()->create(['status' => StrayReport::STATUS_RESOLVED]);

        $this->getJson('/api/stray-reports')->assertJsonCount(1, 'data');
        $this->getJson('/api/stray-reports?status=resolved')->assertJsonCount(1, 'data');
        $this->getJson('/api/stray-reports?status=all')->assertJsonCount(2, 'data');
    }

    public function test_guest_cannot_file_a_report(): void
    {
        $this->postJson('/api/stray-reports', $this->payload())->assertUnauthorized();
    }

    public function test_authenticated_user_can_file_a_report_with_a_photo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->post('/api/stray-reports', [
            ...$this->payload(['type' => StrayReport::TYPE_INJURED]),
            'photos' => [$this->png()],
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.type', StrayReport::TYPE_INJURED)
            ->assertJsonPath('data.status', StrayReport::STATUS_OPEN)
            ->assertJsonPath('data.reporter.id', $user->id);

        $report = StrayReport::first();
        $this->assertSame($user->id, $report->reported_by);
        $this->assertDatabaseCount('stray_report_photos', 1);

        // Stray reports must never create an adoptable animal.
        $this->assertDatabaseCount('animals', 0);
    }

    public function test_filing_a_report_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/stray-reports', ['type' => 'invalid'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'type', 'species', 'description', 'location', 'contact_name', 'contact_phone',
            ]);
    }

    public function test_owner_can_update_their_report_but_others_cannot(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $report = StrayReport::factory()->create(['reported_by' => $owner->id]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/stray-reports/{$report->id}", ['status' => StrayReport::STATUS_RESOLVED])
            ->assertOk()
            ->assertJsonPath('data.status', StrayReport::STATUS_RESOLVED);

        $this->actingAs($other, 'sanctum')
            ->patchJson("/api/stray-reports/{$report->id}", ['status' => StrayReport::STATUS_OPEN])
            ->assertForbidden();
    }

    public function test_only_admins_can_delete_reports(): void
    {
        $owner = User::factory()->create();
        $report = StrayReport::factory()->create(['reported_by' => $owner->id]);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/stray-reports/{$report->id}")
            ->assertForbidden();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/stray-reports/{$report->id}")
            ->assertOk();

        $this->assertSoftDeleted('stray_reports', ['id' => $report->id]);
    }
}
