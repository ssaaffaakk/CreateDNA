import { NextRequest, NextResponse } from "next/server";
import { analyzeImage, generateText } from "@/lib/granite";

export async function GET() {
  try {
    const result = await generateText(
      "You are a helpful assistant.",
      "Say hello and confirm you are IBM Granite 4.1. Reply in one sentence."
    );
    return NextResponse.json({ status: "ok", model: "granite-4-1-8b-instruct", response: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64 } = body as { imageBase64: string };

    if (!imageBase64) {
      return NextResponse.json({ error: "No imageBase64 provided" }, { status: 400 });
    }

    const prompt = `Describe this image in detail. What style, colors, composition, and mood do you see? Be specific.`;
    const result = await analyzeImage(imageBase64, prompt);

    return NextResponse.json({
      status: "ok",
      model: "granite-vision-4-1-4b",
      response: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
