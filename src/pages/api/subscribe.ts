import type { APIRoute } from "astro";
import { render } from "@react-email/render";
import SubscriptionEmail from "../../emails/SubscriptionEmail";
import { sendEmail } from "../../lib/email";
import { appendToSheet } from "../../lib/google-sheets";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "El email es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email no valido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Register in Google Sheets
    try {
      await appendToSheet("Suscriptores", [
        [email, new Date().toISOString(), "newsletter-blog"],
      ]);
    } catch (sheetError) {
      console.error("Google Sheets error:", sheetError);
    }

    // Send welcome email
    const html = await render(SubscriptionEmail({ email }));
    await sendEmail(
      email,
      "Bienvenido/a al newsletter de Hablando Cultura",
      html
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Te has suscrito exitosamente",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Subscribe API error:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar la suscripcion" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
