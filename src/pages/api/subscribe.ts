import type { APIRoute } from "astro";
import { render } from "@react-email/render";
import SubscriptionEmail from "../../emails/SubscriptionEmail";
import { sendEmail } from "../../lib/email";
import { InvalidSubscriber, recordSubscriber } from "../../lib/subscribers";

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

    // Register in the course platform's subscribers list. If the API is down the
    // welcome email still goes out, as it did with Google Sheets.
    try {
      await recordSubscriber({ email, source: "newsletter-blog" });
    } catch (error) {
      if (error instanceof InvalidSubscriber) {
        return new Response(
          JSON.stringify({ error: "Email no valido" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      console.error("Subscribers API error:", error);
    }

    // Send welcome email
    const html = await render(SubscriptionEmail({ email }));
    await sendEmail(
      email,
      "Te damos la bienvenida al newsletter de Hablando Cultura",
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
