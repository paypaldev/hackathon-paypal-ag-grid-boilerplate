import { NextResponse } from "next/server";
import { checkPayPalHealth } from "@/lib/paypal-auth";
import { checkGeminiHealth } from "@/lib/gemini";
import { checkChannel3Health } from "@/lib/channel3";
import { checkMlServiceHealth } from "@/lib/ml-service-client";

export async function GET() {
  const start = performance.now();

  // Run all integration health checks concurrently
  const [paypalHealth, geminiHealth, channel3Health, mlHealth] = await Promise.all([
    checkPayPalHealth(),
    checkGeminiHealth(),
    checkChannel3Health(),
    checkMlServiceHealth(),
  ]);

  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  const webhookConfigured = Boolean(webhookId && !webhookId.startsWith("your_"));

  const webhookStatus = {
    status: webhookConfigured ? "configured" : "pending_registration",
    configured: webhookConfigured,
    webhookIdPreview: webhookConfigured && webhookId ? `${webhookId.slice(0, 4)}...${webhookId.slice(-4)}` : "not_configured",
    message: webhookConfigured
      ? "PayPal Webhook listener registered and ready to receive events."
      : "PAYPAL_WEBHOOK_ID is not configured in .env.local; operating in local sandbox simulation mode.",
    timestamp: new Date().toISOString(),
  };

  // Determine overall status
  const services = {
    paypal: paypalHealth,
    gemini: geminiHealth,
    channel3: channel3Health,
    ml_service: mlHealth,
    paypal_webhook: webhookStatus,
  };

  const totalLatencyMs = Math.round(performance.now() - start);

  return NextResponse.json({
    status: "ok",
    system: "VeriSettle AI — API Gateway & Policy Monitor",
    environment: process.env.NODE_ENV || "development",
    totalLatencyMs,
    timestamp: new Date().toISOString(),
    services,
  });
}

