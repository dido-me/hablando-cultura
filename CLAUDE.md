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

## Pull requests

Título con el prefijo del entorno destino:

```
[qa] <type> (DC): <brief description>     → hacia qa
[stg] <type> (DC): <brief description>    → hacia release
```
