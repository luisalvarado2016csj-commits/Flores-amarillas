function openTree() {
    const welcome = document.getElementById("welcome");
    const tree = document.getElementById("treeScreen");
    const bgMusic = document.getElementById("bgMusic");
    const musicBtn = document.getElementById("musicToggle");

    // Intentar reproducir la música
    if (bgMusic && bgMusic.paused) {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicBtn.classList.remove("paused");
        }).catch(err => console.log("Autoplay bloqueado:", err));
    }

    welcome.classList.add("hidden");
    setTimeout(() => {
        tree.classList.remove("hidden");
        // Reiniciar y animar el canvas cada vez que se abre
        crecimiento = 0;
        desplazamientoX = 0;
        mensajeMostrado = false;
        document.getElementById('finalMessage').classList.remove('show');
        prepararArbol();
        if (!animacionActiva) {
            animacionActiva = true;
            animar();
        }
    }, 400);
}

function goBack() {
    const welcome = document.getElementById("welcome");
    const tree = document.getElementById("treeScreen");
    tree.classList.add("hidden");
    setTimeout(() => {
        welcome.classList.remove("hidden");
        animacionActiva = false; // Detener animación cuando se cierra
        
        // Pausar música al regresar
        const bgMusic = document.getElementById("bgMusic");
        const musicBtn = document.getElementById("musicToggle");
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
            isMusicPlaying = false;
            if(musicBtn) musicBtn.classList.add("paused");
        }
    }, 400);
}

let isMusicPlaying = false;
function toggleMusic() {
    const bgMusic = document.getElementById("bgMusic");
    const musicBtn = document.getElementById("musicToggle");
    
    if (isMusicPlaying) {
        bgMusic.pause();
        musicBtn.classList.add("paused");
    } else {
        bgMusic.play();
        musicBtn.classList.remove("paused");
    }
    isMusicPlaying = !isMusicPlaying;
}

// =====================================================
// L"GICA DEL CANVAS
// =====================================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W, H;
let animacionActiva = false;
let isMobile = false;

function ajustarCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    isMobile = W < 768;
}

ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

let hojas = [];
let flores = [];
let floresCayendo = [];
let crecimiento = 0;
let desplazamientoX = 0;
let mensajeMostrado = false;
let lastTime = 0;

// Polgonos del rbol (coordenadas SVG originales 500x500)
const ramasFijas = [
    [230,450, 270,450, 255,100, 245,100], 
    [245,310, 100,260, 98,255, 240,290], 
    [160,280, 110,190, 115,188, 170,273], 
    [257,330, 390,270, 388,265, 253,315], 
    [320,295, 340,230, 335,228, 310,290],
    [340,230, 365,225, 365,220, 335,228],
    [247,220, 90,170, 88,165, 245,205], 
    [160,193, 110,95, 115,92, 170,185],
    [252,240, 370,150, 368,145, 250,225], 
    [305,195, 350,105, 345,102, 295,188],
    [246,150, 140,80, 138,75, 248,135],
    [251,160, 320,80, 315,75, 249,145],
    [248,105, 195,45, 190,48, 245,115], 
    [250,110, 275,30, 270,32, 247,115],
    [252,100, 300,50, 295,45, 248,100]
];

// =====================================================
// OPTIMIZACI"N: Pre-renderizar Hoja y Flor (Sprites)
// =====================================================
const leafSprite = document.createElement("canvas");
const leafCtx = leafSprite.getContext("2d");
leafSprite.width = 40;
leafSprite.height = 40;

function preRenderLeaf() {
    const size = 10;
    leafCtx.translate(20, 20); // Centrar en el sprite
    leafCtx.beginPath();
    leafCtx.moveTo(0, 0);
    leafCtx.quadraticCurveTo(size, -size*0.8, size*2, 0);
    leafCtx.quadraticCurveTo(size, size*0.8, 0, 0);
    
    const grad = leafCtx.createLinearGradient(0, -size, size*2, size);
    grad.addColorStop(0, '#5fa743');
    grad.addColorStop(1, '#3b6e26');
    
    leafCtx.fillStyle = grad;
    leafCtx.fill();
}
preRenderLeaf();

const flowerSprite = document.createElement("canvas");
const flowerCtx = flowerSprite.getContext("2d");
flowerSprite.width = 60;
flowerSprite.height = 60;

