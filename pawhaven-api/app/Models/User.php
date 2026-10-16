<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'phone', 'location'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_USER = 'user';

    public const ROLE_RESCUER = 'rescuer';

    public const ROLE_ADMIN = 'admin';

    /**
     * Roles that may be self-selected during public registration.
     *
     * Administrators are intentionally excluded and must only be created
     * through a trusted seeder or a protected administrative process.
     *
     * @var array<int, string>
     */
    public const REGISTERABLE_ROLES = [self::ROLE_USER, self::ROLE_RESCUER];

    /**
     * Every role the application understands.
     *
     * @var array<int, string>
     */
    public const ROLES = [self::ROLE_USER, self::ROLE_RESCUER, self::ROLE_ADMIN];

    /**
     * Default attribute values for the model.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => self::ROLE_USER,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Determine whether the user is an administrator.
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Determine whether the user is a rescuer.
     */
    public function isRescuer(): bool
    {
        return $this->role === self::ROLE_RESCUER;
    }

    /**
     * The rescue cases owned by the user.
     *
     * @return HasMany<RescueCase, $this>
     */
    public function rescueCases(): HasMany
    {
        return $this->hasMany(RescueCase::class, 'rescuer_id');
    }
}
