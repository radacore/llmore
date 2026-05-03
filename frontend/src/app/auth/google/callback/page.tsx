'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Suspense } from 'react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleGoogleCallback } = useAuthStore();

  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('Kode otorisasi tidak ditemukan. Silakan coba login kembali.');
      return;
    }

    const processCallback = async () => {
      try {
        await handleGoogleCallback(code);
        router.push('/dashboard');
      } catch {
        setError(
          'Gagal memproses login Google. Silakan coba lagi.'
        );
      }
    };

    processCallback();
  }, [searchParams, handleGoogleCallback, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Login Gagal
          </h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Bot className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">
            LLMore
          </span>
        </div>
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">
          Memproses login Google...
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Mohon tunggu sebentar
        </p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
