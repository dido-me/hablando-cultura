# Cambios

Versiones con [SemVer](https://semver.org/lang/es/): `0.x` mientras el sitio es una demo
(Culqi en modo prueba) y `1.0.0` al pasar a producción. Cada release se publica con su
etiqueta `vX.Y.Z` en `main`, que Vercel despliega (ver «Versiones y despliegue» en
CLAUDE.md). La versión publicada se ve en `/version.json`.

## [Sin publicar]

Primera versión del sitio con la plataforma de cursos, para la demo.

### Agregado
- Catálogo de cursos y ebooks, página del curso con tráiler y temario, lecciones con video,
  texto de refuerzo, índice y progreso, y materiales del curso para descargar.
- Venta del ebook (S/ 20) con descarga desde la página y desde Mi cuenta.
- Pago con Culqi (tarjeta con 3DS y Yape), cupones de descuento, enlaces `?cupon=` y
  acceso gratis con cupones del 100 %.
- Cuentas: ingresar, registro, Google, activación, recuperar contraseña y Mi cuenta.
- Panel de admin para Karolay: pagos, cupones, suscriptores y Libro de Reclamaciones.
- Requisitos de Culqi: términos, privacidad, cambios y devoluciones, Libro de
  Reclamaciones y datos de contacto en el pie de página.
- Modo demo: `PUBLIC_SIGNUP_OPEN=false` oculta el registro.

### Cambiado
- El newsletter guarda los suscriptores en la API, que envía la bienvenida; el sitio ya
  no envía correos.
