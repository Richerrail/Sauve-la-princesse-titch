// 🎮 Sauve la Princesse Titch !
// Avec SYNTHÈSE VOCALE et BOOZER au niveau final !

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ============ SYNTHÈSE VOCALE ============
let speechEnabled = false;
let speechQueue = [];
let isSpeaking = false;

function initSpeech() {
    if ('speechSynthesis' in window) {
        speechEnabled = true;
        // Vérifier si on a des voix françaises
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }
}

function speak(text, pitch = 1.2, rate = 1.1) {
    if (!speechEnabled || !window.speechSynthesis) return;
    
    // Annuler la parole précédente pour ne pas encombrer
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.pitch = pitch; // Plus haut = voix plus aiguë
    utterance.rate = rate;   // Vitesse
    utterance.volume = 1;
    
    // Essayer de trouver une voix française féminine
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.includes('fr'));
    if (frenchVoice) {
        utterance.voice = frenchVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

// ============ SYSTÈME AUDIO ============
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let musicEnabled = true;
let musicInterval = null;

// Mélodies romantiques/amoureuses style Mario
const melodies = [
    // Niveau 1 - Prairie
    [
        {note: 523.25, duration: 300}, {note: 587.33, duration: 300},
        {note: 659.25, duration: 300}, {note: 783.99, duration: 400},
        {note: 659.25, duration: 300}, {note: 783.99, duration: 600},
    ],
    // Niveau 2 - Forêt
    [
        {note: 440, duration: 400}, {note: 523.25, duration: 400},
        {note: 659.25, duration: 400}, {note: 783.99, duration: 600},
        {note: 659.25, duration: 400}, {note: 523.25, duration: 600},
    ],
    // Niveau 3 - Désert
    [
        {note: 523.25, duration: 250}, {note: 523.25, duration: 250},
        {note: 659.25, duration: 250}, {note: 587.33, duration: 250},
        {note: 523.25, duration: 250}, {note: 698.46, duration: 500},
        {note: 659.25, duration: 500},
    ],
    // Niveau 4 - Glace
    [
        {note: 783.99, duration: 300}, {note: 880, duration: 300},
        {note: 987.77, duration: 300}, {note: 1046.50, duration: 500},
        {note: 987.77, duration: 300}, {note: 880, duration: 500},
    ],
    // Niveau 5 - Château final
    [
        {note: 523.25, duration: 200}, {note: 659.25, duration: 200},
        {note: 783.99, duration: 200}, {note: 1046.50, duration: 400},
        {note: 783.99, duration: 200}, {note: 1046.50, duration: 600},
    ]
];

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    initSpeech();
}

function playNote(frequency, duration, type = 'sine') {
    if (!audioCtx || !musicEnabled) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration / 1000);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration / 1000);
}

function playCollectSound() {
    if (!audioCtx) initAudio();
    playNote(880, 150, 'sine');
    setTimeout(() => playNote(1174.66, 200, 'sine'), 100);
    // Héros qui parle
    const heroPhrases = ["Wouhou !", "Génial !", "Super !", "Gagné !"];
    speak(heroPhrases[Math.floor(Math.random() * heroPhrases.length)], 1.4, 1.2);
}

function playVictoryMusic() {
    if (!audioCtx) initAudio();
    [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50].forEach((freq, i) => {
        setTimeout(() => playNote(freq, 300, 'triangle'), i * 150);
    });
}

function playBoozerDefeatSound() {
    // Son comique quand Boozer perd
    [200, 150, 100, 80].forEach((freq, i) => {
        setTimeout(() => playNote(freq, 200, 'sawtooth'), i * 100);
    });
}

function startLevelMusic() {
    if (!audioCtx) initAudio();
    if (musicInterval) clearInterval(musicInterval);
    
    const melody = melodies[currentLevelIndex] || melodies[0];
    let noteIndex = 0;
    
    musicInterval = setInterval(() => {
        if (!gameRunning || !musicEnabled) return;
        const note = melody[noteIndex];
        playNote(note.note, note.duration, 'sine');
        noteIndex = (noteIndex + 1) % melody.length;
    }, 500);
}

function stopMusic() {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

// ============ CŒURS PARTICULES ============
let hearts = [];

// ============ SCÈNE FINALE ============
let finaleScene = false;
let finaleStep = 0;
let finaleTimer = 0;
let heroOnTower = false;
let princessOnTower = false;
let towerHearts = [];

function createHeart(x, y, emoji = '❤️') {
    hearts.push({
        x: x,
        y: y,
        size: Math.random() * 15 + 10,
        speedY: -Math.random() * 2 - 1,
        speedX: (Math.random() - 0.5) * 2,
        life: 100,
        emoji: emoji
    });
}

function updateHearts() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        h.x += h.speedX;
        h.y += h.speedY;
        h.life--;
        if (h.life <= 0) {
            hearts.splice(i, 1);
        }
    }
}

