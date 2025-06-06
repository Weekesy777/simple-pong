const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const paddleWidth = 15;
const paddleHeight = 100;
const ballRadius = 10;

// Player paddle (left)
let playerPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: "#39f"
};

// AI paddle (right)
let aiPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: "#f33"
};

// Ball
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    speed: 5,
    dx: 5 * (Math.random() > 0.5 ? 1 : -1),
    dy: 4 * (Math.random() > 0.5 ? 1 : -1),
    color: "#fff"
};

// Game history management - stores completed games in localStorage
function loadGameHistory() {
    const savedHistory = localStorage.getItem('pongGameHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
}

function saveGameToHistory(playerScore, aiScore) {
    const history = loadGameHistory();
    const gameResult = {
        playerScore: playerScore,
        aiScore: aiScore,
        date: new Date().toLocaleString(),
        winner: playerScore > aiScore ? 'Player 1' : 'Player 2 (AI)'
    };
    history.push(gameResult);
    localStorage.setItem('pongGameHistory', JSON.stringify(history));
}

// Scores - Local state for tracking current game scores (no longer persistent)
function loadScores() {
    // Always start with fresh scores (0-0) when page loads
    return {
        playerScore: 0,
        aiScore: 0
    };
}

function saveScores() {
    // No longer save scores to localStorage - only save completed games to history
    // This function kept for compatibility but doesn't persist current game state
}

// Load scores from localStorage or default to 0
const scores = loadScores();
let playerScore = scores.playerScore;
let aiScore = scores.aiScore;

// Keyboard input state
let keysPressed = {
    ArrowUp: false,
    ArrowDown: false
};

// Draw paddle
function drawPaddle(paddle) {
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Draw ball
function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

// Draw net
function drawNet() {
    ctx.setLineDash([10, 15]);
    ctx.strokeStyle = "#555";
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Draw scores with player labels
function drawScores() {
    ctx.font = "32px Arial";
    ctx.fillStyle = "#fff";
    
    // Player 1 score (left side)
    ctx.fillText(playerScore, canvas.width / 4, 40);
    ctx.font = "16px Arial";
    ctx.fillText("Player 1", canvas.width / 4 - 30, 60);
    
    // Player 2 (AI) score (right side)
    ctx.font = "32px Arial";
    ctx.fillText(aiScore, 3 * canvas.width / 4, 40);
    ctx.font = "16px Arial";
    ctx.fillText("Player 2 (AI)", 3 * canvas.width / 4 - 45, 60);
}

// Reset ball after score
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1);
}

// Update UI elements
function updateCurrentScoreDisplay() {
    const currentScoreElement = document.getElementById('currentScore');
    currentScoreElement.textContent = `Player 1: ${playerScore} - Player 2 (AI): ${aiScore}`;
}

function updateGameHistoryDisplay() {
    const historyElement = document.getElementById('historyList');
    const history = loadGameHistory();
    
    if (history.length === 0) {
        historyElement.innerHTML = '<div style="text-align: center; color: #aaa;">No games played yet</div>';
        return;
    }
    
    // Show most recent games first
    const recentHistory = history.slice(-10).reverse();
    
    historyElement.innerHTML = recentHistory.map((game, index) => {
        const isPlayerWin = game.winner === 'Player 1';
        const winClass = isPlayerWin ? 'player-win' : 'ai-win';
        
        return `
            <div class="history-game ${winClass}">
                <div class="history-score">
                    Player 1: ${game.playerScore} - Player 2 (AI): ${game.aiScore}
                </div>
                <div class="history-winner">Winner: ${game.winner}</div>
                <div class="history-date">${game.date}</div>
            </div>
        `;
    }).join('');
}

// Game settings
const WINNING_SCORE = 10;

// Check if game is complete and handle completion
function checkGameCompletion() {
    if (playerScore >= WINNING_SCORE || aiScore >= WINNING_SCORE) {
        // Save completed game to history
        saveGameToHistory(playerScore, aiScore);
        
        // Update the history display
        updateGameHistoryDisplay();
        
        // Start a new game
        playerScore = 0;
        aiScore = 0;
        resetBall();
        
        // Update current score display
        updateCurrentScoreDisplay();
        
        return true;
    }
    return false;
}

// Reset game scores - starts a new game
function resetScores() {
    playerScore = 0;
    aiScore = 0;
    updateCurrentScoreDisplay(); // Update UI
    resetBall(); // Also reset ball position when game is reset
}

// Collision detection
function checkCollision(ball, paddle) {
    return (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height
    );
}

// Update game objects
function update() {
    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collide with top/bottom
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy *= -1;
    }
    if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.dy *= -1;
    }

    // Collide with player paddle
    if (checkCollision(ball, playerPaddle)) {
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        ball.dx *= -1;
        // Add curve based on where the ball hits the paddle
        let collidePoint = (ball.y - (playerPaddle.y + playerPaddle.height / 2)) / (playerPaddle.height / 2);
        ball.dy = ball.speed * collidePoint;
    }

    // Collide with AI paddle
    if (checkCollision(ball, aiPaddle)) {
        ball.x = aiPaddle.x - ball.radius;
        ball.dx *= -1;
        let collidePoint = (ball.y - (aiPaddle.y + aiPaddle.height / 2)) / (aiPaddle.height / 2);
        ball.dy = ball.speed * collidePoint;
    }

    // Score tracking - updates current game state and checks for completion
    if (ball.x - ball.radius < 0) {
        aiScore++;  // AI wins when ball goes off left side
        updateCurrentScoreDisplay(); // Update UI immediately
        checkGameCompletion(); // Check if game is complete and handle accordingly
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        playerScore++;  // Player wins when ball goes off right side
        updateCurrentScoreDisplay(); // Update UI immediately
        checkGameCompletion(); // Check if game is complete and handle accordingly
        resetBall();
    }

    // Player paddle keyboard movement
    const paddleSpeed = 7;
    if (keysPressed.ArrowUp) {
        playerPaddle.y -= paddleSpeed;
    }
    if (keysPressed.ArrowDown) {
        playerPaddle.y += paddleSpeed;
    }
    // Prevent player paddle from going out of bounds
    if (playerPaddle.y < 0) playerPaddle.y = 0;
    if (playerPaddle.y + playerPaddle.height > canvas.height) playerPaddle.y = canvas.height - playerPaddle.height;

    // AI paddle movement (basic)
    let aiCenter = aiPaddle.y + aiPaddle.height / 2;
    if (aiCenter < ball.y - 35) {
        aiPaddle.y += 5;
    } else if (aiCenter > ball.y + 35) {
        aiPaddle.y -= 5;
    }
    // Prevent AI paddle from going out of bounds
    if (aiPaddle.y < 0) aiPaddle.y = 0;
    if (aiPaddle.y + aiPaddle.height > canvas.height) aiPaddle.y = canvas.height - aiPaddle.height;
}

// Render everything
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawScores();
    drawPaddle(playerPaddle);
    drawPaddle(aiPaddle);
    drawBall(ball);
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Mouse movement for player paddle
canvas.addEventListener('mousemove', function (e) {
    let rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top;
    playerPaddle.y = mouseY - playerPaddle.height / 2;
    // Prevent paddle from going out of bounds
    if (playerPaddle.y < 0) playerPaddle.y = 0;
    if (playerPaddle.y + playerPaddle.height > canvas.height) playerPaddle.y = canvas.height - playerPaddle.height;
});

// Keyboard controls for player paddle
document.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowUp') {
        keysPressed.ArrowUp = true;
    }
    if (e.code === 'ArrowDown') {
        keysPressed.ArrowDown = true;
    }
});

document.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowUp') {
        keysPressed.ArrowUp = false;
    }
    if (e.code === 'ArrowDown') {
        keysPressed.ArrowDown = false;
    }
});

// Initialize UI on page load
function initializeGame() {
    updateCurrentScoreDisplay();
    updateGameHistoryDisplay();
}

// Reset button functionality
document.getElementById('resetButton').addEventListener('click', function() {
    resetScores();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

// Start game
gameLoop();
