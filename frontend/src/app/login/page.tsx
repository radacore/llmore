"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  AuthInput,
  AuthDivider,
  GoogleButton,
  AuthError,
  AuthSubmit,
} from "@/components/auth/AuthFormUi";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, isLoading, user } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated && user) {
      router.replace(user.role === "admin" ? "/dashboard/admin" : "/dashboard");
    }
  }, [hydrated, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      const currentUser = useAuthStore.getState().user;
      router.push(
        currentUser?.role === "admin" ? "/dashboard/admin" : "/dashboard",
      );
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(
        apiErr.response?.data?.message ||
          "Login gagal. Periksa email dan password kamu.",
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const url = await loginWithGoogle();
      window.location.href = url;
    } catch {
      setError("Gagal memulai login Google. Silakan coba lagi.");
    }
  };

  return (
    <AuthShell
      brandHeadline={
        <>
          Akses AI premium
          <br />
          dengan{" "}
          <span className="relative inline-block">
            <span className="relative z-10">mudah</span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 h-3 bg-[#ffba09] -z-0"
            />
          </span>
          .
        </>
      }
      brandSubcopy="Satu API gateway untuk berbagai model AI. Bayar dengan QRIS, virtual account, atau e-wallet — tanpa kartu kredit luar negeri."
    >
      <div>
        {/* Heading */}
        <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-2">
          Masuk ke akun
        </p>
        <h1 className="text-washed-black font-bold text-[32px] md:text-[40px] leading-[1.1] tracking-tight mb-3">
          Selamat datang kembali.
        </h1>
        <p className="text-[14px] text-dim-grey leading-[1.6]">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-[#1009f6] font-bold hover:underline"
          >
            Daftar gratis
          </Link>
        </p>

        {/* Google login */}
        <div className="mt-7">
          <GoogleButton onClick={handleGoogleLogin} disabled={isLoading}>
            Login dengan Google
          </GoogleButton>
        </div>

        <AuthDivider>atau pakai email</AuthDivider>

        {/* Error */}
        {error && <AuthError>{error}</AuthError>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            id="email"
            type="email"
            label="Email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            required
            autoComplete="email"
          />

          <AuthInput
            id="password"
            type="password"
            label="Password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            required
            autoComplete="current-password"
          />

          <div className="pt-2">
            <AuthSubmit isLoading={isLoading} loadingLabel="Memverifikasi...">
              Masuk
            </AuthSubmit>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
