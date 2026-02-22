// @ts-check

// type definitions
/**
 * Bird object
 * @typedef {Object} Bird
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Bird width
 * @property {number} height - Bird height
 */

/**
 * Pipe object
 * @typedef {Bird & { image : HTMLImageElement, passed: boolean } } Pipe
 */

// constants 
let
    boardWidth = 1280,
    boardHeight = 640;
const
    CHOOSELATER = -1,
    birdWidth = 34,
    birdHeight = 24,
    birdX = boardWidth / 8,
    birdY = boardHeight / 2,
    pipeWidth = 64,
    pipeHeight = 512,
    pipeX = boardWidth,
    pipeY = 0;

// assets
/** @type {HTMLCanvasElement} */
let board;
    
/** @type {CanvasRenderingContext2D} */
let context;

/** @type {HTMLImageElement} */
let birdImage;

/** @type {HTMLAudioElement} */
let soundFlap = new Audio("./assets/sounds/sfx_wing.wav");
let soundPoint = new Audio("./assets/sounds/sfx_point.wav");
let soundHit = new Audio("./assets/sounds/sfx_hit.wav");
let soundDie = new Audio("./assets/sounds/sfx_die.wav");
let soundVolume = .5;

/** @param {HTMLAudioElement} sound */
const playSound = (sound) => {
    sound.currentTime = 0;
    sound.volume = soundVolume;
    sound.play();
}

/** @type {Bird} */
let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

// pipes
/** @type {Pipe[]} */
let pipeArray = [];

/** @type {HTMLImageElement} */
let topPipeImage,
/** @type {HTMLImageElement} */
    bottomPipeImage;

// config
let velocityX    = -2,
    velocityY    =  0,
    gravity      =  0.4,
    pipesDelay   =  2000,
    openingSpace =  CHOOSELATER,
    gameOver     =  false;
let score = 0;

const stopGame = () => { 
    if (gameOver) return;
    gravity = 0;
    velocityX = 0;
    playSound(soundHit);
    setTimeout(() => {
        playSound(soundDie);
        gravity = .4;
    }, 2000);
    gameOver = true;
};

// small steps
/**
 * Writes the score in the middle of the screen
 * @param {any} [data=score]
 * @param {number?} [x=null] 
 * @param {number?} [y=null] 
 * @param {number} [size=45] 
 * @param {string} [font="Press Start 2P"] 
 */
const drawScore = (data = score, x = null, y = null, size = 45, font = "Press Start 2P") => {
    context.fillStyle = "white";
    context.font = `${size}px '${font}'`;
    let text = data.toString();
    let textWidth = context.measureText(text).width;
    context.fillText(text, ((x ?? board.width / 2) - (textWidth / 2)), (y ?? size) + size / 3);
};

const clearGarbage = () => {
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }
};

const reset = () => {
    gravity = .4;
    bird.y = birdY;
    velocityX = -2;
    pipeArray = [];
    score = 0;
    gameOver = false;
};

/** @param {number} points */
const addScore = (points) => {
    score += points;
}

// load
window.onload = function() {
    board = /** @type {HTMLCanvasElement} */ (document.getElementById("board"));
    context = /** @type {typeof context} */ (board.getContext("2d"));
    
    if (window.innerWidth <= 768) { // limite para mobile
        boardWidth = 640;
        boardHeight = 320;
    }
    board.height = boardHeight;
    board.width = boardWidth;

    birdImage = new Image();
    birdImage.src = "./assets/images/flappybird.png";

    topPipeImage = new Image(); 
    topPipeImage.src = "./assets/images/toppipe.png";

    bottomPipeImage = new Image(); 
    bottomPipeImage.src = "./assets/images/bottompipe.png";

    requestAnimationFrame(update);
    setInterval(placePipes, pipesDelay);

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "X") moveBird();
    });
    board.addEventListener("mousedown", moveBird);
    board.addEventListener("touchstart", (e) => {
        e.preventDefault(); // evita disparo do mousedown/click
        moveBird();
    }, { passive: false });
};

function moveBird() {
    if (gameOver) reset();
    velocityY = -6;
    playSound(soundFlap);
}

function updateBird() {
    if (gravity != 0) {
        velocityY += gravity;
        bird.y = Math.max(bird.y + velocityY, 0);
    }
    const 
        maxUpAngle = -Math.PI / 4, // -45
        minDownAngle =  Math.PI / 2; // 90
    let angle = velocityY * .1;
    angle = Math.max(Math.min(angle, minDownAngle), maxUpAngle);

    context.save();
    context.translate(bird.x + bird.width/2, bird.y + bird.height/2);
    context.rotate(angle);
    context.drawImage(birdImage, -bird.width/2, -bird.height/2, bird.width, bird.height);
    context.restore();

    if (bird.y + bird.height > board.height) stopGame();
}
function updatePipes() {
    pipeArray.forEach((pipe) => {
        pipe.x += velocityX;
        context.drawImage(pipe.image, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > (pipe.x + pipe.width)) {
            addScore(.5);
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) stopGame();
    });
}
function drawGameOver() {
    drawScore("GAME OVER", board.width / 2, board.height / 2, 35);
}

function update() {
    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    updateBird();
    updatePipes();
    
    drawScore();
    clearGarbage();
    
    if (gameOver) drawGameOver();
}

function placePipes() {
    if (gameOver) return;

    if (openingSpace === -1) openingSpace = board.height / 4;
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

    /** @type {Pipe} */
    let topPipe = {
        image: topPipeImage,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(topPipe);

    /** @type {Pipe} */
    let bottomPipe = {
        image: bottomPipeImage,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(bottomPipe);
}

/**
 * @param {Bird} a
 * @param {Bird} b
 */
function detectCollision(a, b) {
    return a.x < (b.x + b.width) &&
           (a.x + a.width) > b.x &&
           a.y < (b.y + b.height) &&
           (a.y + a.height) > b.y;
}