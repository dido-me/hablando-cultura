# Guia de Eventos - Google Calendar

## Como funciona la integracion

Los eventos se obtienen de un Google Calendar publico usando la API v3 al momento del **build** (`pnpm build`). Cada vez que haces deploy en Vercel, se obtienen los eventos mas recientes.

---

## Crear un evento correctamente

### Formato del titulo

```
[Tipo de Evento] Titulo del evento
```

El texto entre corchetes `[...]` se usa como **badge/etiqueta** en la tarjeta. El resto es el titulo visible.

**Ejemplos:**

| Titulo en Google Calendar | Badge | Titulo mostrado |
|---------------------------|-------|-----------------|
| `[Conferencia Magistral] Liderazgo del Futuro` | Conferencia Magistral | Liderazgo del Futuro |
| `[Workshop Virtual] Masterclass de Abundancia` | Workshop Virtual | Masterclass de Abundancia |
| `[Webinar] Tendencias en Gestion Cultural` | Webinar | Tendencias en Gestion Cultural |
| `Mi evento sin tag` | Evento | Mi evento sin tag |

Si no pones corchetes, el badge dira "Evento" por defecto.

### Descripcion (texto enriquecido)

La descripcion de Google Calendar soporta formato HTML. Desde la interfaz de Google Calendar puedes usar:

- **Negrita** (Ctrl+B)
- *Cursiva* (Ctrl+I)
- Subrayado (Ctrl+U)
- [Links](https://ejemplo.com) (Ctrl+K)
- Listas numeradas
- Listas con vinetas

Todo esto se renderiza correctamente en la web.

### Campos disponibles

| Campo en Google Calendar | Donde aparece en la web |
|--------------------------|------------------------|
| **Titulo** | Titulo de la tarjeta + badge si tiene `[Tag]` |
| **Descripcion** | Cuerpo de la tarjeta (con formato HTML) |
| **Fecha/hora inicio** | Fecha formateada en espanol (ej: "15 de Marzo, 2026") |
| **Fecha/hora fin** | Se usa para el link de "agregar a calendario" |
| **Ubicacion** | Aparece con icono de ubicacion (solo si tiene valor) |
| **Archivos adjuntos** | Aparecen como botones descargables con icono |
| **Google Meet** | Link "Unirse a Google Meet" con icono de videocam (solo si tiene videoconferencia) |

### Campos de la API que NO se usan actualmente pero estan disponibles

| Campo | Descripcion | Cuando aparece |
|-------|-------------|----------------|
| `attendees[]` | Lista de invitados y su estado de respuesta | Cuando invitas personas |
| `colorId` | Color del evento | Cuando cambias el color del evento |
| `recurrence[]` | Reglas de recurrencia | Para eventos recurrentes |
| `creator.email` | Email de quien creo el evento | Siempre |
| `organizer.displayName` | Nombre del calendario | Siempre |

---

## Archivos adjuntos

Para agregar archivos adjuntos a un evento:

1. Abre el evento en Google Calendar
2. Click en "Editar"
3. Click en "Agregar archivo adjunto" (icono de clip)
4. Selecciona un archivo de Google Drive

Los adjuntos aparecen en la web como botones con:
- Icono del tipo de archivo (imagen, PDF, documento, etc.)
- Nombre del archivo
- Link que abre el archivo en Google Drive

---

## Google Meet / Videoconferencia

Si el evento tiene una videoconferencia de Google Meet, aparece automaticamente un link "Unirse a Google Meet" con icono de camara en la tarjeta del evento.

### Como agregar Meet a un evento

1. Abre el evento en Google Calendar
2. Click en "Editar"
3. Click en "Agregar videoconferencia de Google Meet"
4. Guardar

El link de Meet (`hangoutLink`) se obtiene automaticamente de la API.

### Nota sobre acceso al Meet

El link de Meet es publico y cualquiera con el link puede unirse a la sala. Sin embargo, si tu configuracion de Meet requiere aprobacion, los visitantes veran una pantalla de "Pedir acceso" hasta que el organizador los acepte.

---

## Link "Unirme al evento"

El boton "Unirme al evento" lleva al visitante directamente a tu evento en Google Calendar (`htmlLink`). Ahi puede ver los detalles y guardarlo en su propio calendario.

### Limitacion importante

**No es posible agregar asistentes automaticamente** usando solo un API Key (lectura). Para que alguien sea asistente oficial de tu evento (y reciba el link de Meet), necesitas invitarlo manualmente desde Google Calendar usando su email.

### Flujo recomendado para trackear asistentes

1. **En la descripcion del evento**, pon un link a un formulario de registro:
   ```
   Registrate aqui: https://forms.gle/tu-formulario
   ```
2. Los visitantes se registran via el formulario (recoges nombre, email, etc.)
3. Desde Google Calendar, invitas a los registrados usando sus emails
4. Al ser invitados, reciben notificacion y acceso al Google Meet del evento

### Alternativas para el formulario de registro

- **Google Forms** (gratis, se integra con Google Sheets)
- **Eventbrite** (tiene plan gratuito, maneja RSVPs)
- **Tally.so** (gratis, bonito, facil de usar)
- **Lu.ma** (especializado en eventos, tiene RSVP nativo)

---

## Variables de entorno

```env
# .env (NO commitear - ya esta en .gitignore)
GOOGLE_CALENDAR_API_KEY=tu-api-key
GOOGLE_CALENDAR_ID=tu-calendar-id@group.calendar.google.com
```

### Donde obtener cada valor

**GOOGLE_CALENDAR_API_KEY:**
1. Ve a https://console.cloud.google.com/
2. APIs & Services > Credentials
3. Crear credencial > API Key
4. Restringir solo para "Google Calendar API"

**GOOGLE_CALENDAR_ID:**
1. Abre Google Calendar
2. Click derecho en tu calendario > Configuracion
3. Seccion "Integrar el calendario"
4. Copia el "ID del calendario"
   - Calendario principal = tu email (ej: `karolay@gmail.com`)
   - Calendario secundario = algo como `abc123@group.calendar.google.com`

### En Vercel

Agrega las mismas 2 variables en: Vercel > Project Settings > Environment Variables

---

## Requisitos del calendario

- El calendario **debe ser publico**: Settings > Access permissions > "Make available to public"
- La API de Google Calendar **debe estar habilitada** en tu proyecto de Google Cloud

---

## Archivos del proyecto relacionados

```
src/
  lib/
    google-calendar.ts          # Funcion getUpcomingEvents() - fetch y transformacion
    types/
      google-calendar.ts        # Interfaces TypeScript
  components/
    Events.astro                # Componente visual de eventos
.env                            # Variables de entorno (no commitear)
```

---

## Actualizacion de eventos

Los eventos se actualizan **al hacer build/deploy**. No son en tiempo real.

- **Desarrollo:** `pnpm dev` obtiene los eventos al iniciar el servidor
- **Produccion:** `pnpm build` obtiene los eventos al generar las paginas estaticas
- **Vercel:** cada deploy ejecuta el build y obtiene eventos frescos

Si necesitas que los eventos se actualicen sin hacer deploy manual, configura un **cron job en Vercel** (vercel.json) para rebuild automatico, por ejemplo cada 6 horas.

---

## Ejemplo completo de evento bien configurado

**En Google Calendar:**

- **Titulo:** `[Workshop Virtual] Masterclass: Gestion Cultural en la Era Digital`
- **Fecha:** 22 de Abril, 2026 - 15:00 a 18:00
- **Ubicacion:** `Online - Google Meet`
- **Descripcion:**
  ```
  Descubre como la transformacion digital esta revolucionando la gestion cultural.

  Temas:
  - Digitalizacion de museos
  - Marketing cultural en redes sociales
  - Herramientas de IA para gestores culturales

  Registrate aqui: https://forms.gle/tu-formulario

  Cupos limitados.
  ```
- **Adjunto:** PDF con el programa completo (desde Google Drive)
- **Videoconferencia:** Google Meet agregado

**Resultado en la web:**

- Badge: "Workshop Virtual"
- Titulo: "Masterclass: Gestion Cultural en la Era Digital"
- Descripcion con formato
- Fecha: "22 de Abril, 2026"
- Ubicacion: "Online - Google Meet"
- Link: "Unirse a Google Meet" (si tiene videoconferencia)
- Adjunto: boton para descargar el PDF
- Boton: "Unirme al evento"
