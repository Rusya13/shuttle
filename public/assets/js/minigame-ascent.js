const canvas = document.getElementById('minigame-canvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let score = 0;
let altitude = 0;
let frameCount = 0;
let loopId = null;
let lastTime = 0;
let dt = 1; // Delta time factor (1.0 = target 60fps)

// Physics-based shuttle
let shuttle = {
    x: 160,
    y: 0,
    vx: 0,
    targetX: 160,
    baseWidth: 24,
    baseHeight: 36,
    width: 24,
    height: 36,
    accel: 0.8,
    friction: 0.92,
    rotation: 0
};

let obstacles = [];
let particles = [];
let stars = [];
let keys = {};

const shuttleImg = new Image();
shuttleImg.src = '/assets/shuttle.svg';

const obsSources = [
    '/assets/obs_satellite.svg',
    '/assets/obs_rocket.svg',
    '/assets/obs_junk.svg',
    '/assets/obs_solar.svg'
];
const obsImages = obsSources.map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

function getScale() {
    // Base scale on height to ensure UI fits, but use a minimum to avoid tiny elements
    return Math.max(0.5, canvas.height / 320);
}

function resizeCanvas() {
    // Sync internal resolution with CSS/Window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const scale = getScale();
    shuttle.width = shuttle.baseWidth * scale;
    shuttle.height = shuttle.baseHeight * scale;
    shuttle.y = canvas.height - (60 * scale);
    
    // Recalculate stars for new area
    initStars();

    if (!gameRunning && !inGameOverMenu && !inSuccessMenu) {
        shuttle.x = canvas.width / 2;
        shuttle.targetX = canvas.width / 2;
        showStartScreen();
    }
}

window.addEventListener('resize', resizeCanvas);

function initStars() {
    stars = [];
    const count = (canvas.width * canvas.height) / 2000;
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: 0.5 + Math.random() * 3,
            opacity: 0.3 + Math.random() * 0.7
        });
    }
}

let currentLevel = 1;
const levelConfigs = [
    { targetSpeed: 7.70, name: "TROPOSPHERE ASCENT", unexpected: 0 },
    { targetSpeed: 7.90, name: "STRATOSPHERE CROSSING", unexpected: 0 },
    { targetSpeed: 8.20, name: "MESOSPHERE BOUNDARY", unexpected: 0.1 },
    { targetSpeed: 8.50, name: "LOW EARTH ORBIT", unexpected: 0.2 },
    { targetSpeed: 8.90, name: "THERMOSPHERE STABILIZATION", unexpected: 0.3 },
    { targetSpeed: 9.30, name: "MEDIUM EARTH ORBIT", unexpected: 0.5 },
    { targetSpeed: 9.80, name: "EXOSPHERE VENTURE", unexpected: 0.7 },
    { targetSpeed: 10.4, name: "GEOSTATIONARY ORBIT", unexpected: 1.0 },
    { targetSpeed: 11.0, name: "LUNAR TRANSFER TRAJECTORY", unexpected: 1.3 },
    { targetSpeed: 11.8, name: "ESCAPE VELOCITY", unexpected: 1.5 }
];

function initGame() {
    if (loopId) cancelAnimationFrame(loopId);
    inGameOverMenu = false;
    inSuccessMenu = false;
    
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.style.display = 'none';

    score = 0;
    altitude = 0;
    shuttle.x = canvas.width / 2;
    shuttle.vx = 0;
    shuttle.targetX = canvas.width / 2;
    obstacles = [];
    particles = [];
    initStars();
    gameRunning = true;
    loopId = requestAnimationFrame(gameLoop);
}