function preRenderFlower() {
    const r = 12; // Tamaño base del sprite
    flowerCtx.translate(30, 30);
    
    const numPetalos = 16; 
    for (let i = 0; i < numPetalos; i++) {
        const a = i * Math.PI * 2 / numPetalos;
        flowerCtx.save();
        flowerCtx.rotate(a);
        
        flowerCtx.beginPath();
        flowerCtx.moveTo(0, 0);
        flowerCtx.quadraticCurveTo(r*0.4, r*0.3, r*1.2, 0);
        flowerCtx.quadraticCurveTo(r*0.4, -r*0.3, 0, 0);
        
        flowerCtx.fillStyle = '#FFD700'; 
        flowerCtx.fill();
        flowerCtx.restore();
    }
    
    // CENTRO MARR"N DEL GIRASOL
    flowerCtx.beginPath();
    flowerCtx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    flowerCtx.fillStyle = '#3E2723'; 
    flowerCtx.fill();
}
preRenderFlower();

function puntoCorazon(t, escala) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * escala, y: y * escala };
}

function prepararArbol() {
    hojas = [];
    flores = [];
    
    const baseSize = W < 768 ? W * 1.1 : Math.min(W, H);
    // Ajustamos la altura del árbol a la pantalla actual
    const centroX = W / 2;
    // Centro del corazón calculado a partir del tronco para que siempre queden unidos
    const escalaTronco = baseSize * 0.0016; 
    const offsetY = W < 768 ? H * 0.98 : H * 0.92;
    const centroY = offsetY - (290 * escalaTronco); 
    const escalaCorazon = baseSize * 0.024;

    // Cantidades optimizadas para celular vs PC
    const cantidadHojas = isMobile ? 300 : 900;
    const cantidadFlores = isMobile ? 700 : 2000;
    const cantidadCaidas = isMobile ? 15 : 35;

    // FLORES CAYENDO (Desde el árbol)
    floresCayendo = [];
    for (let i = 0; i < cantidadCaidas; i++) {
        const t_corazon = Math.random() * Math.PI * 2;
        const borde_corazon = puntoCorazon(t_corazon, escalaCorazon);
        const factor_c = Math.sqrt(Math.random());
        let x = centroX + borde_corazon.x * factor_c;
        let y = centroY + borde_corazon.y * factor_c;
        floresCayendo.push({
            startX: x,
            startY: y,
            x: x,
            y: y,
            tamao: 3 + Math.random() * 3,
            rotacion: Math.random() * Math.PI * 2,
            velocidadY: 0.8 + Math.random() * 1.5,
            velocidadRotacion: (Math.random() - 0.5) * 0.03
        });
    }

    // HOJAS VERDES (Fondo)
    for (let i = 0; i < cantidadHojas; i++) {
        const t = Math.random() * Math.PI * 2;
        const borde = puntoCorazon(t, escalaCorazon);
        const factor = Math.sqrt(Math.random());
        let x = centroX + borde.x * factor + (Math.random() - .5) * 30;
        let y = centroY + borde.y * factor + (Math.random() - .5) * 30;
        hojas.push({
            x, y,
            tamao: 3 + Math.random() * 7, // Radio lógico
            rotacion: Math.random() * Math.PI * 2,
            retraso: 0.8 + Math.random() * 0.8
        });
    }

    // GIRASOLES (Frente)
    for (let i = 0; i < cantidadFlores; i++) { 
        const t = Math.random() * Math.PI * 2;
        const borde = puntoCorazon(t, escalaCorazon);
        const factor = Math.sqrt(Math.random());
        let x = centroX + borde.x * factor + (Math.random() - .5) * 30;
        let y = centroY + borde.y * factor + (Math.random() - .5) * 30;
        
        flores.push({
            x, y,
            tamao: 4 + Math.random() * 9,
            rotacion: Math.random() * Math.PI * 2,
            retraso: 1.2 + Math.random() * 1.0 
        });
    }
}