function drawHearts() {
    ctx.save();
    ctx.font = '24px Arial';
    hearts.forEach(h => {
        const alpha = h.life / 100;
        ctx.globalAlpha = alpha;
        ctx.fillText(h.emoji, h.x - cameraX, h.y);
    });
    ctx.restore();
}

// Dimensions du jeu
const GAME_WIDTH = 2200; // Plus large pour le niveau final
const GAME_HEIGHT = 400;
const GROUND_Y = 320;

// ============ SYSTÈME DE NIVEAUX ============
const levels = [
    {
        name: "La Prairie Ensoleillée",
        emoji: "☀️",
        skyColor: ['#87CEEB', '#87CEEB'],
        groundColor: '#228B22',
        grassColor: '#7CFC00',
        groundDetail: '#32CD32',
        clouds: true,
        decorations: 'flowers',
        hasBoozer: false,
        enemies: [
            { x: 300, y: GROUND_Y - 45, type: 'ghost' },
            { x: 700, y: GROUND_Y - 40, type: 'slime' },
            { x: 1100, y: GROUND_Y - 45, type: 'ghost' },
            { x: 1500, y: GROUND_Y - 40, type: 'slime' }
        ],
        stars: [300, 600, 900, 1200, 1500, 1700],
        castle: { x: 1850, color: '#8B4513' }
    },
    {
        name: "La Forêt Magique",
        emoji: "🌲",
        skyColor: ['#98D8C8', '#7FBFB0'],
        groundColor: '#4A6741',
        grassColor: '#6B8E23',
        groundDetail: '#556B2F',
        clouds: true,
        decorations: 'trees',
        hasBoozer: false,
        enemies: [
            { x: 350, y: GROUND_Y - 45, type: 'ghost' },
            { x: 650, y: GROUND_Y - 40, type: 'snail' },
            { x: 950, y: GROUND_Y - 45, type: 'ghost' },
            { x: 1300, y: GROUND_Y - 40, type: 'snail' },
            { x: 1600, y: GROUND_Y - 45, type: 'ghost' }
        ],
        stars: [250, 550, 800, 1150, 1400, 1750],
        castle: { x: 1880, color: '#5D4E37' }
    },
    {
        name: "Le Désert Doré",
        emoji: "🌵",
        skyColor: ['#FFE4B5', '#FFDAB9'],
        groundColor: '#DEB887',
        grassColor: '#F4A460',
        groundDetail: '#D2691E',
        clouds: false,
        decorations: 'cactus',
        hasBoozer: false,
        enemies: [
            { x: 280, y: GROUND_Y - 40, type: 'slime' },
            { x: 600, y: GROUND_Y - 50, type: 'cactus' },
            { x: 900, y: GROUND_Y - 40, type: 'slime' },
            { x: 1250, y: GROUND_Y - 50, type: 'cactus' },
            { x: 1550, y: GROUND_Y - 40, type: 'slime' }
        ],
        stars: [200, 500, 800, 1100, 1450, 1700],
        castle: { x: 1860, color: '#CD853F' }
    },
    {
        name: "La Montagne de Glace",
        emoji: "❄️",
        skyColor: ['#E0F6FF', '#B0E0E6'],
        groundColor: '#B0C4DE',
        grassColor: '#E6E6FA',
        groundDetail: '#87CEEB',
        clouds: true,
        decorations: 'snow',
        hasBoozer: false,
        enemies: [
            { x: 320, y: GROUND_Y - 45, type: 'ghost' },
            { x: 650, y: GROUND_Y - 45, type: 'ghost' },
            { x: 1000, y: GROUND_Y - 40, type: 'snowman' },
            { x: 1350, y: GROUND_Y - 45, type: 'ghost' },
            { x: 1650, y: GROUND_Y - 40, type: 'snowman' }
        ],
        stars: [220, 520, 820, 1180, 1480, 1720],
        castle: { x: 1870, color: '#708090' }
    },
    {
        name: "Le Château de Boozer",
        emoji: "🏰",
        skyColor: ['#483D8B', '#6A5ACD'],
        groundColor: '#2F2F2F',
        grassColor: '#4A4A4A',
        groundDetail: '#1F1F1F',
        clouds: false,
        decorations: 'skulls',
        hasBoozer: true, // BOOZER EST LÀ !
        boozer: { x: 1700, y: GROUND_Y - 80 },
        enemies: [
            { x: 250, y: GROUND_Y - 45, type: 'ghost' },
            { x: 500, y: GROUND_Y - 45, type: 'ghost' },
            { x: 800, y: GROUND_Y - 45, type: 'ghost' },
            { x: 1100, y: GROUND_Y - 45, type: 'ghost' },
            { x: 1400, y: GROUND_Y - 45, type: 'ghost' }
        ],
        stars: [200, 450, 700, 950, 1250, 1500],
        castle: { x: 2000, color: '#4B0082', final: true } // Château plus loin
    }
];

