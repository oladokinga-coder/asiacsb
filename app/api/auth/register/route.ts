import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { appendClientToSheet, isSheetsConfigured } from "@/lib/sheets";
import { sendRegistrationSuccessEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_PASSPORT_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;    // 50 MB;
const ALLOWED_PASSPORT = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/webm", "video/mp4", "video/quicktime"];

function getExt(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "video/webm") return ".webm";
  if (mime === "video/mp4") return ".mp4";
  if (mime === "video/quicktime") return ".mov";
  return "";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const dateOfBirthRaw = String(formData.get("dateOfBirth") ?? "");
    const passportSeries = String(formData.get("passportSeries") ?? "").trim();
    const passportNumber = String(formData.get("passportNumber") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const country = String(formData.get("country") ?? "").trim();
    const passportFile = formData.get("passport") as File | null;
    const videoFile = formData.get("videoSelfie") as File | null;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Введите имя и фамилию" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Некорректный email", errorKey: "errorInvalidEmail" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Пароль минимум 6 символов", errorKey: "errorPasswordMin" }, { status: 400 });
    }
    if (!dateOfBirthRaw) {
      return NextResponse.json({ error: "Укажите дату рождения" }, { status: 400 });
    }
    const dateOfBirth = new Date(dateOfBirthRaw);
    if (Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json({ error: "Некорректная дата рождения" }, { status: 400 });
    }
    if (!passportSeries || !passportNumber) {
      return NextResponse.json({ error: "Укажите серию и номер паспорта" }, { status: 400 });
    }
    if (!country) {
      return NextResponse.json({ error: "Выберите страну", errorKey: "errorSelectCountry" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже зарегистрирован", errorKey: "errorEmailExists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        dateOfBirth,
        passportSeries,
        passportNumber,
        country,
        passportPhotoPath: null,
        videoSelfiePath: null,
      },
    });

    const baseDir = path.join(process.cwd(), "public", "uploads");
    const passportDir = path.join(baseDir, "passport");
    const selfieDir = path.join(baseDir, "selfie");

    // Сохранение файлов — при ошибке (нет прав, read-only) не отменяем регистрацию
    if (passportFile && passportFile.size > 0) {
      if (passportFile.size > MAX_PASSPORT_SIZE) {
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json(
          { error: "Фото паспорта не должно превышать 10 МБ" },
          { status: 400 }
        );
      }
      const mime = passportFile.type;
      if (!ALLOWED_PASSPORT.includes(mime)) {
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json(
          { error: "Допустимые форматы фото: JPEG, PNG, WebP" },
          { status: 400 }
        );
      }
      try {
        await mkdir(passportDir, { recursive: true });
        const ext = getExt(mime) || ".jpg";
        const filename = `${user.id}${ext}`;
        const filePath = path.join(passportDir, filename);
        const buf = Buffer.from(await passportFile.arrayBuffer());
        await writeFile(filePath, buf);
        await prisma.user.update({
          where: { id: user.id },
          data: { passportPhotoPath: `/uploads/passport/${filename}` },
        });
      } catch (fileErr) {
        console.error("Passport file save error:", fileErr);
      }
    }

    if (videoFile && videoFile.size > 0 && videoFile.size <= MAX_VIDEO_SIZE) {
      const mime = videoFile.type;
      if (ALLOWED_VIDEO.includes(mime) || videoFile.name.endsWith(".webm")) {
        try {
          await mkdir(selfieDir, { recursive: true });
          const ext = getExt(mime) || ".webm";
          const filename = `${user.id}${ext}`;
          const filePath = path.join(selfieDir, filename);
          const buf = Buffer.from(await videoFile.arrayBuffer());
          await writeFile(filePath, buf);
          await prisma.user.update({
            where: { id: user.id },
            data: { videoSelfiePath: `/uploads/selfie/${filename}` },
          });
        } catch (fileErr) {
          console.error("Video selfie save error:", fileErr);
        }
      }
    }

    if (isSheetsConfigured()) {
      try {
        const birthDate = user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "";
        await appendClientToSheet(
          user.id,
          user.email,
          `${user.firstName} ${user.lastName}`,
          user.passportSeries ?? "",
          user.passportNumber ?? "",
          birthDate,
          user.country ?? ""
        );
      } catch (e) {
        console.error("Google Sheet append error:", e);
      }
    }

    await createSession(user.id);

    // Письмо об успешной регистрации на email клиента (если настроен SMTP)
    try {
      const result = await sendRegistrationSuccessEmail(user.email, user.firstName ?? "");
      if (!result.ok) console.error("Registration email failed:", result.error);
    } catch (e) {
      console.error("Registration email error:", e);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Ошибка регистрации", detail: message },
      { status: 500 }
    );
  }
}
