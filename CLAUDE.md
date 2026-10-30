# Flujo de Git (Dido Concepts)

Este repositorio sigue GitFlow con el prefijo de trabajo **DC** (Dido Concepts). Por ahora no hay número de ticket, así que se usa solo `DC`. Cuando haya tickets, el formato pasa a `DC-<número>`.

## Ramas

- `main`: producción. Solo recibe merges desde `rc-{mes}` o `hotfix/*`.
- `release`: candidata a producción. De aquí salen las ramas de trabajo.
- `qa`: integración para pruebas. Nunca se mergea directo a `release`.
- `rc-{mes}`: congelamiento de un release. Solo admite correcciones de estabilización, que también se llevan a `release` y `qa`.
- Ramas de trabajo, creadas desde `release` (excepto `hotfix/*`, que sale de `main`), con el formato `<tipo>/DC-<Descripcion>`:
  `feature/`, `bugfix/`, `hotfix/`, `refactor/`, `style/`, `perf/`, `chore/`, `docs/`, `test/`, `experiment/`.
  Ejemplo: `feature/DC-Google-login`.
- Al terminar, la rama de trabajo se mergea a `qa` y a `release` (`hotfix/*` va a `main` y `release`).

## Commits

Formato, en inglés y en presente:

```
<type> (DC): <brief description>
```

Tipos: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`.

Ejemplos:

```
feat (DC): add Google login
fix (DC): reject duplicate Yape operation numbers
test (DC): add payment approval integration tests
```

- Descripción breve y específica (idealmente menos de 72 caracteres). Nada de "fix bug" o "update code".
- El detalle adicional va en el cuerpo del commit.

## Versiones y despliegue

- [SemVer](https://semver.org/lang/es/) con etiquetas `vX.Y.Z` en `main`: `0.x` mientras el sitio es una demo (Culqi en modo prueba), `1.0.0` al pasar a producción. MINOR para funciones nuevas, PATCH para correcciones.
- Lo que entra a `release` se anota en `CHANGELOG.md`, bajo «Sin publicar».
- Publicar una versión:
  1. `git checkout -b rc-{mes} release`; sube `version` en `package.json` y en `CHANGELOG.md` «Sin publicar» pasa a `[X.Y.Z] - AAAA-MM-DD`. Commit `chore (DC): release vX.Y.Z`.
  2. Merge `--no-ff` de `rc-{mes}` a `main` y etiqueta anotada en ese merge: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
  3. Merge de `rc-{mes}` de vuelta a `release` y `qa`. Push de `main`, `release`, `qa` y la etiqueta.
  4. Vercel despliega `main`; `/version.json` confirma la versión publicada.
- Hotfix: `hotfix/DC-<Descripcion>` desde `main`, sube el PATCH, merge a `main` (con etiqueta) y a `release`.

## Pull requests

Título con el prefijo del entorno destino:

```
[qa] <type> (DC): <brief description>     → hacia qa
[stg] <type> (DC): <brief description>    → hacia release
```