// État du jeu
let currentLevelIndex = 0;
let gameRunning = true;
let keys = { left: false, right: false };
let cameraX = 0;
let boozerDefeated = false;
let boozerRunning = false;

// Le héros
const player = {
    x: 50,
    y: GROUND_Y - 50,
    width: 40,
    height: 50,
    speed: 3,
    frame: 0,
    starsCollected: 0
};

// Boozer (le boss final)
let boozer = {
    x: 1700,
    y: GROUND_Y - 80,
    width: 60,
    height: 80,
    frame: 0,
    defeated: false,
    runAway: false
};

// Données du niveau actuel
let currentEnemies = [];
let currentStars = [];
let princess = { x: 2100, y: GROUND_Y - 60, width: 35, height: 60, frame: 0 };
let castle = { x: 2000, y: GROUND_Y - 150, width: 120, height: 150 };

// Nuages
let clouds = [];

// ============ INITIALISATION ============
function initLevel(levelIndex) {
    const level = levels[levelIndex];
    currentLevelIndex = levelIndex;
    
    // Reset joueur
    player.x = 50;
    player.starsCollected = 0;
    player.frame = 0;
    cameraX = 0;
    
    // Reset effets
    hearts = [];
    boozerDefeated = false;
    boozerRunning = false;
    finaleScene = false;
    finaleStep = 0;
    heroOnTower = false;
    princessOnTower = false;
    
    // Créer les ennemis
    currentEnemies = level.enemies.map((e, i) => ({
        x: e.x,
        y: e.y,
        width: e.type === 'cactus' || e.type === 'snowman' ? 40 : (e.type === 'snail' ? 35 : 40),
        height: e.type === 'cactus' || e.type === 'snowman' ? 50 : (e.type === 'snail' ? 30 : 45),
        type: e.type,
        frame: i * 10
    }));
    
    // Créer les étoiles
    currentStars = level.stars.map(x => ({
        x: x,
        y: GROUND_Y - 35,
        collected: false
    }));
    
    // Position du château
    castle.x = level.castle.x;
    castle.color = level.castle.color;
    
    // Position de la princesse
    princess.x = level.castle.x + 100;
    
    // Boozer pour le niveau final
    if (level.hasBoozer && level.boozer) {
        boozer.x = level.boozer.x;
        boozer.y = level.boozer.y;
        boozer.defeated = false;
        boozer.runAway = false;
    }
    
    // Nuages
    clouds = [
        { x: 100, y: 50, size: 1 },
        { x: 400, y: 80, size: 0.8 },
        { x: 800, y: 40, size: 1.2 },
        { x: 1200, y: 70, size: 0.9 },
        { x: 1600, y: 55, size: 1 }
    ];
    
    gameRunning = true;
    startLevelMusic();
}

// ============ CONTRÔLES ============
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// Contrôles tactiles
document.getElementById('btn-left').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.left = true;
    initAudio();
});
document.getElementById('btn-left').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.left = false;
});
document.getElementById('btn-left').addEventListener('mousedown', () => {
    keys.left = true;
    initAudio();
});
document.getElementById('btn-left').addEventListener('mouseup', () => keys.left = false);

document.getElementById('btn-right').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.right = true;
    initAudio();
});
document.getElementById('btn-right').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.right = false;
});
document.getElementById('btn-right').addEventListener('mousedown', () => {
    keys.right = true;
    initAudio();
});
document.getElementById('btn-right').addEventListener('mouseup', () => keys.right = false);

canvas.addEventListener('click', initAudio);

// ============ DESSIN ============
function drawPlayer() {
    // Ne pas dessiner le joueur s'il est sur la tour (scène finale)
    if (heroOnTower) return;
    
    const bounce = Math.sin(player.frame * 0.2) * 3;
    const x = player.x - cameraX;
    const y = player.y + bounce;
    
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x + 5, y + 15, 30, 30);
    ctx.fillStyle = '#FFCCAA';
    ctx.fillRect(x + 8, y + 5, 24, 20);
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(x + 5, y + 2, 30, 8);
    ctx.fillRect(x + 5, y + 8, 32, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 12, y + 10, 4, 6);
    ctx.fillRect(x + 22, y + 10, 4, 6);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 14, y + 18, 12, 4);
    ctx.fillStyle = '#FFCCAA';
    ctx.fillRect(x, y + 20, 5, 15);
    ctx.fillRect(x + 35, y + 20, 5, 15);
    ctx.fillStyle = '#0000CC';
    ctx.fillRect(x + 8, y + 40, 8, 10);
    ctx.fillRect(x + 24, y + 40, 8, 10);
}

