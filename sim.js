const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

// Sonidos
const collisionSound = new Audio('sounds/car-crash-sound-effect-376874.mp3');
const explosionSound = new Audio('sounds/explosion_01-6225.mp3');

// Ajuste de tamaño del canvas (Responsive)
function resizeCanvas() {
    const container = canvas.parentElement;
    // En móvil landscape, el canvas ocupa todo
    if (window.innerHeight < 500 && window.innerWidth > window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight - document.getElementById('controls').offsetHeight - 60; 
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Llamada inicial

// Toggle de Controles en Móvil
const toggleBtn = document.getElementById('toggleControls');
const controlsPanel = document.getElementById('controls');

if (toggleBtn) {
    toggleBtn.onclick = function() {
        controlsPanel.classList.toggle('hidden-controls');
        // Cambiar texto del botón
        if (controlsPanel.classList.contains('hidden-controls')) {
            toggleBtn.textContent = "⚙️ Configuración";
            toggleBtn.style.opacity = "0.8";
        } else {
            toggleBtn.textContent = "❌ Cerrar";
            toggleBtn.style.opacity = "1";
        }
    };
}

// Configuración de vehículos y sprites
// 'baseSprite' es el prefijo del archivo (ej: 'Sedan' para 'Sedan0.png', 'Sedan1.png', etc.)
const presets = {
    Sedan: { m: 1400, max: 55, baseSprite: 'Sedan' },
    SUV: { m: 1800, max: 50, baseSprite: 'SUV' },
    // Coupe: { m: 1500, max: 65, baseSprite: null }, 
    // Offroad: { m: 2000, max: 45, baseSprite: null }, 
    Cybertruck: { m: 3000, max: 55, baseSprite: 'Cybertruck' },
    // Motorcycle: { m: 200, max: 70, baseSprite: null }, 
    TUCSUC: { m: 9000, max: 33, baseSprite: 'Camion' } 
};

const images = {};

// Precarga de imágenes (0, 1, 2 para cada vehículo con sprite)
for (let key in presets) {
    if (presets[key].baseSprite) {
        images[key] = [];
        for (let i = 0; i <= 2; i++) {
            let img = new Image();
            img.src = 'sprites/' + presets[key].baseSprite + i + '.png';
            images[key][i] = img;
        }
    }
}

const signImage = new Image();
signImage.src = 'sprites/Sing.png';

// Lógica de UI y Ayuda
function updateVehicleInfo() {
    const typeA = document.getElementById('vehA').value;
    const typeB = document.getElementById('vehB').value;
    
    document.getElementById('infoA').textContent = `Masa: ${presets[typeA].m} kg`;
    document.getElementById('infoB').textContent = `Masa: ${presets[typeB].m} kg`;
}

document.getElementById('vehA').addEventListener('change', updateVehicleInfo);
document.getElementById('vehB').addEventListener('change', updateVehicleInfo);
updateVehicleInfo(); // Inicializar

// Validación de velocidades para modo alcance
document.getElementById('collisionType').addEventListener('change', function() {
    if (this.value === 'alcance') {
        const vA = Number(document.getElementById('vA').value);
        const vB = Number(document.getElementById('vB').value);
        if (vB >= vA) {
            const newVB = Math.max(0, vA - 5);
            document.getElementById('vB').value = newVB;
            document.getElementById('valB').textContent = newVB;
        }
    }
});

// Validar cuando cambian los sliders en modo alcance
document.getElementById('vA').addEventListener('input', function() {
    const collisionType = document.getElementById('collisionType').value;
    if (collisionType === 'alcance') {
        const vA = Number(this.value);
        const vB = Number(document.getElementById('vB').value);
        if (vB >= vA) {
            const newVB = Math.max(0, vA - 5);
            document.getElementById('vB').value = newVB;
            document.getElementById('valB').textContent = newVB;
        }
    }
});

document.getElementById('vB').addEventListener('input', function() {
    const collisionType = document.getElementById('collisionType').value;
    if (collisionType === 'alcance') {
        const vA = Number(document.getElementById('vA').value);
        const vB = Number(this.value);
        if (vB >= vA) {
            const newVB = Math.max(0, vA - 5);
            this.value = newVB;
            document.getElementById('valB').textContent = newVB;
        }
    }
});

// Modales
const mainHelpModal = document.getElementById('mainHelpModal');
const restHelpModal = document.getElementById('restHelpModal');
const closeButtons = document.querySelectorAll('.close-modal');

document.getElementById('helpBtn').onclick = () => mainHelpModal.classList.remove('hidden');
document.getElementById('restHelpBtn').onclick = () => restHelpModal.classList.remove('hidden');

closeButtons.forEach(btn => {
    btn.onclick = function() {
        this.closest('.modal').classList.add('hidden');
    }
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
}

let animationId = null;

function run() {
    if (animationId) cancelAnimationFrame(animationId);

    // Asegurar que el canvas tenga el tamaño correcto antes de empezar
    resizeCanvas();

    // Factor de escala global basado en la altura (Base 600px)
    // Establecer mínimo de 0.5 para evitar que todo sea microscópico
    const scaleFactor = Math.max(0.5, Math.min(1, canvas.height / 600));

    const typeA = document.getElementById('vehA').value;
    const typeB = document.getElementById('vehB').value;
    
    const mA = presets[typeA].m;
    const mB = presets[typeB].m;
    
    let speedA = Number(document.getElementById('vA').value);
    let speedB = Number(document.getElementById('vB').value);
    const e = Number(document.getElementById('rest').value);
    const collisionTypeValue = document.getElementById('collisionType').value;
    
    // RESTRICCIÓN: En alcance, B debe ser menor que A
    if (collisionTypeValue === 'alcance' && speedB >= speedA) {
        speedB = Math.max(0, speedA - 5); // B al menos 5 km/h menor que A
        document.getElementById('vB').value = speedB;
        document.getElementById('valB').textContent = speedB;
    }

    // ============= FÍSICA SEGÚN TIPO DE CHOQUE =============
    let vA_i, vB_i, vA_final, vB_final;
    
    if (collisionTypeValue === 'alcance') {
        // ALCANCE: Velocidades SIEMPRE positivas (modelo del profesor)
        vA_i = speedA;
        vB_i = speedB;
        
        const avg = (vA_i + vB_i) / 2;
        const dv = (vA_i - vB_i);
        
        vA_final = avg - e * dv / 2;
        vB_final = avg + e * dv / 2;
        
        // Regla especial: Si B venía más rápido que A, invertir signo de A_final
        if (vA_i < vB_i) {
            vA_final *= -1;
        }
    } else {
        // FRONTAL: Velocidades con signo (direcciones opuestas)
        vA_i = speedA;   // A → derecha (+)
        vB_i = -speedB;  // B ← izquierda (-)
        
        // Fórmulas generales para colisión 1D
        const totalMomentum = mA * vA_i + mB * vB_i;
        const dv = vA_i - vB_i;
        
        vA_final = (totalMomentum - mB * e * dv) / (mA + mB);
        vB_final = (totalMomentum + mA * e * dv) / (mA + mB);
    }

    // ==================== LOG DE RESULTADOS ====================
    const logReport = `
========================================
SIMULACIÓN DE COLISIÓN
========================================
Tipo: ${collisionTypeValue === 'frontal' ? 'FRONTAL ↔' : 'ALCANCE →→'}
Vehículo A: ${typeA} (${mA} kg) | Velocidad: ${speedA} km/h
Vehículo B: ${typeB} (${mB} kg) | Velocidad: ${speedB} km/h
Coeficiente e: ${e}

FÍSICA:
vA_i = ${vA_i} km/h | vB_i = ${vB_i} km/h
${collisionTypeValue === 'alcance' ? 
`Promedio = ${((vA_i + vB_i) / 2).toFixed(1)} km/h | Δv = ${vA_i - vB_i} km/h` : 
`Momento = ${(mA * vA_i + mB * vB_i).toFixed(2)} | Δv = ${vA_i - vB_i} km/h`}

RESULTADOS:
vA_final = ${Math.trunc(vA_final * 100) / 100} km/h ${collisionTypeValue === 'frontal' ? (vA_final >= 0 ? '→' : '←') : ''}
vB_final = ${Math.trunc(vB_final * 100) / 100} km/h ${collisionTypeValue === 'frontal' ? (vB_final >= 0 ? '→' : '←') : ''}`;
    
    console.log(logReport);

    // Cálculo de "Daño" basado en el cambio de velocidad (Delta V)
    // Comparar contra velocidades iniciales con signo
    const deltaV_A = Math.abs(vA_final - vA_i);
    const deltaV_B = Math.abs(vB_final - vB_i);
    
    console.log("\n[ANÁLISIS DE DAÑO]");
    console.log(`ΔV_A = |vA_final - vA_inicial| = |${vA_final.toFixed(3)} - ${vA_i}| = ${deltaV_A.toFixed(1)} km/h`);
    console.log(`ΔV_B = |vB_final - vB_inicial| = |${vB_final.toFixed(3)} - ${vB_i}| = ${deltaV_B.toFixed(1)} km/h`);
    
    // Cálculo de Impulso (Cambio de momento) J = m * deltaV
    // Usamos valor absoluto para magnitud
    const impulseA = mA * deltaV_A; 
    const impulseB = mB * deltaV_B; // Deberían ser iguales por 3ra ley de Newton

    // Determinar tipo de choque
    let collisionTypePhysics = "Parcialmente Inelástico";
    if (e === 1) collisionTypePhysics = "Perfectamente Elástico";
    else if (e === 0) collisionTypePhysics = "Perfectamente Inelástico";

    function getDamageText(deltaV) {
        if (deltaV < 15) return "Sin Daños";
        if (deltaV < 45) return "Daño Moderado";
        return "Destrucción Total";
    }
    
    function getDamageLevel(deltaV) {
        if (deltaV < 15) return 0;
        if (deltaV < 45) return 1;
        return 2;
    }

    const damageTextA = getDamageText(deltaV_A);
    const damageTextB = getDamageText(deltaV_B);
    const damageA = getDamageLevel(deltaV_A);
    const damageB = getDamageLevel(deltaV_B);
    
    const verification = `
DAÑO:
A: ΔV=${deltaV_A.toFixed(1)} → ${damageTextA}
B: ΔV=${deltaV_B.toFixed(1)} → ${damageTextB}
========================================`;
    
    console.log(verification);

    // Escala dinámica para móviles ("Chiquitiwito")
    let isMobileLandscape = (window.innerHeight < 500 && window.innerWidth > window.innerHeight);
    
    // Reducción basada en scaleFactor
    const width = 120 * scaleFactor; 
    const height = 60 * scaleFactor;
    
    // Ajuste de posición del suelo dinámico
    let groundY = canvas.height - (150 * scaleFactor);
    
    if (isMobileLandscape) {
        // Auto-ocultar controles al simular en móvil
        const controlsPanel = document.getElementById('controls');
        const toggleBtn = document.getElementById('toggleControls');
        if (controlsPanel && !controlsPanel.classList.contains('hidden-controls')) {
             controlsPanel.classList.add('hidden-controls');
             if (toggleBtn) {
                 toggleBtn.textContent = "⚙️ Configuración";
                 toggleBtn.style.opacity = "0.8";
             }
        }

        // Intentar pantalla completa para ocultar barra de navegación
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen blocked", e));
        }
    }

    // Lógica de Posicionamiento Inicial según tipo de choque
    let xA, xB;
    
    if (collisionTypeValue === 'frontal') {
        // CHOQUE FRONTAL: A viene de izquierda, B viene de derecha
        if (speedA === 0 && speedB > 0) {
            xA = canvas.width / 2 - width / 2 - (50 * scaleFactor);
            xB = canvas.width - width - (20 * scaleFactor);
        } else if (speedB === 0 && speedA > 0) {
            xB = canvas.width / 2 - width / 2 + (50 * scaleFactor);
            xA = (20 * scaleFactor);
        } else {
            xA = 50 * scaleFactor;
            xB = canvas.width - width - (50 * scaleFactor);
        }
    } else {
        // CHOQUE POR ALCANCE: ambos van hacia la derecha
        // B está 25 metros (250 píxeles en escala 10px/metro) adelante de A
        const PIXELS_PER_METER = 10;
        const distanciaEntreVehiculos = 25 * PIXELS_PER_METER * scaleFactor;
        
        if (speedA === 0 && speedB > 0) {
            // Caso especial: A quieto (no tiene sentido en alcance, pero lo manejamos)
            xA = canvas.width / 2 - distanciaEntreVehiculos;
            xB = xA + distanciaEntreVehiculos;
        } else if (speedB === 0 && speedA > 0) {
            // A alcanza a B que está quieto
            xA = (20 * scaleFactor);
            xB = xA + distanciaEntreVehiculos;
        } else {
            // Caso normal: A (más rápido) atrás, B (más lento) 25m adelante
            xA = 50 * scaleFactor;
            xB = xA + distanciaEntreVehiculos;
        }
    }
    
    let hasCollided = false;
    let soundPlayed = false;

    // Velocidades para la animación PRE-COLISIÓN
    let currentVA = speedA;
    let currentVB = (collisionTypeValue === 'frontal') ? -speedB : speedB;

    // Generar estrellas estáticas
    const stars = [];
    for(let i=0; i<100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (groundY - (50 * scaleFactor)),
            size: Math.random() * 2,
            alpha: Math.random()
        });
    }

    function drawSky() {
        // Estrellas
        ctx.fillStyle = 'white';
        stars.forEach(star => {
            ctx.globalAlpha = star.alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * scaleFactor, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Luna (Posición relativa al ancho)
        const moonX = canvas.width - (100 * scaleFactor);
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(moonX, 80 * scaleFactor, 40 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
        // Sombra de la luna
        ctx.fillStyle = '#1a1a1a'; 
        ctx.beginPath();
        ctx.arc(moonX - (15 * scaleFactor), 70 * scaleFactor, 35 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Nubes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.ellipse(200 * scaleFactor, 100 * scaleFactor, 80 * scaleFactor, 30 * scaleFactor, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(250 * scaleFactor, 120 * scaleFactor, 70 * scaleFactor, 35 * scaleFactor, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.6, 150 * scaleFactor, 100 * scaleFactor, 40 * scaleFactor, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawArrow(x, y, velocity, color) {
        if (Math.abs(velocity) < 0.1) return; // No dibujar si está casi quieto
        
        // Usar scaleFactor global
        let scale = scaleFactor;

        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 * scale;
        
        const arrowLen = 40 * scale;
        const dir = velocity > 0 ? 1 : -1;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + arrowLen * dir, y);
        ctx.stroke();
        
        // Punta de flecha
        ctx.beginPath();
        ctx.moveTo(x + arrowLen * dir, y);
        ctx.lineTo(x + (arrowLen - 10 * scale) * dir, y - 5 * scale);
        ctx.lineTo(x + (arrowLen - 10 * scale) * dir, y + 5 * scale);
        ctx.fill();
        
        ctx.font = `bold ${Math.max(10, 16 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.abs(velocity).toFixed(1)} km/h`, x + (arrowLen/2)*dir, y - 10 * scale);
        
        ctx.restore();
    }

    function drawGrid() {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = `${14 * scaleFactor}px monospace`;
        ctx.lineWidth = 1;

        // Línea base del suelo
        const roadTop = groundY + height - (5 * scaleFactor);
        const centerX = canvas.width / 2;
        
        // Línea horizontal de referencia
        ctx.beginPath();
        ctx.moveTo(0, roadTop);
        ctx.lineTo(canvas.width, roadTop);
        ctx.stroke();

        // Función auxiliar para dibujar marca (solo la línea)
        function drawTick(x, isCenter = false) {
            ctx.beginPath();
            ctx.moveTo(x, roadTop);
            ctx.lineTo(x, roadTop + (isCenter ? 15 * scaleFactor : 10 * scaleFactor));
            ctx.stroke();
        }

        // Dibujar centro (0m) con énfasis
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${16 * scaleFactor}px monospace`;
        drawTick(centerX, true);
        ctx.fillText("0m", centerX - (10 * scaleFactor), roadTop + (30 * scaleFactor));
        ctx.restore();

        function drawDistanceMarker(x, dist) {
             drawTick(x);
             
             // Señal cada 25m
             if (Math.abs(dist) % 25 === 0) {
                // Dibujar Señal
                const signW = 30 * scaleFactor;
                const signH = 50 * scaleFactor;
                const signX = x - (signW / 2);
                const signY = roadTop - signH;
                
                if (signImage.complete && signImage.naturalWidth !== 0) {
                    ctx.drawImage(signImage, signX, signY, signW, signH);
                } else {
                    // Fallback
                    ctx.fillStyle = '#7f8c8d'; // Poste
                    ctx.fillRect(x - (2 * scaleFactor), roadTop - (40 * scaleFactor), 4 * scaleFactor, 40 * scaleFactor);
                    ctx.fillStyle = '#f1c40f'; // Señal
                    ctx.fillRect(x - (12 * scaleFactor), roadTop - (55 * scaleFactor), 24 * scaleFactor, 24 * scaleFactor);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(x - (12 * scaleFactor), roadTop - (55 * scaleFactor), 24 * scaleFactor, 24 * scaleFactor);
                }

                // Texto en la señal
                ctx.save();
                ctx.fillStyle = 'black';
                ctx.font = `bold ${11 * scaleFactor}px Arial`;
                ctx.textAlign = 'center';
                // Ajustar posición vertical para que quede dentro del cuadro amarillo
                ctx.fillText(`${Math.abs(dist)}`, x, roadTop - (38 * scaleFactor)); 
                ctx.restore();

             } else {
                 // Texto en la carretera (normal)
                 ctx.fillText(`${dist}m`, x - (15 * scaleFactor), roadTop + (30 * scaleFactor));
             }
        }

        // Hacia la derecha (Positivos)
        let dist = 0;
        for (let x = centerX + (50 * scaleFactor); x < canvas.width; x += (50 * scaleFactor)) {
            dist += 5; // 50px = 5m
            drawDistanceMarker(x, dist);
        }

        // Hacia la izquierda (Negativos)
        dist = 0;
        for (let x = centerX - (50 * scaleFactor); x > 0; x -= (50 * scaleFactor)) {
            dist -= 5;
            drawDistanceMarker(x, dist);
        }

        ctx.restore();
    }

    // Constantes Físicas para Realismo
    const FPS = 60;
    const TIME_SCALE = 3.0; // La simulación corre a 3x velocidad real para no ser aburrida
    const GRAVITY = 9.81; // m/s^2
    const MU = 0.75; // Coeficiente de fricción (Asfalto seco)
    const PIXELS_PER_METER = 10; // Según nuestra cuadrícula (50px = 5m)

    // Factores calculados
    const dt = (1 / FPS) * TIME_SCALE; // Tiempo simulado por frame
    const frictionLoss = (MU * GRAVITY * 3.6) * dt; // Cuánto frena en km/h por frame
    const moveFactor = (1 / 3.6) * PIXELS_PER_METER * dt; // Conversión de km/h a desplazamiento en px

    function frame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawSky();

        // Dibujar carretera
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, groundY + height - (5 * scaleFactor), canvas.width, 150 * scaleFactor);
        
        // Dibujar Grid/Regla
        drawGrid();
        
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 4 * scaleFactor;
        ctx.setLineDash([30 * scaleFactor, 30 * scaleFactor]);
        ctx.beginPath();
        ctx.moveTo(0, groundY + height + (45 * scaleFactor));
        ctx.lineTo(canvas.width, groundY + height + (45 * scaleFactor));
        ctx.stroke();
        ctx.setLineDash([]);

        // Determinar qué sprite usar
        const spriteIndexA = hasCollided ? damageA : 0;
        const spriteIndexB = hasCollided ? damageB : 0;

        // Dibujar Vehículo A
        if (images[typeA] && images[typeA][spriteIndexA]) {
            ctx.drawImage(images[typeA][spriteIndexA], xA, groundY, width, height);
        } else {
            ctx.fillStyle = hasCollided && damageA > 1 ? '#555' : '#3498db';
            ctx.fillRect(xA, groundY + (10 * scaleFactor), width, height - (10 * scaleFactor));
            ctx.fillStyle = 'white';
            ctx.font = `${18 * scaleFactor}px Arial`;
            ctx.fillText(typeA, xA + (10 * scaleFactor), groundY + (30 * scaleFactor));
        }
        // Etiqueta A y Flecha
        ctx.fillStyle = '#3498db';
        ctx.font = `bold ${24 * scaleFactor}px Arial`;
        ctx.fillText("A", xA + width/2 - (5 * scaleFactor), groundY - (10 * scaleFactor));
        
        if (hasCollided && Math.abs(currentVA) < 0.1) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `bold ${18 * scaleFactor}px Arial`;
            ctx.fillText(`Vel. Final: ${Math.trunc(Math.abs(vA_final) * 100) / 100} km/h`, xA + width/2, groundY - (30 * scaleFactor));
            ctx.restore();
        } else {
            drawArrow(xA + width/2, groundY - (30 * scaleFactor), currentVA, '#3498db');
        }


        // Dibujar Vehículo B
        ctx.save();
        if (images[typeB] && images[typeB][spriteIndexB]) {
            // En modo FRONTAL, B viene de derecha a izquierda (flip horizontal)
            // En modo ALCANCE, B va hacia la derecha (sin flip)
            if (collisionTypeValue === 'frontal') {
                ctx.translate(xB + width, groundY);
                ctx.scale(-1, 1);
                ctx.drawImage(images[typeB][spriteIndexB], 0, 0, width, height);
            } else {
                // Modo alcance: sin flip, mira a la derecha
                ctx.drawImage(images[typeB][spriteIndexB], xB, groundY, width, height);
            }
        } else {
            ctx.fillStyle = hasCollided && damageB > 1 ? '#555' : '#e74c3c';
            ctx.fillRect(xB, groundY + (10 * scaleFactor), width, height - (10 * scaleFactor));
            ctx.fillStyle = 'white';
            ctx.font = `${18 * scaleFactor}px Arial`;
            ctx.fillText(typeB, xB + (10 * scaleFactor), groundY + (30 * scaleFactor));
        }
        ctx.restore();
        // Etiqueta B y Flecha
        ctx.fillStyle = '#e74c3c';
        ctx.font = `bold ${24 * scaleFactor}px Arial`;
        ctx.fillText("B", xB + width/2 - (5 * scaleFactor), groundY - (10 * scaleFactor));
        
        if (hasCollided && Math.abs(currentVB) < 0.1) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `bold ${18 * scaleFactor}px Arial`;
            ctx.fillText(`Vel. Final: ${Math.trunc(Math.abs(vB_final) * 100) / 100} km/h`, xB + width/2, groundY - (30 * scaleFactor));
            ctx.restore();
        } else {
            drawArrow(xB + width/2, groundY - (30 * scaleFactor), currentVB, '#e74c3c');
        }

        // Mostrar datos de impacto
        if (hasCollided) {
            ctx.save();
            ctx.textAlign = 'center';
            const centerX = canvas.width / 2;
            
            // Fondo semitransparente
            ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 2 * scaleFactor;
            
            const boxHeight = 200 * scaleFactor; // Más alto para más datos
            const boxWidth = 440 * scaleFactor;
            const boxY = 20 * scaleFactor;

            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(centerX - (boxWidth / 2), boxY, boxWidth, boxHeight, 10 * scaleFactor);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(centerX - (boxWidth / 2), boxY, boxWidth, boxHeight);
                ctx.strokeRect(centerX - (boxWidth / 2), boxY, boxWidth, boxHeight);
            }

            ctx.fillStyle = 'white';
            ctx.font = `bold ${24 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillText(`RESULTADOS DEL IMPACTO`, centerX, boxY + (30 * scaleFactor));
            
            ctx.font = `italic ${18 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`Tipo: ${collisionTypeValue} (e=${e})`, centerX, boxY + (50 * scaleFactor));
            
            ctx.font = `${18 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.textAlign = 'left';
            const leftCol = centerX - (200 * scaleFactor);
            const rightCol = centerX + (20 * scaleFactor);

            // Columna A
            ctx.fillStyle = '#3498db';
            ctx.font = `bold ${20 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillText(`VEHÍCULO A (${typeA})`, leftCol, boxY + (80 * scaleFactor));
            ctx.font = `${18 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText(`Vel. Inicial: ${speedA.toFixed(1)} km/h`, leftCol, boxY + (100 * scaleFactor));
            ctx.fillText(`Vel. Final: ${Math.trunc(Math.abs(vA_final) * 100) / 100} km/h`, leftCol, boxY + (120 * scaleFactor));
            // Daño en pequeño
            ctx.font = `italic ${16 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillStyle = '#95a5a6';
            ctx.fillText(`Daño est.: ${damageTextA}`, leftCol, boxY + (150 * scaleFactor));

            // Columna B
            ctx.fillStyle = '#e74c3c';
            ctx.font = `bold ${20 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillText(`VEHÍCULO B (${typeB})`, rightCol, boxY + (80 * scaleFactor));
            ctx.font = `${18 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText(`Vel. Inicial: ${speedB.toFixed(1)} km/h`, rightCol, boxY + (100 * scaleFactor));
            ctx.fillText(`Vel. Final: ${Math.trunc(Math.abs(vB_final) * 100) / 100} km/h`, rightCol, boxY + (120 * scaleFactor));
            // Daño en pequeño
            ctx.font = `italic ${16 * scaleFactor}px "Segoe UI", sans-serif`;
            ctx.fillStyle = '#95a5a6';
            ctx.fillText(`Daño est.: ${damageTextB}`, rightCol, boxY + (150 * scaleFactor));

            ctx.restore();
        }

        // Lógica de movimiento y colisión
        if (!hasCollided) {
            // Fase de aproximación
            if (xA + width < xB) {
                xA += currentVA * moveFactor;
                xB += currentVB * moveFactor;
            } else {
                // Impacto detectado
                hasCollided = true;
                
                // Actualizar velocidades post-choque SIN INVERTIR A/B
                // vA_final y vB_final ya tienen signo correcto de la física:
                // - Positivo: hacia la derecha
                // - Negativo: hacia la izquierda
                currentVA = vA_final;
                currentVB = vB_final;

                // Reproducir sonidos
                if (!soundPlayed) {
                    collisionSound.currentTime = 0;
                    collisionSound.play().catch(e => console.log("Audio play failed", e));
                    
                    if (damageA === 2 || damageB === 2) {
                        explosionSound.currentTime = 0;
                        explosionSound.play().catch(e => console.log("Audio play failed", e));
                    }
                    soundPlayed = true;
                }
            }
        } else {
            // Fase post-impacto (con fricción realista)
            xA += currentVA * moveFactor;
            xB += currentVB * moveFactor;

            // Límites de pantalla (evitar que salgan)
            if (xA < 0) { xA = 0; currentVA = 0; }
            if (xA > canvas.width - width) { xA = canvas.width - width; currentVA = 0; }
            
            if (xB < 0) { xB = 0; currentVB = 0; }
            if (xB > canvas.width - width) { xB = canvas.width - width; currentVB = 0; }

            // Fricción (desaceleración basada en física real)
            if (currentVA > 0) {
                currentVA = Math.max(0, currentVA - frictionLoss);
            } else if (currentVA < 0) {
                currentVA = Math.min(0, currentVA + frictionLoss);
            }

            if (currentVB > 0) {
                currentVB = Math.max(0, currentVB - frictionLoss);
            } else if (currentVB < 0) {
                currentVB = Math.min(0, currentVB + frictionLoss);
            }
        }

        animationId = requestAnimationFrame(frame);
    }
    frame();
}

document.getElementById('simulate').onclick = run;