function createParticle(xOffset, yOffset, rotation) {
    const scale = getScale();
    const rx = (xOffset * scale) * Math.cos(rotation) - (yOffset * scale) * Math.sin(rotation);
    const ry = (xOffset * scale) * Math.sin(rotation) + (yOffset * scale) * Math.cos(rotation);
    const driftX = -Math.sin(rotation) * 4;
    const driftY = Math.cos(rotation) * 4;

    particles.push({
        x: shuttle.x + rx,
        y: shuttle.y + shuttle.height / 2 + ry,
        vx: (Math.random() - 0.5) * 1 + driftX * 0.2,
        vy: 3 + Math.random() * 2 + driftY * 0.5,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.05,
        size: (3 + Math.random() * 4) * scale,
        color: Math.random() > 0.5 ? '#ff6600' : '#ffcc00'
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    ctx.save();
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1.0;
}

function drawShuttle() {
    shuttle.rotation = shuttle.vx * 0.05;
    const scale = getScale();
    
    if (gameRunning && frameCount % 1 === 0) {
        createParticle(-4, shuttle.height / 2 / scale - 2, shuttle.rotation);
        createParticle(4, shuttle.height / 2 / scale - 2, shuttle.rotation);
    }

    ctx.save();
    ctx.translate(shuttle.x, shuttle.y + shuttle.height / 2);
    ctx.rotate(shuttle.rotation);
    
    if (gameRunning) {
        ctx.shadowBlur = 15 * scale;
        ctx.shadowColor = '#ff6600';
    }

    if (shuttleImg.complete) {
        ctx.drawImage(shuttleImg, -shuttle.width / 2, -shuttle.height / 2, shuttle.width, shuttle.height);
    }
    
    ctx.restore();
    ctx.shadowBlur = 0; 
}

let spawnTimer = 0;
function spawnObstacle() {
    const scale = getScale();
    const config = levelConfigs[Math.min(currentLevel - 1, levelConfigs.length - 1)];
    const speedFactor = 1 + (altitude / 10000);
    const spawnRate = Math.max(15, Math.floor(80 / speedFactor));
    
    spawnTimer += dt;
    if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        const size = (30 + Math.random() * 20) * scale;
        const imgIndex = Math.floor(Math.random() * obsImages.length);
        const horizontalDrift = (Math.random() - 0.5) * 2 * config.unexpected * scale;
        
        obstacles.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            vx: horizontalDrift,
            width: size,
            height: size,
            speed: (2.5 + Math.random() * 2) * speedFactor * scale,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            imgIndex: imgIndex
        });
    }
}

function drawObstacles() {
    obstacles.forEach((obs, index) => {
        obs.y += obs.speed * dt;
        obs.x += (obs.vx || 0) * dt;
        obs.rot += obs.rotSpeed * dt;
        
        const img = obsImages[obs.imgIndex];
        
        ctx.save();
        ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
        ctx.rotate(obs.rot);
        
        if (img.complete) {
            ctx.drawImage(img, -obs.width/2, -obs.height/2, obs.width, obs.height);
        } else {
            ctx.fillStyle = '#555';
            ctx.fillRect(-obs.width/2, -obs.height/2, obs.width, obs.height);
        }
        
        ctx.restore();

        const dx = shuttle.x - (obs.x + obs.width/2);
        const dy = (shuttle.y + shuttle.height/2) - (obs.y + obs.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (obs.width/2.2 + shuttle.width/3)) {
            gameOver();
        }

        if (obs.y > canvas.height + 100) {
            obstacles.splice(index, 1);
            score += 10;
        }
    });
}

function drawBackground() {
    if (inSuccessMenu) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    const speedFactor = 1 + (altitude / 10000);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#000814');
    grad.addColorStop(1, '#001d3d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
        star.y += star.speed * speedFactor * dt;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = '#fff';
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1.0;
}

function drawHUD() {
    const scale = getScale();
    ctx.strokeStyle = 'rgba(130, 77, 255, 0.4)';
    ctx.lineWidth = 1 * scale;

    const margin = 10 * scale;
    const len = 15 * scale;
    
    ctx.beginPath();
    ctx.moveTo(margin, margin + len); ctx.lineTo(margin, margin); ctx.lineTo(margin + len, margin);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width - margin, margin + len); ctx.lineTo(canvas.width - margin, margin); ctx.lineTo(canvas.width - margin - len, margin);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(margin, canvas.height - margin - len); ctx.lineTo(margin, canvas.height - margin); ctx.lineTo(margin + len, canvas.height - margin);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width - margin, canvas.height - margin - len); ctx.lineTo(canvas.width - margin, canvas.height - margin); ctx.lineTo(canvas.width - margin - len, canvas.height - margin);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for(let i = 0; i < canvas.height; i += Math.max(1, 4 * scale)) {
        ctx.fillRect(0, i, canvas.width, 1 * scale);
    }
}

