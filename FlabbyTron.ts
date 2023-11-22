// Interfaces
interface Bird {
    x: number;
    y: number;
    velocityY: number;
}

interface Obstacle {
    x: number;
    width: number;
    height: number;
    gap: number;
    passed: boolean;
}

interface GameState {
    score: number;
    highScore: number;
    bird: Bird;
    obstacles: Obstacle[];
}

// Constants
const gravity = 0.7;
const obstacleSpeed = 1.8;
const birdRadius = 14;
const obstacleInterval = 200;
let frameCount = 0;
let gameRunning = false;

// Game setup
const canvas: HTMLCanvasElement = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

if (!ctx) {
    throw new Error("Could not get 2D context from canvas element.");
}

let gameState: GameState = {
    score: 0,
    highScore: getHighScore(),
    bird: { x: 50, y: canvas.height / 2, velocityY: 0 },
    obstacles: []
};

// Functions
function getHighScore(): number {
    const highScore = localStorage.getItem('highScore');
    return highScore ? parseInt(highScore) : 0;
}

function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
        if (!gameRunning) {
            gameRunning = true;
            gameLoop(); // Start the game loop
        }
        gameState.bird.velocityY = -10; // Flap effect
        playSound('flap');
    }
}

document.addEventListener('keydown', handleKeyDown);

function updateGame(): void {
    //console.log("Updating game..."); // Diagnostic log

    if (!gameRunning) return;

    // Apply gravity and move bird
    gameState.bird.velocityY += gravity;
    gameState.bird.y += gameState.bird.velocityY;

    // Generate new obstacles and move existing ones
    if (frameCount % obstacleInterval === 0) {
        gameState.obstacles.push(generateObstacle());
    }
    gameState.obstacles = gameState.obstacles.filter(obstacle => {
        obstacle.x -= obstacleSpeed;
        return obstacle.x + obstacle.width > 0;
    });

    // Collision detection and score update
    gameState.obstacles.forEach(obstacle => {
        if (checkCollision(gameState.bird, obstacle)) {
            handleGameOver();
            return;
        }
    });
    updateScore();

    frameCount++;
}

function handleGameOver(): void {
    gameRunning = false;
    playSound('crash'); // Play crash sound immediately

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore(gameState.highScore);
    }

    // Replace the alert with a custom method to display game over message
    displayGameOverMessage(`Game over!\n\nScore: ${gameState.score}`);


    resetGame(); // Optional: restart the game or prompt for restart
}



function displayGameOverMessage(message) {
    const gameOverDiv = document.getElementById('gameOverMessage');
    if (gameOverDiv) {
        gameOverDiv.innerHTML = message.replace(/\n/g, '<br>'); // Replace newlines with HTML line breaks
        gameOverDiv.style.display = 'block'; // Make the div visible

        // Hide the message after a delay
        setTimeout(function () {
            gameOverDiv.style.display = 'none'; // Make the div invisible
        }, 2000);
    }
}




function renderGame(): void {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black'; // Set the background color to black
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the background color

    // Render bird
    renderBird(gameState.bird);

    // Render obstacles
    gameState.obstacles.forEach(renderObstacle);

    // Display scores
    displayScore(gameState.score, gameState.highScore);
}

function checkCollision(bird: Bird, obstacle: Obstacle): boolean {
    // Check collision with the ground
    if (bird.y + birdRadius > canvas.height) {
        return true;
    }

    // Check collision with the obstacle
    const withinXRange = bird.x + birdRadius > obstacle.x && bird.x - birdRadius < obstacle.x + obstacle.width;
    const withinYRangeTop = bird.y - birdRadius < obstacle.height;
    const withinYRangeBottom = bird.y + birdRadius > obstacle.height + obstacle.gap;

    if (withinXRange && (withinYRangeTop || withinYRangeBottom)) {
        return true;
    }

    return false;
}

function updateScore(): void {
    gameState.obstacles.forEach(obstacle => {
        if (!obstacle.passed && gameState.bird.x > obstacle.x + obstacle.width) {
            gameState.score++;
            obstacle.passed = true;
            // Check if the current score is greater than the high score
            if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                saveHighScore(gameState.highScore); // Save the new high score immediately
                console.log("New high score:", gameState.highScore); // Diagnostic log
            }
        }
    });
}

function saveHighScore(newHighScore: number): void {
    localStorage.setItem('highScore', newHighScore.toString());
    console.log("Saved high score:", newHighScore); // Diagnostic log
}

function displayScore(currentScore: number, highScore: number): void {
    if (!ctx) return;

    //console.log("Current score:", currentScore); // Diagnostic log

    ctx.font = '24px Arial';
    ctx.fillStyle = 'orange';
    //ctx.fillText(`Score: ${currentScore}`, canvas.width - 100, 30);
    ctx.fillText(`High Score: ${highScore}`, 20, 30);
    ctx.fillText(`Score: ${currentScore}`, 20, 60);
}

