# Instrucciones para Activar GitHub Pages

Este repositorio ya tiene configurado GitHub Actions para desplegar automáticamente a GitHub Pages. Solo necesitas completar estos pasos finales en la configuración de GitHub:

## Pasos a seguir:

### 1. Fusionar el Pull Request

Primero, fusiona el Pull Request actual que contiene la configuración de GitHub Actions.

### 2. Configurar GitHub Pages en el Repositorio

1. Ve a tu repositorio en GitHub: https://github.com/Hudesde/Impactos
2. Haz clic en la pestaña **Settings** (Configuración)
3. En el menú lateral izquierdo, busca y haz clic en **Pages**
4. En la sección "Build and deployment":
   - En **Source**, selecciona **GitHub Actions**
   - NO selecciones "Deploy from a branch" (la configuración antigua)
5. Guarda los cambios

### 3. Activar el Workflow

Después de fusionar el Pull Request a la rama `main`:

1. Ve a la pestaña **Actions** en tu repositorio
2. Deberías ver el workflow "Deploy static content to Pages"
3. Si no se ejecuta automáticamente, puedes ejecutarlo manualmente:
   - Haz clic en el workflow
   - Haz clic en "Run workflow"
   - Selecciona la rama `main`
   - Haz clic en "Run workflow"

### 4. Verificar el Despliegue

1. Una vez que el workflow se complete (toma 1-2 minutos), verás un check verde ✓
2. Tu sitio estará disponible en: **https://hudesde.github.io/Impactos/**
3. Puede tomar unos minutos adicionales para que los cambios se propaguen

## Actualizaciones Futuras

Una vez configurado, cada vez que hagas push a la rama `main`, el sitio se actualizará automáticamente. ¡No necesitas hacer nada más!

## Problemas Comunes

### El workflow falla

- Asegúrate de que en Settings > Pages, la fuente sea "GitHub Actions"
- Verifica que el repositorio sea público (o tengas GitHub Pro para Pages en repos privados)

### El sitio no carga

- Espera 5-10 minutos después del primer despliegue
- Verifica la URL: https://hudesde.github.io/Impactos/
- Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

### Los recursos no cargan (imágenes, sonidos)

- Verifica que todas las carpetas (sprites, sounds) estén en el repositorio
- Asegúrate de que las rutas en el código sean relativas (no absolutas)

## Soporte

Si tienes problemas, revisa los logs del workflow en la pestaña Actions de GitHub.
