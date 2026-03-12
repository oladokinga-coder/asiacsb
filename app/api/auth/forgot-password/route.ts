import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const RESET_TOKEN_EXPIRY_HOURS = 1;

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const { ok, error } = await sendPasswordResetEmail(
      user.email,
      token,
      user.firstName
    );
    if (!ok) {
      console.error("Forgot password email failed:", error);
      return NextResponse.json(
        { error: "Failed to send email", errorKey: "errorForgotPasswordEmail" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message ?? "Invalid data", errorKey: "errorInvalidData" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Request failed", errorKey: "errorForgotPassword" },
      { status: 500 }
    );
  }
}
