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

interface SubscriptionEmailProps {
  email: string;
}

export default function SubscriptionEmail({ email }: SubscriptionEmailProps) {
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
      <Preview>Bienvenido/a al newsletter de Hablando Cultura</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>KAROLAY RAMIREZ</Text>
            <Text style={taglineStyle}>Hablando Cultura</Text>
          </Section>

          {/* Main content */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Bienvenido/a al newsletter</Text>
            <Text style={paragraphStyle}>
              Gracias por suscribirte. A partir de ahora recibiras contenido
              exclusivo sobre gestion cultural, innovacion y emprendimiento
              directamente en tu correo.
            </Text>

            <Section style={featuresBoxStyle}>
              <Text style={featuresTitle}>Lo que recibiras:</Text>
              <Text style={featureItem}>
                ✦ Articulos sobre gestion y produccion cultural
              </Text>
              <Text style={featureItem}>
                ✦ Tips y herramientas para gestores culturales
              </Text>
              <Text style={featureItem}>
                ✦ Invitaciones a eventos y talleres
              </Text>
              <Text style={featureItem}>
                ✦ Recursos exclusivos para suscriptores
              </Text>
            </Section>

            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button style={buttonStyle} href="https://hablandocultura.com/blog">
                Explorar el blog
              </Button>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={signatureStyle}>
              Nos vemos pronto,
              <br />
              <strong>Karolay Ramirez</strong>
              <br />
              Gestora y Productora Cultural
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Sigueme en redes sociales para mas contenido.
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
  margin: "0 0 4px 0",
};

const taglineStyle: React.CSSProperties = {
  color: "#c4b5fd",
  fontSize: "14px",
  fontWeight: 600,
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  padding: "40px",
};

const greetingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: "16px",
  textAlign: "center" as const,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
  marginBottom: "16px",
};

const featuresBoxStyle: React.CSSProperties = {
  backgroundColor: "#fefce8",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const featuresTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 12px 0",
};

const featureItem: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "20px",
  color: "#475569",
  margin: "0 0 8px 0",
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
