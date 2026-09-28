// ------------------------------------
// 1. 画面切替＆DOM要素の取得
// ------------------------------------
const startScreen = document.getElementById('start-screen');
const selectScreen = document.getElementById('select-screen');
const gameScreen = document.getElementById('game-screen');

const ruleModal = document.getElementById('rule-modal');
const showRuleBtn = document.getElementById('show-rule-btn');
const closeRuleBtn = document.getElementById('close-rule-btn');

const toSelectBtn = document.getElementById('to-select-btn');
const backToTitleBtn = document.getElementById('back-to-title-btn');

// ゲームオーバーモーダル＆中断ボタン
const gameoverModal = document.getElementById('gameover-modal');
const retryBtn = document.getElementById('retry-btn');
const quitBtn = document.getElementById('quit-btn');
const pauseBtn = document.getElementById('pause-btn');

// イベントリスナー設定
showRuleBtn.addEventListener('click', () => { ruleModal.style.display = 'flex'; });
closeRuleBtn.addEventListener('click', () => { ruleModal.style.display = 'none'; });

toSelectBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    selectScreen.style.display = 'block';
});

backToTitleBtn.addEventListener('click', () => {
    selectScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

// ゲーム中断ボタン
pauseBtn.addEventListener('click', () => {
    if (confirm('ゲームを中断してタイトルに戻りますか？')) {
        isGameOver = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        gameScreen.style.display = 'none';
        startScreen.style.display = 'block';
    }
});

// ゲームオーバー画面からのボタン操作
retryBtn.addEventListener('click', () => {
    gameoverModal.style.display = 'none';
    initGame();
});

quitBtn.addEventListener('click', () => {
    gameoverModal.style.display = 'none';
    gameScreen.style.display = 'none';
    startScreen.style.display = 'block';
});

// ------------------------------------
// 2. ゲーム変数とデータ定義
// ------------------------------------
const TARGET_LETTERS = {
    kirari: ['た', 'け', 'う', 'ち', 'き', 'ら', 'り'],
    hinano: ['く', 'ら', 'も', 'り', 'ひ', 'な', 'の']
};

const ALL_LETTERS = [
    'た', 'け', 'う', 'ち', 'き', 'ら', 'り',
    'く', 'も', 'ひ', 'な', 'の', 'あ', 'い',
    'お', 'か', 'さ', 'と', 'み', 'ね', 'ほ'
];

let currentAllowedLetters = [];
let score = 0;
let isGameOver = false;
let animationFrameId = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let playerImage = new Image();
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 8
};

let fallingLetters = [];
let spawnTimer = 0;

let rightPressed = false;
let leftPressed = false;

// キーボード操作
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = true;
    if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') rightPressed = false;
    if (e.key === 'ArrowLeft' || e.key === 'Left') leftPressed = false;
});

// マウス/タッチ操作
function updatePlayerPositionByX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    player.x = canvasX - player.width / 2;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
}

canvas.addEventListener('mousemove', (e) => {
    if (!isGameOver) updatePlayerPositionByX(e.clientX);
});

canvas.addEventListener('touchmove', (e) => {
    if (!isGameOver && e.touches.length > 0) {
        updatePlayerPositionByX(e.touches[0].clientX);
    }
}, { passive: true });

// ------------------------------------
// 3. メンバー選択 ➔ スタート処理
// ------------------------------------
function chooseMember(memberKey) {
    selectScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    if (memberKey === 'kirari') {
        currentAllowedLetters = TARGET_LETTERS.kirari;
        document.getElementById('playing-member').innerText = '竹内希来里';
        playerImage.src = 'kirari.png';
    } else {
        currentAllowedLetters = TARGET_LETTERS.hinano;
        document.getElementById('playing-member').innerText = '蔵盛妃那乃';
        playerImage.src = 'hinano.png';
    }

    initGame();
}

// ------------------------------------
// 4. ゲームループ
// ------------------------------------
function initGame() {
    score = 0;
    document.getElementById('score').innerText = score;
    isGameOver = false;
    fallingLetters = [];
    player.x = canvas.width / 2 - player.width / 2;

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function gameLoop() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // キーボード移動
    if (rightPressed && player.x < canvas.width - player.width) {
        player.x += player.speed;
    } else if (leftPressed && player.x > 0) {
        player.x -= player.speed;
    }

    // プレイヤー画像を描画
    if (playerImage.complete && playerImage.naturalWidth !== 0) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9800';
        ctx.fill();
        ctx.closePath();
    }

    // 文字生成
    spawnTimer++;
    if (spawnTimer % 40 === 0) {
        const randomChar = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
        fallingLetters.push({
            char: randomChar,
            x: Math.random() * (canvas.width - 30) + 15,
            y: 0,
            speed: 2.5
        });
    }

    // 文字移動＆判定
    for (let i = fallingLetters.length - 1; i >= 0; i--) {
        let item = fallingLetters[i];
        item.y += item.speed;

        ctx.fillStyle = '#333';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(item.char, item.x, item.y);

        // 当たり判定
        if (
            item.y >= player.y &&
            item.y <= player.y + player.height &&
            item.x >= player.x - 10 &&
            item.x <= player.x + player.width + 10
        ) {
            if (currentAllowedLetters.includes(item.char)) {
                score += 10;
                document.getElementById('score').innerText = score;
                fallingLetters.splice(i, 1);
            } else {
                triggerGameOver();
                return;
            }
        } else if (item.y > canvas.height) {
            fallingLetters.splice(i, 1);
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// ------------------------------------
// 5. ゲームオーバー処理
// ------------------------------------
function triggerGameOver() {
    isGameOver = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    document.getElementById('final-score').innerText = score;
    gameoverModal.style.display = 'flex';
}