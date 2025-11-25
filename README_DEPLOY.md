# Simulador de Choques - Guía de Despliegue

Este proyecto es una aplicación web estática (HTML, CSS, JS), lo que significa que es muy fácil de subir a internet de forma gratuita.

## Opción Recomendada: GitHub Pages

Si ya tienes este código en un repositorio de GitHub, sigue estos pasos:

1.  Ve a la página de tu repositorio en **GitHub.com**.
2.  Haz clic en la pestaña **Settings** (Configuración).
3.  En el menú de la izquierda, busca y haz clic en **Pages**.
4.  En la sección "Build and deployment":
    *   En **Source**, selecciona `Deploy from a branch`.
    *   En **Branch**, selecciona `main` (o `master`) y la carpeta `/ (root)`.
5.  Haz clic en **Save**.

¡Listo! En unos minutos, GitHub te dará un enlace (algo como `https://tu-usuario.github.io/Impactos/`) donde tu simulador estará funcionando para todo el mundo.

## Opción Alternativa: Netlify Drop

Si no quieres usar GitHub:

1.  Entra a [app.netlify.com/drop](https://app.netlify.com/drop).
2.  Arrastra la carpeta completa de tu proyecto (donde está el `index.html`) al área indicada.
3.  Netlify subirá tu sitio y te dará un enlace instantáneo.

## Estructura de Archivos Requerida

Asegúrate de que tu carpeta tenga esta estructura antes de subirla:

```
/ (Carpeta Raíz)
├── index.html
├── styles.css
├── sim.js
├── sprites/
│   ├── Sedan0.png
│   ├── ...
└── sounds/
    ├── car-crash...mp3
    └── ...
```