function resetGame(): void {
    gameState = {
        score: 0,
        highScore: getHighScore(),
        bird: { x: 50, y: canvas.height / 2, velocityY: 0 },
        obstacles: []
    };
    frameCount = 0;
    gameRunning = false;
}

function generateObstacle(): Obstacle {
    const minHeight = 20; // Minimum height of the obstacle
    const maxHeight = canvas.height - 200; // Maximum height of the obstacle
    const obstacleHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
    
    return {
        x: canvas.width,
        width: 70, // Width of the obstacle
        height: obstacleHeight,
        gap: 270, // Gap size
        passed: false
    };
}


let angleX = 10; // Rotation angle around X-axis
let angleY = 40; // Rotation angle around Y-axis
function renderBird(bird: Bird): void {
    if (!ctx) return;

    const radius = birdRadius; // Radius of the bird/sphere
    const segments = 8; // Number of segments for the sphere
    const centerX = bird.x; // Center of the bird
    const centerY = bird.y;

    // Increment rotation angles for a slow rotation effect
    angleX += 0.003; // Increment X-axis rotation
    angleY += 0.003; // Increment Y-axis rotation

    // Function to rotate a point in 3D
    function rotatePoint(point) {
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const y = point.y * cosX - point.z * sinX;
        const z = point.y * sinX + point.z * cosX;
        point.y = y;
        point.z = z;
        const x = point.x * cosY - point.z * sinY;
        point.z = point.x * sinY + point.z * cosY;
        point.x = x;

    }

    // Function to project a 3D point onto a 2D plane
    function projectPoint(point) {
        const distance = 1000; // Distance from the viewer to the projection plane
        return {
            x: point.x * distance / (point.z + distance) + centerX,
            y: point.y * distance / (point.z + distance) + centerY,
        };
    }

    // Generate 3D sphere mesh points
    const points = [];
    for (let i = 0; i <= segments; i++) {
        for (let j = 0; j <= segments; j++) {
            const theta = (j / segments) * Math.PI * 2;
            const phi = (i / segments) * Math.PI;
            points.push({
                x: radius * Math.sin(phi) * Math.cos(theta),
                y: radius * Math.sin(phi) * Math.sin(theta),
                z: radius * Math.cos(phi),
            });
        }
    }

    // Rotate and project points
    const projectedPoints = points.map(point => {
        const rotatedPoint = { ...point };
        rotatePoint(rotatedPoint);
        return projectPoint(rotatedPoint);
    });

    // Draw sphere mesh
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const point1 = projectedPoints[i * (segments + 1) + j];
            const point2 = projectedPoints[((i + 1) % (segments + 1)) * (segments + 1) + j];
            const point3 = projectedPoints[i * (segments + 1) + ((j + 1) % (segments + 1))];
            const point4 = projectedPoints[((i + 1) % (segments + 1)) * (segments + 1) + ((j + 1) % (segments + 1))];
            ctx.beginPath();
            ctx.moveTo(point1.x, point1.y);
            ctx.lineTo(point2.x, point2.y);
            ctx.lineTo(point4.x, point4.y);
            ctx.lineTo(point3.x, point3.y);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

function renderObstacle(obstacle: Obstacle): void {
    if (!ctx) return;

    const segments = 15; // Number of segments for the pillar mesh
    const depth = obstacle.width; // Assuming depth of the pillar is the same as its width
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;

    // Function to draw a segment of the pillar
    function drawPillarSegment(x, y, height, depth) {
        if (!ctx) return;
        // Front face horizontal line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + obstacle.width, y);
        ctx.stroke();

        // Back face horizontal line
        ctx.beginPath();
        ctx.moveTo(x - depth, y - depth);
        ctx.lineTo(x - depth + obstacle.width, y - depth);
        ctx.stroke();

        // Vertical connecting lines
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - depth, y - depth);
        ctx.moveTo(x + obstacle.width, y);
        ctx.lineTo(x + obstacle.width - depth, y - depth);
        ctx.stroke();
    }

    // Draw segments for the top and bottom parts of the pillar
    for (let i = 0; i <= segments; i++) {
        const topSegmentHeight = i * (obstacle.height / segments);
        const bottomSegmentHeight = obstacle.height + obstacle.gap + i * ((canvas.height - obstacle.height - obstacle.gap) / segments);

        drawPillarSegment(obstacle.x, topSegmentHeight, obstacle.height, depth); // Top part of the pillar
        drawPillarSegment(obstacle.x, bottomSegmentHeight, canvas.height - obstacle.height - obstacle.gap, depth); // Bottom part of the pillar
    }
}

function playSound(soundType: string): void {
    // Assuming sound files are named according to their type (e.g., 'flap.mp3', 'collision.mp3')
    const sound = new Audio(`${soundType}.wav`);
    sound.play();
}

// Main game loop
function gameLoop(): void {

    //console.log("Game loop running..."); // Diagnostic log

    if (!gameRunning) return;

    updateGame();
    renderGame();
    requestAnimationFrame(gameLoop);
}