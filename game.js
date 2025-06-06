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

// Scores - Local state for tracking player scores
let playerScore = 0;
let aiScore = 0;

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

// Reset game scores - resets local state to zero
function resetScores() {
    playerScore = 0;
    aiScore = 0;
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

    // Score tracking - updates local state when ball goes off screen
    if (ball.x - ball.radius < 0) {
        aiScore++;  // AI wins when ball goes off left side
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        playerScore++;  // Player wins when ball goes off right side
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

// Reset button functionality
document.getElementById('resetButton').addEventListener('click', function() {
    resetScores();
});

// Start game
gameLoop();
