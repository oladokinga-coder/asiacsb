"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, UserPlus, Upload, Video, Camera } from "lucide-react";
import { useI18n } from "../components/LanguageProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";
import { COUNTRIES } from "@/lib/countries";

const PASSPORT_ACCEPT = "image/jpeg,image/png,image/webp";
const VIDEO_ACCEPT = "video/webm,video/mp4,video/quicktime";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passportSeries, setPassportSeries] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [country, setCountry] = useState("");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function handlePassportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPassportFile(f || null);
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setVideoFile(f || null);
  }

  async function startVideoSelfie() {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setRecording(true);
    } catch (err) {
      setError(t("errorNoCamera"));
    }
  }

  useEffect(() => {
    if (!recording || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [recording]);

  function stopVideoSelfie() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setRecording(false);
  }

  async function captureVideoSelfie() {
    if (!streamRef.current || !videoRef.current) return;
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";
    const options = mimeType ? { mimeType } : {};
    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const type = mediaRecorder.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const ext = type.includes("webm") ? "webm" : "mp4";
      setVideoFile(new File([blob], `selfie.${ext}`, { type }));
    };
    mediaRecorder.start(500);
    await new Promise((r) => setTimeout(r, 3000));
    mediaRecorder.stop();
    stopVideoSelfie();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== repeatPassword) {
      setError(t("errorPasswordsMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("errorPasswordMin"));
      return;
    }
    if (!country) {
      setError(t("errorSelectCountry"));
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("firstName", firstName.trim());
      formData.set("lastName", lastName.trim());
      formData.set("dateOfBirth", dateOfBirth);
      formData.set("passportSeries", passportSeries.trim());
      formData.set("passportNumber", passportNumber.trim());
      formData.set("email", email.trim());
      formData.set("password", password);
      formData.set("country", country);
      if (passportFile) formData.set("passport", passportFile);
      if (videoFile) formData.set("videoSelfie", videoFile);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errorKey ? t(data.errorKey) : (data.error || t("errorRegister"));
        setError(data.detail ? `${msg}: ${data.detail}` : msg);
        return;
      }
      router.push("/cabinet");
      router.refresh();
    } catch {
      setError(t("errorConnection"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="container flex items-center justify-between gap-2 h-14 sm:h-16 min-h-[56px]">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg sm:text-xl shrink-0 min-w-0">
            <Logo variant="full" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSwitcher />
            <Link href="/login" className="btn btn-secondary text-sm sm:text-base touch-manipulation">{t("navLogin")}</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-6">{t("registerTitle")}</h1>
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="input-group flex-1">
                <label>{t("firstName")}</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="input-group flex-1">
                <label>{t("lastName")}</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="input-group">
              <label>{t("dateOfBirth")}</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                autoComplete="bday"
              />
            </div>

            <div className="flex gap-4">
              <div className="input-group flex-1">
                <label>{t("passportSeries")}</label>
                <input
                  value={passportSeries}
                  onChange={(e) => setPassportSeries(e.target.value)}
                  placeholder="00 00"
                  required
                />
              </div>
              <div className="input-group flex-1">
                <label>{t("passportNumber")}</label>
                <input
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label>{t("password")} ({t("passwordMinHint")})</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="input-group">
              <label>{t("repeatPassword")}</label>
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label>{t("country")}</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]"
              >
                <option value="">{t("countryPlaceholder")}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>{t("uploadPassport")}</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-sm">
                  <Upload className="w-4 h-4" />
                  {passportFile ? passportFile.name : t("uploadFile")}
                  <input
                    type="file"
                    accept={PASSPORT_ACCEPT}
                    onChange={handlePassportChange}
                    className="hidden"
                  />
                </label>
                {passportFile && (
                  <span className="text-sm text-[var(--accent)]">✓ {t("uploaded")}</span>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>{t("videoSelfie")}</label>
              <p className="text-sm text-[var(--text-muted)] mb-2">{t("videoSelfieDesc")}</p>
              <div className="space-y-3">
                {!recording ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={startVideoSelfie}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        {t("recordVideo")}
                      </button>
                      <label className="btn btn-ghost flex items-center gap-2 cursor-pointer">
                        <Video className="w-4 h-4" />
                        {t("uploadFile")}
                        <input
                          type="file"
                          accept={VIDEO_ACCEPT}
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {videoFile && (
                      <p className="text-sm text-[var(--accent)]">✓ {videoFile.name}</p>
                    )}
                  </>
                ) : (
                  <div className="w-full max-w-sm">
                    <p className="text-sm text-[var(--text-muted)] mb-1.5 text-center">{t("videoSelfieFaceGuide")}</p>
                    <div className="relative w-full">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full rounded-[var(--radius)] bg-black aspect-video block"
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-[var(--radius)] overflow-hidden"
                        aria-hidden
                      >
                        <div
                          className="w-[70%] aspect-square rounded-full border-2 border-white/90 border-dashed bg-transparent"
                          style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={captureVideoSelfie}
                        className="btn btn-primary"
                      >
                        {t("recordSeconds")}
                      </button>
                      <button
                        type="button"
                        onClick={stopVideoSelfie}
                        className="btn btn-secondary"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-[var(--danger)] text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              <UserPlus className="w-4 h-4" />
              {loading ? t("registering") : t("submitRegister")}
            </button>
          </form>
          <p className="mt-6 text-center text-[var(--text-muted)] text-sm">
            {t("haveAccount")} <Link href="/login" className="text-[var(--accent)]">{t("navLogin")}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