// Dessiner Boozer (le monstre méchant mais mignon)
function drawBoozer() {
    if (boozer.defeated) return;
    
    const x = boozer.x - cameraX;
    const y = boozer.y;
    const bounce = Math.sin(boozer.frame * 0.1) * 5;
    
    // Corps violet
    ctx.fillStyle = '#4B0082';
    ctx.beginPath();
    ctx.ellipse(x + boozer.width/2, y + boozer.height - 10 + bounce, boozer.width/2, boozer.height/2, 0, Math.PI, 0);
    ctx.fill();
    
    // Cornes
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 15 + bounce);
    ctx.lineTo(x + 5, y - 5 + bounce);
    ctx.lineTo(x + 20, y + 10 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + boozer.width - 10, y + 15 + bounce);
    ctx.lineTo(x + boozer.width - 5, y - 5 + bounce);
    ctx.lineTo(x + boozer.width - 20, y + 10 + bounce);
    ctx.fill();
    
    // Yeux méchants mais drôles
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 25 + bounce, 8, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(x + boozer.width - 18, y + 25 + bounce, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x + 18, y + 25 + bounce, 3, 0, Math.PI * 2);
    ctx.arc(x + boozer.width - 18, y + 25 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Dents
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 50 + bounce);
    ctx.lineTo(x + 25, y + 60 + bounce);
    ctx.lineTo(x + 30, y + 50 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + boozer.width - 30, y + 50 + bounce);
    ctx.lineTo(x + boozer.width - 25, y + 60 + bounce);
    ctx.lineTo(x + boozer.width - 20, y + 50 + bounce);
    ctx.fill();
    
    // Bras
    ctx.fillStyle = '#4B0082';
    ctx.fillRect(x - 10, y + 30 + bounce, 15, 25);
    ctx.fillRect(x + boozer.width - 5, y + 30 + bounce, 15, 25);
    
    // Nom "BOOZER" au-dessus
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Comic Sans MS, cursive';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('👹 BOOZER', x + 5, y - 15 + bounce);
    ctx.fillText('👹 BOOZER', x + 5, y - 15 + bounce);
}