function drawUI() {
    const scale = getScale();
    drawHUD();
    const config = levelConfigs[Math.min(currentLevel - 1, levelConfigs.length - 1)];
    const kmSpeed = parseFloat((7.4 + (altitude / 3000)).toFixed(2));

    ctx.textAlign = 'left';
    ctx.font = `${Math.floor(10 * scale)}px monospace`;
    
    // Top Left: Mission Info
    ctx.fillStyle = '#824dff';
    ctx.fillText(`MISSION ${currentLevel}`, 15 * scale, 25 * scale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(config.name, 15 * scale, 37 * scale);
    
    if (config.unexpected > 0) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText("⚠ UNEXPECTED TRAJECTORIES", 15 * scale, 49 * scale);
    }

    // Bottom Left: Live Telemetry
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.floor(11 * scale)}px monospace`;
    ctx.fillText(`▲ ${Math.ceil(altitude).toString().padStart(5, '0')}m`, 15 * scale, canvas.height - (30 * scale));
    ctx.fillStyle = '#824dff';
    ctx.fillText(`⚡ ${Math.ceil(kmSpeed)}km/s`, 15 * scale, canvas.height - (18 * scale));

    // Progress Bar
    const progress = Math.min(1, (kmSpeed - 7.4) / (config.targetSpeed - 7.4));
    ctx.fillStyle = 'rgba(130, 77, 255, 0.2)';
    ctx.fillRect(15 * scale, canvas.height - (12 * scale), 80 * scale, 2 * scale);
    ctx.fillStyle = '#824dff';
    ctx.fillRect(15 * scale, canvas.height - (12 * scale), (80 * progress) * scale, 2 * scale);

    if (kmSpeed >= config.targetSpeed) {
        missionComplete();
    }

    // Right Side: Velocity Vector
    const barX = canvas.width - (15 * scale);
    ctx.fillStyle = 'rgba(130, 77, 255, 0.1)';
    ctx.fillRect(barX, canvas.height/2 - (40 * scale), 2 * scale, 80 * scale);
    const speedH = Math.min(80 * scale, Math.abs(shuttle.vx) * 8);
    ctx.fillStyle = '#824dff';
    ctx.fillRect(barX, canvas.height/2 + (40 * scale) - speedH, 2 * scale, speedH);
}

let menuSelection = 0;
let inGameOverMenu = false;
let inSuccessMenu = false;
const menuOptions = ['RETRY MISSION', 'RESTART PROGRAM', 'ABORT TO HUD'];
const successOptions = ['NEXT MISSION', 'ABORT TO HUD'];

function missionComplete() {
    gameRunning = false;
    inSuccessMenu = true;
    menuSelection = 0;
    showMonitorOverlay(true);
}

function gameOver() {
    gameRunning = false;
    inGameOverMenu = true;
    menuSelection = 0;
    showMonitorOverlay(false);
}

function showMonitorOverlay(isSuccess) {
    const videoOverlay = document.getElementById('video-overlay');
    const video = document.getElementById('monitor-video');
    const title = document.getElementById('monitor-title');
    const stats = document.getElementById('monitor-stats');
    
    if (!videoOverlay || !video) return;

    videoOverlay.style.display = 'flex';
    video.src = isSuccess ? '/assets/video/success.mp4' : '/assets/video/failure.mp4';
    video.currentTime = 0;
    video.muted = false;
    video.loop = true;
    video.play().catch(e => {
        console.log("Video autoplay with sound failed, trying muted:", e);
        video.muted = true;
        video.play();
    });

    if (isSuccess) {
        title.innerText = 'MISSION ACCOMPLISHED';
        title.className = 'success';
        const config = levelConfigs[Math.min(currentLevel - 1, levelConfigs.length - 1)];
        stats.innerText = `${config.name} - ${Math.ceil(config.targetSpeed)}km/s REACHED`;
    } else {
        title.innerText = 'MISSION FAILED';
        title.className = 'failure';
        stats.innerText = `LVL: ${currentLevel} | ALT: ${Math.ceil(altitude)}m`;
    }
    
    updateMonitorMenuHTML();
}

function updateMonitorMenuHTML() {
    const optionsContainer = document.getElementById('monitor-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    const options = inSuccessMenu ? successOptions : menuOptions;
    
    options.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = `monitor-option ${i === menuSelection ? 'selected' : ''}`;
        div.innerText = i === menuSelection ? `> ${opt} <` : opt;
        div.onclick = () => {
            menuSelection = i;
            if (inSuccessMenu) handleSuccessSelect();
            else handleMenuSelect();
        };
        optionsContainer.appendChild(div);
    });
}

function drawSuccessMenu() {
    if (!inSuccessMenu) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(drawSuccessMenu);
}

function handleSuccessSelect() {
    inSuccessMenu = false;
    hideMonitorOverlay();

    if (menuSelection === 0) { // Next
        currentLevel++;
        initGame();
    } else { // Abort
        window.parent.postMessage('closeMinigame', '*');
    }
}

function drawGameOverMenu() {
    if (!inGameOverMenu) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(drawGameOverMenu);
}

function handleMenuSelect() {
    inGameOverMenu = false;
    hideMonitorOverlay();

    if (menuSelection === 0) { // Retry
        initGame();
    } else if (menuSelection === 1) { // Restart
        currentLevel = 1;
        initGame();
    } else if (menuSelection === 2) { // Abort
        window.parent.postMessage('closeMinigame', '*');
    }
}

function hideMonitorOverlay() {
    const videoOverlay = document.getElementById('video-overlay');
    const video = document.getElementById('monitor-video');
    if (videoOverlay && video) {
        videoOverlay.style.display = 'none';
        video.pause();
    }
}

function update() {
    frameCount++;
    altitude += 1.5 * dt;
    const scale = getScale();
    
    const kbSpeed = 5 * scale * dt;
    if (keys['ArrowLeft'] || keys['a']) shuttle.targetX -= kbSpeed;
    if (keys['ArrowRight'] || keys['d']) shuttle.targetX += kbSpeed;
    shuttle.targetX = Math.max(shuttle.width, Math.min(canvas.width - shuttle.width, shuttle.targetX));

    const oldX = shuttle.x;
    // Using simple lerp scaling for performance, cap to prevent overshooting
    const lerpFactor = Math.min(0.99, 0.15 * dt);
    shuttle.x += (shuttle.targetX - shuttle.x) * lerpFactor;
    shuttle.vx = (shuttle.x - oldX) / dt; // Normalize vx for drawing logic

    if (shuttle.x < shuttle.width) shuttle.x = shuttle.width;
    if (shuttle.x > canvas.width - shuttle.width) shuttle.x = canvas.width - shuttle.width;

    updateParticles();
    spawnObstacle();
}

function gameLoop(timestamp) {
    if (!gameRunning) {
        lastTime = 0;
        return;
    }

    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    lastTime = timestamp;
    
    // Normalize dt: 1.0 means exactly 60fps. 2.0 means 30fps (needs 2x movement).
    // Cap at 3.0 to prevent huge jumps if the tab was suspended
    dt = Math.min(3.0, elapsed / (1000 / 60));

    update();
    drawBackground();
    drawParticles();
    drawObstacles();
    drawShuttle();
    drawUI();

    loopId = requestAnimationFrame(gameLoop);
}

function showStartScreen() {
    initStars();
    drawBackground();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = getScale();
    
    // Logo block: [Icon] shuttle
    ctx.font = `600 ${Math.floor(38 * scale)}px Montserrat, sans-serif`;
    const textWidth = ctx.measureText('shuttle').width;
    const iconSize = 34 * scale;
    const spacing = 12 * scale;
    const totalWidth = iconSize + spacing + textWidth;
    let startX = centerX - totalWidth / 2;
    const logoY = centerY - (60 * scale);

    if (shuttleImg.complete) {
        ctx.save();
        ctx.translate(startX + iconSize/2, logoY - (8 * scale));
        ctx.rotate(-Math.PI / 4);
        ctx.drawImage(shuttleImg, -iconSize/2, -iconSize/2, iconSize, iconSize * 1.4);
        ctx.restore();
    }

    const grad = ctx.createLinearGradient(startX + iconSize + spacing, 0, startX + totalWidth, 0);
    grad.addColorStop(0, '#824dff');
    grad.addColorStop(1, '#c800ff');
    
    ctx.textAlign = 'left';
    ctx.fillStyle = grad;
    ctx.fillText('shuttle', startX + iconSize + spacing, logoY + (15 * scale));
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.floor(28 * scale)}px Montserrat, sans-serif`;
    ctx.letterSpacing = `${Math.floor(4 * scale)}px`;
    ctx.fillText('ASCENT', centerX, logoY + (55 * scale));
    ctx.letterSpacing = "0px";
    
    ctx.font = `400 ${Math.floor(14 * scale)}px Montserrat, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Dodge the debris!', centerX, centerY + (20 * scale));
    
    ctx.fillStyle = '#824dff';
    ctx.font = `600 ${Math.floor(12 * scale)}px Montserrat, sans-serif`;
    ctx.fillText('Use Mouse or Arrow Keys', centerX, centerY + (45 * scale));
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `500 ${Math.floor(10 * scale)}px Montserrat, sans-serif`;
    ctx.fillText('Press ENTER to Launch', centerX, centerY + (80 * scale));
}

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (inGameOverMenu) {
        if (e.key === 'ArrowUp') {
            menuSelection = (menuSelection - 1 + menuOptions.length) % menuOptions.length;
            updateMonitorMenuHTML();
        }
        if (e.key === 'ArrowDown') {
            menuSelection = (menuSelection + 1) % menuOptions.length;
            updateMonitorMenuHTML();
        }
        if (e.key === 'Enter') handleMenuSelect();
        return;
    }

    if (inSuccessMenu) {
        if (e.key === 'ArrowUp') {
            menuSelection = (menuSelection - 1 + successOptions.length) % successOptions.length;
            updateMonitorMenuHTML();
        }
        if (e.key === 'ArrowDown') {
            menuSelection = (menuSelection + 1) % successOptions.length;
            updateMonitorMenuHTML();
        }
        if (e.key === 'Enter') handleSuccessSelect();
        return;
    }

    if (!gameRunning) {
        if (e.key === 'Enter' || e.key === ' ') initGame();
        if (e.key === 'Escape') window.parent.postMessage('closeMinigame', '*');
        return;
    }
    
    if (e.key === 'Escape') {
        gameRunning = false;
        window.parent.postMessage('closeMinigame', '*');
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scale = getScale();

    if (inGameOverMenu || inSuccessMenu) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        if (Math.abs(mouseX - centerX) < 100 * scale) {
            const options = inSuccessMenu ? successOptions : menuOptions;
            const offset = inSuccessMenu ? (45 * scale) : (20 * scale);
            const itemH = 30 * scale;

            for (let i = 0; i < options.length; i++) {
                const yMin = centerY + offset + (i * itemH);
                const yMax = yMin + itemH;
                if (mouseY > yMin && mouseY < yMax) {
                    if (menuSelection !== i) {
                        menuSelection = i;
                        updateMonitorMenuHTML();
                    }
                }
            }
        }
        return;
    }

    if (!gameRunning) return;
    shuttle.targetX = mouseX;
});

canvas.addEventListener('click', (e) => {
    if (inGameOverMenu) handleMenuSelect();
    if (inSuccessMenu) handleSuccessSelect();
});

window.startMinigame = initGame;
window.addEventListener('load', () => {
    resizeCanvas();
    initStars();
    showStartScreen();
});