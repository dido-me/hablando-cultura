import type { APIRoute } from "astro";
import { render } from "@react-email/render";
import EbookEmail from "../../emails/EbookEmail";
import { sendEmail } from "../../lib/email";
import { appendToSheet } from "../../lib/google-sheets";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, whatsapp } = body;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Nombre y email son requeridos" }),
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

    const downloadUrl =
      import.meta.env.EBOOK_DOWNLOAD_URL || "https://hablandocultura.com/ebook";

    // Register in Google Sheets
    try {
      await appendToSheet("Ebook", [
        [
          name,
          email,
          whatsapp ? "Si" : "No",
          new Date().toISOString(),
          "ebook-landing",
        ],
      ]);
    } catch (sheetError) {
      console.error("Google Sheets error:", sheetError);
    }

    // Send email with ebook
    const html = await render(EbookEmail({ name, downloadUrl }));
    await sendEmail(
      email,
      "Tu ebook: 10 Pasos para tu Proyecto Cultural",
      html
    );

    return new Response(
      JSON.stringify({ success: true, message: "Ebook enviado a tu correo" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ebook API error:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar la solicitud" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
