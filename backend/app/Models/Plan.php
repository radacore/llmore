<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    /**
     * Official pricing shown on the public landing cards and admin plan table.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function officialPricingPlans(): array
    {
        return [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'description' => 'Untuk mulai integrasi AI dengan budget ringan.',
                'price' => 49000,
                'token_quota' => 70000,
                'rate_limit_per_minute' => 30,
                'max_api_keys' => 1,
                'features' => [
                    'Cocok untuk eksperimen produk dan side project',
                    'Akses model AI melalui satu gateway',
                    'Top up credit kapan saja saat kebutuhan naik',
                ],
                'is_active' => true,
                'is_official' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Pilihan populer untuk aplikasi yang mulai aktif.',
                'price' => 99000,
                'token_quota' => 150000,
                'rate_limit_per_minute' => 60,
                'max_api_keys' => 3,
                'features' => [
                    'Credit lebih lega untuk penggunaan harian',
                    'API key terpisah untuk tim atau environment',
                    'Rate limit lebih nyaman untuk produk produksi',
                ],
                'is_active' => true,
                'is_official' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Advance',
                'slug' => 'advance',
                'description' => 'Untuk traffic tinggi dan banyak integrasi.',
                'price' => 199000,
                'token_quota' => 320000,
                'rate_limit_per_minute' => 120,
                'max_api_keys' => 10,
                'features' => [
                    'Kuota credit terbesar untuk workload intensif',
                    'Banyak API key untuk beberapa proyek sekaligus',
                    'Batas request paling lega untuk skala tim',
                ],
                'is_active' => true,
                'is_official' => true,
                'sort_order' => 3,
            ],
        ];
    }

    /**
     * Sinkronkan plan resmi dengan officialPricingPlans().
     *
     * - Hanya plan dengan is_official=true yang dievaluasi (plan custom
     *   buatan admin TIDAK pernah disentuh di sini).
     * - Slug official yang sudah hilang dari array kode otomatis dinonaktifkan.
     * - Slug official yang masih ada di array kode di-upsert dengan
     *   atribut terbaru (harga, kuota, dll) supaya source of truth = kode.
     */
    public static function syncOfficialPricingPlans(): void
    {
        $plans = self::officialPricingPlans();
        $officialSlugs = array_column($plans, 'slug');

        self::query()
            ->where('is_official', true)
            ->whereNotIn('slug', $officialSlugs)
            ->update(['is_active' => false]);

        foreach ($plans as $plan) {
            self::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }

    /**
     * @return array<int, string>
     */
    public static function officialPricingSlugs(): array
    {
        return array_column(self::officialPricingPlans(), 'slug');
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'token_quota',
        'rate_limit_per_minute',
        'max_api_keys',
        'features',
        'is_active',
        'is_official',
        'sort_order',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'token_quota' => 'integer',
            'rate_limit_per_minute' => 'integer',
            'max_api_keys' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
            'is_official' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * Plan memiliki banyak subscriptions.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Plan memiliki banyak transactions.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /**
     * Scope untuk plan yang aktif saja.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
