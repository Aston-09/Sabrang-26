import { NextRequest, NextResponse } from "next/server";
import { verifyReCaptchaToken } from "@/lib/recaptcha";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  subject: z.string().trim().min(1, "Please select a subject"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 },
      );
    }

    const { name, email, subject, message, recaptchaToken } = parsed.data;

    // Verify Google reCAPTCHA v3
    if (recaptchaToken) {
      const captchaResult = await verifyReCaptchaToken(
        recaptchaToken,
        "contact_form",
        0.5,
      );

      if (!captchaResult.success) {
        return NextResponse.json(
          { error: "Security check failed. Please refresh and try again." },
          { status: 403 },
        );
      }
    } else if (process.env.NODE_ENV === "production" && process.env.RECAPTCHA_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing reCAPTCHA token." },
        { status: 400 },
      );
    }

    // Process contact submission (e.g. logging, database, or notification)
    console.info(`[Contact Form] Submission received from ${name} <${email}> [${subject}]`);

    return NextResponse.json({
      success: true,
      message: "Thank you! Your message has been received.",
    });
  } catch (error: unknown) {
    console.error("[Contact API Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
