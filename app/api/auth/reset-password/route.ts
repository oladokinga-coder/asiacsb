import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const resetRow = await prisma.passwordResetToken.findUnique({
      where: { token: data.token },
      include: { user: true },
    });

    if (!resetRow || resetRow.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired link", errorKey: "errorInvalidResetToken" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRow.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetRow.userId },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.errors.find((x) => x.path.includes("password"))?.message;
      return NextResponse.json(
        {
          error: msg ?? "Invalid data",
          errorKey: msg?.includes("6") ? "errorPasswordMin" : "errorInvalidData",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Request failed", errorKey: "errorResetPassword" },
      { status: 500 }
    );
  }
}