function drawEnemy(enemy) {
    const x = enemy.x - cameraX;
    const y = enemy.y + Math.sin(enemy.frame * 0.15) * 5;
    
    if (enemy.type === 'ghost') {
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(x + enemy.width/2, y + enemy.height/2, enemy.width/2, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x, y + enemy.height/2, enemy.width, enemy.height/2);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 12, y + 18, 4, 0, Math.PI * 2);
        ctx.arc(x + 28, y + 18, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + enemy.width/2, y + 22, 8, 0, Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(x + 8, y + 20, 4, 0, Math.PI * 2);
        ctx.arc(x + 32, y + 20, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (enemy.type === 'slime') {
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(x + enemy.width/2, y + enemy.height, enemy.width/2, enemy.height/2, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 15, 6, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 25, y + 15, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 10, y + 15, 3, 0, Math.PI * 2);
        ctx.arc(x + 25, y + 15, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (enemy.type === 'snail') {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x + 20, y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 25, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 5, y + 20, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (enemy.type === 'cactus') {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x + 15, y, 10, 50);
        ctx.fillRect(x + 5, y + 15, 10, 8);
        ctx.fillRect(x + 25, y + 10, 10, 8);
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.arc(x + 20, y + 10, 3, 0, Math.PI * 2);
        ctx.arc(x + 8, y + 20, 2, 0, Math.PI * 2);
        ctx.arc(x + 32, y + 15, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (enemy.type === 'snowman') {
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + 20, y + 35, 15, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 15, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x + 28, y + 15);
        ctx.lineTo(x + 35, y + 17);
        ctx.lineTo(x + 28, y + 19);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 17, y + 12, 2, 0, Math.PI * 2);
        ctx.arc(x + 23, y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawStar(star) {
    if (star.collected) return;
    const twinkle = Math.sin(Date.now() / 200) * 3;
    const x = star.x - cameraX;
    const y = star.y + twinkle;
    
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * 15;
        const py = y + Math.sin(angle) * 15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawCastle() {
    const x = castle.x - cameraX;
    const level = levels[currentLevelIndex];
    
    ctx.fillStyle = level.castle.color;
    ctx.fillRect(x, castle.y + 50, castle.width, castle.height - 50);
    ctx.fillRect(x, castle.y, 30, castle.height);
    ctx.fillRect(x + castle.width - 30, castle.y, 30, castle.height);
    ctx.fillRect(x + castle.width/2 - 20, castle.y + 20, 40, castle.height - 20);
    
    ctx.fillStyle = level.castle.final ? '#FF1493' : '#4B0082';
    ctx.beginPath();
    ctx.moveTo(x - 5, castle.y);
    ctx.lineTo(x + 15, castle.y - 30);
    ctx.lineTo(x + 35, castle.y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + castle.width - 35, castle.y);
    ctx.lineTo(x + castle.width - 15, castle.y - 30);
    ctx.lineTo(x + castle.width + 5, castle.y);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#2F1810';
    ctx.beginPath();
    ctx.arc(x + castle.width/2, castle.y + castle.height, 25, Math.PI, 0);
    ctx.fill();
    
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 15, castle.y - 30);
    ctx.lineTo(x + 15, castle.y - 60);
    ctx.stroke();
    ctx.fillStyle = level.castle.final ? '#FFD700' : '#FF1493';
    ctx.fillRect(x + 15, castle.y - 60, 25, 15);
    
    // Texte "CHÂTEAU" si c'est le final
    if (level.castle.final) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Comic Sans MS, cursive';
        ctx.fillText('🏰 CHÂTEAU', x + 25, castle.y - 70);
    }
}

function drawPrincess() {
    // Ne pas dessiner la princesse si elle est sur la tour (scène finale)
    if (princessOnTower) return;
    
    const wave = Math.sin(princess.frame * 0.1) * 5;
    const x = princess.x - cameraX;
    const y = princess.y;
    
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.moveTo(x + princess.width/2, y);
    ctx.lineTo(x, y + princess.height);
    ctx.lineTo(x + princess.width, y + princess.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFCCAA';
    ctx.fillRect(x + 8, y + 5, 20, 18);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8);
    ctx.lineTo(x + 10, y - 5);
    ctx.lineTo(x + 15, y + 8);
    ctx.lineTo(x + 20, y - 5);
    ctx.lineTo(x + 25, y + 8);
    ctx.lineTo(x + 30, y - 5);
    ctx.lineTo(x + 31, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 11, y + 10, 4, 5);
    ctx.fillRect(x + 21, y + 10, 4, 5);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 13, y + 16, 10, 3);
    ctx.fillStyle = '#FFCCAA';
    ctx.fillRect(x + princess.width - 5, y + 15 + wave/3, 12, 6);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 5, y + 18, 5, 25);
    ctx.fillRect(x + 26, y + 18, 5, 25);
    
    // Nom "TITCH"
    ctx.fillStyle = '#FF1493';
    ctx.font = 'bold 12px Comic Sans MS, cursive';
    ctx.fillText('👸 TITCH', x, y - 10);
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    clouds.forEach(cloud => {
        const x = (cloud.x - cameraX * 0.3) % (GAME_WIDTH + 200);
        const drawX = x < -100 ? x + GAME_WIDTH + 200 : x;
        const y = cloud.y;
        const s = cloud.size;
        ctx.beginPath();
        ctx.arc(drawX, y, 30 * s, 0, Math.PI * 2);
        ctx.arc(drawX + 25 * s, y - 10 * s, 35 * s, 0, Math.PI * 2);
        ctx.arc(drawX + 50 * s, y, 30 * s, 0, Math.PI * 2);
        ctx.arc(drawX + 25 * s, y + 10 * s, 25 * s, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawGround() {
    const level = levels[currentLevelIndex];
    ctx.fillStyle = level.groundColor;
    ctx.fillRect(0, GROUND_Y, canvas.width, GAME_HEIGHT - GROUND_Y);
    ctx.fillStyle = level.grassColor;
    ctx.fillRect(0, GROUND_Y, canvas.width, 15);
    ctx.fillStyle = level.groundDetail;
    for (let x = -cameraX % 20; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 5, GROUND_Y - 8);
        ctx.lineTo(x + 10, GROUND_Y);
        ctx.fill();
    }
    
    // Décorations
    if (level.decorations === 'flowers') {
        for (let x = -cameraX % 150; x < canvas.width; x += 150) {
            ctx.fillStyle = ['#FF69B4', '#FFD700', '#FF6347'][Math.floor(x/150) % 3];
            ctx.beginPath();
            ctx.arc(x + 30, GROUND_Y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (level.decorations === 'trees') {
        for (let x = -cameraX % 300; x < canvas.width; x += 300) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 25, GROUND_Y - 40, 10, 40);
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(x + 30, GROUND_Y - 50, 25, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (level.decorations === 'cactus') {
        for (let x = -cameraX % 400; x < canvas.width; x += 400) {
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(x + 25, GROUND_Y - 35, 10, 35);
            ctx.fillRect(x + 15, GROUND_Y - 25, 10, 8);
            ctx.fillRect(x + 35, GROUND_Y - 20, 10, 8);
        }
    }
}

// ============ MISE À JOUR ============
function update() {
    if (!gameRunning) return;
    
    if (keys.left && player.x > 0) player.x -= player.speed;
    if (keys.right && player.x < GAME_WIDTH - player.width) player.x += player.speed;
    
    if (keys.left || keys.right) player.frame++;
    else player.frame = 0;
    
    cameraX = player.x - canvas.width / 3;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > GAME_WIDTH - canvas.width) cameraX = GAME_WIDTH - canvas.width;
    
    currentEnemies.forEach(enemy => enemy.frame++);
    princess.frame++;
    
    // Boozer animation
    if (levels[currentLevelIndex].hasBoozer) {
        boozer.frame++;
        
        // Si Boozer est en fuite, il court vers le château
        if (boozer.runAway && boozer.x < castle.x - 50) {
            boozer.x += 2;
        }
        // Boozer arrive au château
        else if (boozer.runAway && boozer.x >= castle.x - 50) {
            boozer.defeated = true;
            boozer.x = castle.x - 30;
        }
    }
    
    // Collecte des étoiles
    currentStars.forEach(star => {
        if (!star.collected) {
            const dx = player.x + player.width/2 - star.x;
            const dy = player.y + player.height/2 - star.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 35) {
                star.collected = true;
                player.starsCollected++;
                playCollectSound();
                createHeart(star.x, star.y, '⭐');
            }
        }
    });
    
    // Vérifier collision avec Boozer (niveau final)
    if (levels[currentLevelIndex].hasBoozer && !boozer.defeated && !boozer.runAway) {
        const dx = player.x + player.width/2 - (boozer.x + boozer.width/2);
        const dy = player.y + player.height/2 - (boozer.y + boozer.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 60) {
            // Le joueur touche Boozer !
            boozerFlees();
        }
    }
    
    // Victoire normale (si Boozer est vaincu ou pas de Boozer)
    if (!levels[currentLevelIndex].hasBoozer || boozer.defeated) {
        if (player.x + player.width >= princess.x + 10 && !finaleScene) {
            levelComplete();
        }
    }
    
    updateHearts();
}

// Boozer s'enfuit !
let boozerSpoken = false;
function boozerFlees() {
    if (boozerSpoken) return;
    boozerSpoken = true;
    
    boozer.runAway = true;
    playBoozerDefeatSound();
    
    // Boozer parle
    setTimeout(() => {
        speak("Oh non ! Je me sauve !", 0.8, 1.0);
    }, 100);
    
    // Héros parle
    setTimeout(() => {
        speak("Tu ne m'échapperas pas, méchant Boozer !", 1.4, 1.1);
    }, 800);
    
    // Créer des cœurs d'amour
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            createHeart(boozer.x + Math.random() * boozer.width, boozer.y, '💨');
        }, i * 50);
    }
    
    // Quand Boozer atteint le château
    const checkBoozerArrival = setInterval(() => {
        if (boozer.defeated) {
            clearInterval(checkBoozerArrival);
            speak("Je suis battu ! Princesse Titch, tu es libérée !", 0.8, 1.0);
            
            // Titch parle
            setTimeout(() => {
                speak("Mon héros ! Tu m'as sauvée ! Merci !", 1.6, 1.0);
            }, 2000);
            
            // Cœurs d'amour
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    createHeart(princess.x + Math.random() * 30, princess.y, ['❤️', '💕', '💖'][Math.floor(Math.random() * 3)]);
                }, i * 100);
            }
        }
    }, 100);
}

function draw() {
    const level = levels[currentLevelIndex];
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, level.skyColor[0]);
    gradient.addColorStop(0.6, level.skyColor[1]);
    gradient.addColorStop(0.6, level.grassColor);
    gradient.addColorStop(1, level.groundColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (level.clouds) drawClouds();
    drawGround();
    drawCastle();
    
    // Dessiner Boozer avant le château si niveau final
    if (level.hasBoozer) {
        drawBoozer();
    }
    
    drawPrincess();
    currentStars.forEach(drawStar);
    currentEnemies.forEach(drawEnemy);
    drawPlayer();
    drawHearts();
    
    // UI
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 22px Comic Sans MS, cursive';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(`NIVEAU ${currentLevelIndex + 1}/5 ${level.emoji}`, 15, 30);
    ctx.fillText(`NIVEAU ${currentLevelIndex + 1}/5 ${level.emoji}`, 15, 30);
    ctx.strokeText(`⭐ ${player.starsCollected}/${currentStars.length}`, 15, 55);
    ctx.fillText(`⭐ ${player.starsCollected}/${currentStars.length}`, 15, 55);
    
    // Message spécial niveau final
    if (level.hasBoozer && !boozer.defeated) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Comic Sans MS, cursive';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('👹 Touche Boozer pour le faire fuir !', canvas.width/2 - 150, 90);
        ctx.fillText('👹 Touche Boozer pour le faire fuir !', canvas.width/2 - 150, 90);
    }
    
    const progressTarget = level.hasBoozer ? boozer.x : princess.x - 50;
    const progress = (player.x / progressTarget) * 100;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(canvas.width/2 - 100, 12, 200, 16);
    ctx.fillStyle = boozer.runAway ? '#00FF00' : '#FFD700';
    ctx.fillRect(canvas.width/2 - 98, 14, Math.max(0, Math.min(196, progress * 1.96)), 12);
}

function gameLoop() {
    update();
    draw();
    updateFinale();
    drawFinale();
    if (gameRunning || finaleScene) requestAnimationFrame(gameLoop);
}

// ============ SCÈNE FINALE AU CHÂTEAU ============
// (Variables déjà déclarées plus haut lignes 166-171)

function startFinaleScene() {
    finaleScene = true;
    finaleStep = 0;
    finaleTimer = 0;
    heroOnTower = false;
    princessOnTower = false;
    towerHearts = [];
    
    speak("Princesse, viens avec moi au château !", 1.4, 1.0);
    
    setTimeout(() => {
        speak("Oui mon héros, allons-y !", 1.6, 1.0);
    }, 1500);
}

function updateFinale() {
    if (!finaleScene) return;
    
    finaleTimer++;
    
    // Étape 1 : Le héros va vers la princesse (0-60 frames)
    if (finaleStep === 0) {
        const targetX = princess.x - 60;
        if (player.x < targetX) {
            player.x += 2;
            player.frame++;
        } else {
            finaleStep = 1;
            finaleTimer = 0;
            // Ils se tiennent la main !
            speak("Tiens ma main !", 1.4, 1.0);
        }
    }
    // Étape 2 : Pause pour le moment romantique (60 frames)
    else if (finaleStep === 1) {
        if (finaleTimer > 60) {
            finaleStep = 2;
            finaleTimer = 0;
            speak("Montons au sommet !", 1.4, 1.0);
        }
        // Cœurs qui apparaissent
        if (finaleTimer % 10 === 0) {
            createHeart(player.x + 20, player.y - 20, ['❤️', '💕', '💖'][Math.floor(Math.random() * 3)]);
        }
    }
    // Étape 3 : Ils montent ensemble au château (montée progressive)
    else if (finaleStep === 2) {
        const castleCenterX = castle.x + castle.width / 2 - 20;
        const towerTopY = castle.y - 30;
        
        // Déplacer vers le centre du château
        if (player.x < castleCenterX - 10) {
            player.x += 1.5;
            princess.x += 1.5;
        } else if (player.x > castleCenterX + 10) {
            player.x -= 1.5;
            princess.x -= 1.5;
        }
        
        // Monter en hauteur
        if (player.y > towerTopY) {
            player.y -= 1.5;
            princess.y -= 1.5;
            player.frame++;
            princess.frame++;
        } else {
            finaleStep = 3;
            finaleTimer = 0;
            heroOnTower = true;
            princessOnTower = true;
            speak("Nous sommes au sommet !", 1.6, 1.0);
            
            // Plein de cœurs au sommet
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    createHeart(castle.x + castle.width/2 + (Math.random() - 0.5) * 80, 
                               castle.y - 50 + (Math.random() - 0.5) * 60, 
                               ['❤️', '💕', '💖', '💗', '💝'][Math.floor(Math.random() * 5)]);
                }, i * 100);
            }
        }
        
        // Cœurs pendant la montée
        if (finaleTimer % 15 === 0) {
            createHeart(player.x + 10, player.y, '✨');
        }
    }
    // Étape 4 : Au sommet, moment final
    else if (finaleStep === 3) {
        if (finaleTimer > 120) {
            finaleStep = 4;
            finaleTimer = 0;
            speak("Je t'aime pour toujours !", 1.4, 1.0);
            setTimeout(() => {
                speak("Moi aussi mon prince !", 1.6, 1.0);
            }, 1500);
        }
        
        // Cœurs continus au sommet
        if (finaleTimer % 20 === 0) {
            createHeart(castle.x + castle.width/2 + (Math.random() - 0.5) * 60, 
                       castle.y - 60, 
                       ['❤️', '💕', '💖'][Math.floor(Math.random() * 3)]);
        }
    }
    // Étape 5 : Fin, afficher l'écran de victoire
    else if (finaleStep === 4 && finaleTimer > 150) {
        finaleScene = false;
        
        // Plein de confettis pour la fin
        for (let i = 0; i < 80; i++) {
            setTimeout(() => createConfetti(), i * 50);
        }
        
        showVictoryScreen(true);
    }
    
    // Confettis pendant toute la scène finale
    if (finaleStep >= 2 && finaleTimer % 30 === 0) {
        createConfetti();
    }
}

