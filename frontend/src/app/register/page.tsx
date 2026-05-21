"use client";

import { useState, useEffect, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { AuthShell, BrandBullet } from "@/components/auth/AuthShell";
import {
  AuthInput,
  AuthDivider,
  GoogleButton,
  AuthError,
  AuthSubmit,
} from "@/components/auth/AuthFormUi";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isAuthenticated, isLoading } =
    useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      if (apiErr.response?.data?.errors) {
        const messages = Object.values(apiErr.response.data.errors).flat();
        setError(messages.join(" "));
      } else {
        setError(
          apiErr.response?.data?.message ||
            "Registrasi gagal. Silakan coba lagi.",
        );
      }
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const url = await loginWithGoogle();
      window.location.href = url;
    } catch {
      setError("Gagal memulai registrasi Google. Silakan coba lagi.");
    }
  };

  return (
    <AuthShell
      brandHeadline={
        <>
          Mulai bangun
          <br />
          aplikasi{" "}
          <span className="relative inline-block">
            <span className="relative z-10">AI</span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 h-3 bg-[#ffba09] -z-0"
            />
          </span>{" "}
          kamu.
        </>
      }
      brandSubcopy="Daftar dan mulai dengan paket berbasis credit. Bayar pakai QRIS, tanpa kartu kredit luar negeri."
      brandExtras={
        <div className="space-y-3">
          <BrandBullet>Paket Basic berisi 70.000 credit/bulan</BrandBullet>
          <BrandBullet>Akses model AI melalui credit bulanan</BrandBullet>
          <BrandBullet>Bayar pakai QRIS, bukan kartu kredit</BrandBullet>
        </div>
      }
    >
      <div>
        {/* Heading */}
        <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-2">
          Buat akun baru
        </p>
        <h1 className="text-washed-black font-bold text-[32px] md:text-[40px] leading-[1.1] tracking-tight mb-3">
          Daftar akun hari ini.
        </h1>
        <p className="text-[14px] text-dim-grey leading-[1.6]">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-[#1009f6] font-bold hover:underline"
          >
            Masuk di sini
          </Link>
        </p>

        {/* Google register */}
        <div className="mt-7">
          <GoogleButton onClick={handleGoogleRegister} disabled={isLoading}>
            Daftar dengan Google
          </GoogleButton>
        </div>

        <AuthDivider>atau pakai email</AuthDivider>

        {/* Error */}
        {error && <AuthError>{error}</AuthError>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            id="name"
            type="text"
            label="Nama lengkap"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="h-4 w-4" />}
            required
            autoComplete="name"
          />

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
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            required
            minLength={8}
            autoComplete="new-password"
            hint="Pakai kombinasi huruf, angka, dan simbol agar lebih aman."
          />

          <AuthInput
            id="password_confirmation"
            type="password"
            label="Konfirmasi password"
            placeholder="Ulangi password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <div className="pt-2">
            <AuthSubmit isLoading={isLoading} loadingLabel="Membuat akun...">
              Buat akun
            </AuthSubmit>
          </div>
        </form>

        <p className="mt-6 text-[11px] text-dim-grey text-center leading-[1.5]">
          Dengan mendaftar, kamu menyetujui{" "}
          <a href="#" className="text-washed-black font-bold hover:underline">
            Syarat &amp; Ketentuan
          </a>{" "}
          dan{" "}
          <a href="#" className="text-washed-black font-bold hover:underline">
            Kebijakan Privasi
          </a>{" "}
          kami.
        </p>
      </div>
    </AuthShell>
  );
}
