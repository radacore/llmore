<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URL', 'http://localhost:8000/api/auth/google/callback'),
    ],

    'klikqris' => [
        'api_key' => env('KLIKQRIS_API_KEY'),
        'merchant_id' => env('KLIKQRIS_MERCHANT_ID'),
        'webhook_url' => env('KLIKQRIS_WEBHOOK_URL', 'http://localhost:8000/api/payment/webhook'),
    ],

    'upstream' => [
        'api_key' => env('UPSTREAM_API_KEY'),
        'api_url' => env('UPSTREAM_API_URL', 'http://llm-proxy:9898/v1'),
    ],

];