function drawFinale() {
    if (!finaleScene) return;
    
    const castleX = castle.x - cameraX;
    
    // Dessiner les personnages sur la tour (si au sommet)
    if (heroOnTower && princessOnTower) {
        // Le héros sur la tour gauche
        const heroX = castleX + 10;
        const heroY = castle.y - 30;
        
        // Petite plateforme pour qu'ils tiennent
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(castleX, castle.y - 5, castle.width, 10);
        
        // Héros (plus petit car loin)
        ctx.save();
        ctx.translate(heroX, heroY);
        ctx.scale(0.8, 0.8);
        const bounce = Math.sin(Date.now() / 200) * 3;
        
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(5, 15 + bounce, 30, 30);
        ctx.fillStyle = '#FFCCAA';
        ctx.fillRect(8, 5 + bounce, 24, 20);
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(5, 2 + bounce, 30, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(12, 10 + bounce, 4, 6);
        ctx.fillRect(22, 10 + bounce, 4, 6);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(14, 18 + bounce, 12, 4);
        ctx.restore();
        
        // Princesse sur la tour droite
        const princessX = castleX + castle.width - 40;
        const princessY = castle.y - 30;
        
        ctx.save();
        ctx.translate(princessX, princessY);
        ctx.scale(0.8, 0.8);
        const wave = Math.sin(Date.now() / 250) * 5;
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.moveTo(17, 0);
        ctx.lineTo(0, 60);
        ctx.lineTo(35, 60);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFCCAA';
        ctx.fillRect(8, 5, 20, 18);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(5, 8);
        ctx.lineTo(10, -5);
        ctx.lineTo(15, 8);
        ctx.lineTo(20, -5);
        ctx.lineTo(25, 8);
        ctx.lineTo(30, -5);
        ctx.lineTo(31, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(11, 10, 4, 5);
        ctx.fillRect(21, 10, 4, 5);
        ctx.fillStyle = '#FFCCAA';
        ctx.fillRect(35 + wave/3, 15, 12, 6);
        ctx.restore();
        
        // Arc-en-ciel de cœurs entre eux
        if (finaleStep >= 3) {
            ctx.font = '20px Arial';
            for (let i = 0; i < 5; i++) {
                const t = (Date.now() / 1000 + i * 0.2) % 1;
                const heartX = castleX + 20 + t * 60;
                const heartY = castle.y - 80 - Math.sin(t * Math.PI) * 20;
                ctx.globalAlpha = 0.7;
                ctx.fillText(['❤️', '💕', '💖'][i % 3], heartX, heartY);
            }
            ctx.globalAlpha = 1;
        }
    }
}

// ============ ÉCRANS DE FIN ============
function levelComplete() {
    gameRunning = false;
    stopMusic();
    playVictoryMusic();
    
    const isLastLevel = currentLevelIndex >= levels.length - 1;
    
    if (isLastLevel) {
        // Scène finale spéciale pour le dernier niveau
        startFinaleScene();
    } else {
        setTimeout(() => {
            speak("Bravo ! Niveau terminé !", 1.4, 1.1);
        }, 500);
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                createHeart(princess.x - 50 + Math.random() * 100, princess.y - 50, ['❤️', '💕', '💖', '💗'][Math.floor(Math.random() * 4)]);
            }, i * 100);
        }
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => createConfetti(), i * 50);
        }
        
        setTimeout(() => {
            showVictoryScreen(false);
        }, 2500);
    }
}

