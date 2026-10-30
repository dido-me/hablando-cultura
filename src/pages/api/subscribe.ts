import type { APIRoute } from "astro";
import { InvalidSubscriber, recordSubscriber } from "../../lib/subscribers";

export const prerender = false;

// Newsletter del blog: registra el correo en la API de cursos, que también envía el
// correo de bienvenida. El frontend ya no envía correos.
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

    await recordSubscriber({ email, source: "newsletter-blog" });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Te has suscrito exitosamente",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof InvalidSubscriber) {
      return new Response(
        JSON.stringify({ error: "Email no valido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Subscribe API error:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar la suscripcion" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