function dibujarArbolFijo() {
    // Calculamos escala para adaptar el árbol original a la pantalla actual
    const baseSize = W < 768 ? W * 1.1 : Math.min(W, H);
    const escala = baseSize * 0.0016; 
    const offsetX = W / 2 + desplazamientoX;
    const offsetY = W < 768 ? H * 0.98 : H * 0.92; // Base del árbol

    ctx.fillStyle = "#834D21"; // Mismo color marrn del usuario
    
    // Si el crecimiento es menor a 1, hacemos que el rbol "brote" hacia arriba
    const progresoTronco = Math.min(1, crecimiento * 1.5);
    
    ctx.save();
    // Efecto de crecimiento desde la base
    ctx.translate(offsetX, offsetY);
    ctx.scale(1, progresoTronco);
    ctx.translate(-offsetX, -offsetY);

    for (const rama of ramasFijas) {
        ctx.beginPath();
        for (let i = 0; i < rama.length; i += 2) {
            // El original tena centro en x=250 y base en y=450
            const px = (rama[i] - 250) * escala + offsetX;
            const py = (rama[i+1] - 450) * escala + offsetY;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function dibujarHoja(h, intensidad) {
    const p = Math.min(1, intensidad);
    const escalaEfecto = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; 
    
    // El sprite base es de tamaño 10, la hoja real es h.tamao
    const escalaFinal = (h.tamao / 10) * escalaEfecto;

    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rotacion);
    ctx.scale(escalaFinal, escalaFinal);
    // Dibujar el sprite precargado (centrado)
    ctx.drawImage(leafSprite, -20, -20);
    ctx.restore();
}

function dibujarFlor(f, intensidad) {
    if (intensidad <= 0) return;
    
    const t = Math.min(1, intensidad);
    const escalaEfecto = 1 - Math.pow(1 - t, 3); 
    
    // El sprite base es de radio 12, la flor real es f.tamao
    const escalaFinal = (f.tamao / 12) * escalaEfecto;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotacion + (1 - escalaEfecto) * Math.PI);
    ctx.scale(escalaFinal, escalaFinal);
    ctx.drawImage(flowerSprite, -30, -30);
    ctx.restore();
}

function animar(timestamp) {
    if (!animacionActiva) {
        lastTime = 0;
        return;
    }
    
    if (timestamp === undefined) timestamp = performance.now();
    
    if (!lastTime) lastTime = timestamp;
    // Limitamos dt para evitar saltos enormes si se cambia de pestaña
    let dt = timestamp - lastTime;
    if (dt > 100) dt = 16; 
    lastTime = timestamp;

    ctx.clearRect(0, 0, W, H);
    
    // Originalmente sumaba 0.016 por frame (a 60fps). 
    // Usamos dt para que crezca exactamente al mismo tiempo real, con o sin lag.
    crecimiento += (dt / 1000) * 0.96; // Ajustado para mantener la misma velocidad que antes

    // Lnea de suelo
    const ySuelo = H * 0.92;
    ctx.beginPath();
    ctx.moveTo(0, ySuelo);
    ctx.lineTo(W, ySuelo);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // DIBUJAR TRONCO Y RAMAS
    dibujarArbolFijo();

    // HOJAS (Fondo)
    for (const h of hojas) {
        if (crecimiento > h.retraso) {
            const entrada = Math.min(1, (crecimiento - h.retraso) * 2);
            // Aplicar desplazamiento en tiempo real modificando temporalmente la posicin
            const hDesplazada = { ...h, x: h.x + desplazamientoX };
            dibujarHoja(hDesplazada, entrada);
        }
    }

    // GIRASOLES (Frente)
    for (const f of flores) {
        if (crecimiento > f.retraso) {
            const entrada = Math.min(1, (crecimiento - f.retraso) * 2);
            const fDesplazada = { ...f, x: f.x + desplazamientoX };
            dibujarFlor(fDesplazada, entrada);
        }
    }

    // DESPLAZAMIENTO SUAVE DEL RBOL
    let targetDesplazamiento = 0;
    if (crecimiento > 2.6) {
        // En mvil bajamos menos, en PC 25%
        targetDesplazamiento = W < 768 ? 0 : W * 0.25; 
        
        // El mensaje aparece junto con el desplazamiento con efecto de maquina de escribir
        if (!mensajeMostrado) {
            const finalMsg = document.getElementById('finalMessage');
            finalMsg.classList.add('show');
            finalMsg.innerHTML = ''; // Limpiamos el texto inicial
            
            const texto = "Para la dueña de mi corazón, que sin saberlo ilumina mis días como el sol a estos girasoles y hace mi mundo un poquito más bonito. 🌻❤️";
            let i = 0;
            
            function escribir() {
                if (i < texto.length) {
                    finalMsg.innerHTML = texto.substring(0, i + 1) + '<span class="cursor">_</span>';
                    i++;
                    setTimeout(escribir, 35); // Velocidad a la mitad (más lenta) para cuadrar con la canción
                } else {
                    finalMsg.innerHTML = texto; // Quita el cursor al terminar
                }
            }
            escribir();
            
            mensajeMostrado = true;
        }
    }
    desplazamientoX += (targetDesplazamiento - desplazamientoX) * 0.1;

    // EFECTO DE FLORES CAYENDO
    if (crecimiento > 2.2) {
        ctx.globalAlpha = 0.6; // Suaves y un poco transparentes
        for (const f of floresCayendo) {
            // Ajustar velocidad por dt para que caigan suavemente incluso con lag
            f.y += f.velocidadY * (dt / 16);
            f.rotacion += f.velocidadRotacion * (dt / 16);
            
            // Si sale de la pantalla, vuelve al árbol original
            if (f.y > H + 20) {
                f.y = f.startY;
                f.x = f.startX;
            }
            
            const fDesplazada = { ...f, x: f.x + desplazamientoX };
            dibujarFlor(fDesplazada, 1);
        }
        ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(animar);
}