function showVictoryScreen(isLastLevel) {
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    
    if (isLastLevel) {
        overlay.innerHTML = `
            <div class="victory-box">
                <h1>💕 VICTOIRE D'AMOUR ! 💕</h1>
                <p>🏰 Les amoureux sont au sommet du château ! 🏰</p>
                <p style="font-size: 26px; color: #FF1493;">"Je t'aime mon héros !"</p>
                <p>👸🤴 Le Prince et la Princesse vivront heureux !</p>
                <p>🏆 FIN HEUREUSE ! 🏆</p>
                <button class="replay-btn" onclick="location.reload()">🔄 Rejouer</button>
            </div>
        `;
    } else {
        overlay.innerHTML = `
            <div class="victory-box">
                <h1>💕 NIVEAU ${currentLevelIndex + 1} TERMINÉ ! 💕</h1>
                <p>Titch dit : "Merci mon héros !"</p>
                <p>⭐ Étoiles: ${player.starsCollected}/${currentStars.length}</p>
                <p>Prochain: ${levels[currentLevelIndex + 1].name}</p>
                <button class="replay-btn" id="next-level-btn">➡️ Continuer l'aventure</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('next-level-btn').addEventListener('click', () => {
            overlay.remove();
            boozerSpoken = false;
            initLevel(currentLevelIndex + 1);
            gameLoop();
        });
        return;
    }
    document.body.appendChild(overlay);
}

function createConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#FF69B4', '#87CEEB', '#FFD700'];
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.innerHTML = ['❤️', '⭐', '✨', '💕', '🎉', '💖'][Math.floor(Math.random() * 6)];
    confetti.style.fontSize = '22px';
    confetti.style.display = 'flex';
    confetti.style.alignItems = 'center';
    confetti.style.justifyContent = 'center';
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
}

// ============ ÉCRAN DE DÉMARRAGE ============
let gameStarted = false;

function showStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'flex';
    }
}

function hideStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 300);
    }
}

// Gestionnaire du bouton de démarrage
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            initAudio();
            hideStartScreen();
            gameStarted = true;
            
            // Message de bienvenue vocal
            setTimeout(() => {
                speak("Bonne chance petit héros ! Sauve la Princesse Titch !", 1.3, 1.0);
            }, 500);
            
            // Démarrer le jeu
            initLevel(0);
            gameLoop();
        });
    }
});

// Afficher l'écran de démarrage au chargement
showStartScreen();
