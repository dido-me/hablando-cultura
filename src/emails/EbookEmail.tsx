import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
  Font,
} from "@react-email/components";
import * as React from "react";

interface EbookEmailProps {
  name: string;
  downloadUrl: string;
}

export default function EbookEmail({ name, downloadUrl }: EbookEmailProps) {
  return (
    <Html lang="es">
      <Head>
        <Font
          fontFamily="Plus Jakarta Sans"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap",
            format: "woff2",
          }}
        />
      </Head>
      <Preview>Tu ebook "10 Pasos para tu Proyecto Cultural" esta listo</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>KAROLAY RAMIREZ</Text>
          </Section>

          {/* Main content */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Hola {name},</Text>
            <Text style={paragraphStyle}>
              Gracias por descargar mi ebook. Estoy emocionada de compartir
              contigo esta metodologia que he perfeccionado en mas de 15 anos de
              carrera en gestion y produccion cultural.
            </Text>

            <Section style={highlightBoxStyle}>
              <Text style={highlightTitleStyle}>
                10 Pasos para tu Proyecto Cultural
              </Text>
              <Text style={highlightTextStyle}>
                Dentro encontraras una guia practica con pasos claros y
                accionables para llevar tu proyecto cultural al siguiente nivel.
              </Text>
            </Section>

            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button style={buttonStyle} href={downloadUrl}>
                Descargar mi ebook
              </Button>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={paragraphStyle}>
              Si tienes alguna pregunta o necesitas orientacion personalizada, no
              dudes en contactarme. Estoy aqui para ayudarte en tu camino como
              gestor cultural.
            </Text>

            <Text style={signatureStyle}>
              Con carino,
              <br />
              <strong>Karolay Ramirez</strong>
              <br />
              Gestora y Productora Cultural
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Sigueme en redes sociales para mas contenido sobre gestion
              cultural.
            </Text>
            <Text style={footerLinksStyle}>
              <a href="https://www.instagram.com/hablandocultura/" style={linkStyle}>
                Instagram
              </a>
              {" · "}
              <a href="https://www.youtube.com/@hablandocultura" style={linkStyle}>
                YouTube
              </a>
              {" · "}
              <a href="https://www.linkedin.com/in/cynramir/" style={linkStyle}>
                LinkedIn
              </a>
            </Text>
            <Text style={copyrightStyle}>
              © {new Date().getFullYear()} Karolay Ramirez. Todos los derechos
              reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f5f3ff",
  fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  margin: 0,
  padding: "40px 0",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 24px rgba(109, 40, 217, 0.08)",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#6d28d9",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const logoStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 800,
  letterSpacing: "-0.5px",
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  padding: "40px",
};

const greetingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: "16px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
  marginBottom: "16px",
};

const highlightBoxStyle: React.CSSProperties = {
  backgroundColor: "#f5f3ff",
  borderLeft: "4px solid #6d28d9",
  borderRadius: "0 12px 12px 0",
  padding: "24px",
  margin: "24px 0",
};

const highlightTitleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#6d28d9",
  margin: "0 0 8px 0",
};

const highlightTextStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#475569",
  margin: 0,
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#6d28d9",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 700,
  padding: "16px 40px",
  borderRadius: "9999px",
  textDecoration: "none",
  display: "inline-block",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
};

const footerStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#94a3b8",
  marginBottom: "12px",
};

const footerLinksStyle: React.CSSProperties = {
  fontSize: "14px",
  marginBottom: "16px",
};

const linkStyle: React.CSSProperties = {
  color: "#a78bfa",
  textDecoration: "none",
};

const copyrightStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  margin: 0,
};
