/*
  1045 Final Project - Summer 2018

  Spaceman on Jupiter

  Name: Hugo Carlos Borges Pinto
  SID: 100311857

  Version Date: 2018-08-03
*/
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const FPS = 30;
const PLAYER_HEIGHT = 104; // double spaceman img
const PLAYER_WIDTH = 64; // double spaceman img
const CANVAS_BOTTOM = canvas.height;
const CANVAS_RIGHT = canvas.width;
const CANVAS_LEFT = 0;
const CANVAS_TOP = 0;
const CANVAS_CENTRE_X = canvas.width / 2;
const CANVAS_CENTRE_Y = canvas.height / 2;

// GAME CONFIGS - PHYSICS (half if 60 FPS)
const THRUST_SPEED = 0.6;
const GRAVITY_SPEED = 0.2;
const LATERAL_SPEED = 4;

// GAME CONFIGS - OBSTACLES
const DIFFICULTY_TIME = 5000; // in ms
const ASTEROIDS_PER_SEC = 2;
const ASTEROID_SIZE = 25;
const ASTEROID_MAX_NUM = 3;
const ASTEROID_SPD_MIN = 2;
const ASTEROID_SPD_MAX = 10;
const VOLCANO_SPD_MIN = 4;
const VOLCANO_MAX_NUM = 3;
const VOLCANO_SPD_MAX = 10;
const VOLCANO_CHANCE = 2;

// UI (for performance)
let scoreDOM = document.getElementById("score");
let timeDOM = document.getElementById("time");

// ART
let bgPos = 30;
const TEXT_COLOR = "white";
const ASTEROID_IMG = new Image();
ASTEROID_IMG.src = "images/asteroid_small_square.png";
const VOLCANO_UP_IMG = new Image();
VOLCANO_UP_IMG.src = "images/fireball_square.png";
const VOLCANO_DOWN_IMG = new Image();
VOLCANO_DOWN_IMG.src = "images/fireball_down_square.png";
const SPACEMAN_IMG = new Image();
SPACEMAN_IMG.src = "images/spaceman.png";
const SPACEMAN_THRUSTING_IMG = new Image();
SPACEMAN_THRUSTING_IMG.src = "images/spaceman_thrusting.png";
// Compensate for spaceman img not being perfect square
const COLLISION_OFFSET = 15;

// SOUND
const JETPACK_SOUND = new Audio("sounds/18380__inferno__hvrl.ogg");
const DEATH_SOUND = new Audio("sounds/396798__scorpion67890__male-death-1.ogg");
const VOLCANO_SOUND = new Audio("sounds/200466__wubitog__short-explosion.ogg");
const DEATH_SCREEN_SOUND = new Audio("sounds/429195_womb-affliction_death.ogg");
const BG_SOUND = new Audio("sounds/258348_tristan-lohengrin_atmosphere-03.ogg");
BG_SOUND.loop = true;

// Game variables
let startScreen = true;
let deathScreen = false;
let player;
let asteroids = [];
let volcanoes = [];
let score = 0;
let timeInSeconds = 0;
let deathReason;
let attempt = 0;
let highestScore = 0;
let highestTime = 0;

// Difficulty variables
let maxAsteroids;
let asteroidSpeedMax;
let maxVolcanoes;
let volcanoSpeedMax;
let volcanoChance;

// Intervals & Timers
let gameInterval;
let difficultyInterval;
let gameTimeInterval;
let backgroundMovementInterval;
let gameDOMUIInterval;

// Death Messages
let death = {
  volcano: {
    msg: "Fireballs are pretty, but they burn...",
    color: "crimson",
    explanation: "Avoid getting close to the volcano fireballs"
  },
  asteroid: {
    msg: "Asteroids are hard...REALLY hard!",
    color: "lightgray",
    explanation: "Avoid getting hit by asteroids"
  },
  jupiter: {
    msg: "The floor is LAVA!!!!!",
    color: "orange",
    explanation: "Don't touch the lava"
  },
  orbit: {
    msg: "You found the Flying Spaghetti Monster...",
    color: "lightskyblue",
    explanation: "Don't leave orbit"
  }
};

// Point Class - akn: 1045 Assignment 11 - Summer 2018
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  translate(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  distance(other) {
    console.assert(other instanceof Point);
    return Math.floor(Math.hypot(this.x - other.x, this.y - other.y));
  }
}

class Player {
  constructor(x, y) {
    this.pos = new Point(x, y);
    this.movingLeft = false;
    this.movingRight = false;
    this.thrusting = false;
    this.currentThrust = 0;
    this.currentGravityVelocity = GRAVITY_SPEED;
  }

  thrust(on) {
    if (on) {
      JETPACK_SOUND.play();
      this.thrusting = true;
      this.currentGravityVelocity = 0;
    } else {
      JETPACK_SOUND.pause();
      JETPACK_SOUND.currentTime = 0; // rewind to start
      this.thrusting = false;
      this.currentThrust = 0;
    }
  }

  update() {
    // Check death conditions
    if (this.pos.y <= CANVAS_TOP) handleDeath("orbit");
    if (this.pos.y >= CANVAS_BOTTOM - PLAYER_HEIGHT) handleDeath("jupiter");
    if (this.hasCollision(asteroids)) handleDeath("asteroid");
    if (this.hasCollision(volcanoes)) handleDeath("volcano");

    // Gravity (DOWN)
    if (!this.thrusting && this.pos.y <= CANVAS_BOTTOM - PLAYER_HEIGHT) {
      ctx.save();

      this.currentGravityVelocity += GRAVITY_SPEED;
      this.pos.translate(0, this.currentGravityVelocity);

      ctx.restore();
    }

    // Thurst (UP)
    if (this.thrusting && this.pos.y <= CANVAS_BOTTOM - PLAYER_HEIGHT) {
      ctx.save();

      this.currentThrust += THRUST_SPEED;
      this.pos.translate(0, -this.currentThrust);

      ctx.restore();
    }

    // Sides (LEFT & RIGHT)
    if (
      this.movingRight &&
      this.pos.x < CANVAS_RIGHT - LATERAL_SPEED - PLAYER_WIDTH / 2
    ) {
      this.pos.x += LATERAL_SPEED;
    }

    if (
      this.movingLeft &&
      this.pos.x > CANVAS_LEFT + LATERAL_SPEED + PLAYER_WIDTH / 2
    ) {
      this.pos.x -= LATERAL_SPEED;
    }
  }

  // Collision logic - akn: 1045 Assignment 11 - Summer 2018
  hasCollision(objects) {
    return objects.some(object => this.isCollidingWith(object));
  }

  isCollidingWith(object) {
    return this.pos.distance(object.pos) < object.size + COLLISION_OFFSET;
  }

  draw(ctx) {
    ctx.save();

    let playerImg = this.thrusting ? SPACEMAN_THRUSTING_IMG : SPACEMAN_IMG;
    ctx.translate(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2);
    ctx.drawImage(
      playerImg,
      this.pos.x,
      this.pos.y,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );

    ctx.restore();
  }
}

// Scrolling Asteroids & Volcano - akn: 1045 Lab 11 - Summer 2018
class Asteroid {
  constructor(x, y, dx) {
    this.pos = new Point(x, y);
    this.dx = dx;
    this.size = ASTEROID_SIZE;
  }

  update() {
    this.pos.translate(-this.dx, 0);
  }

  isVisible() {
    return !(this.pos.x < 0);
  }

  draw(ctx) {
    ctx.save();

    ctx.translate(-ASTEROID_SIZE / 2, -ASTEROID_SIZE / 2);
    ctx.drawImage(ASTEROID_IMG, this.pos.x, this.pos.y);

    ctx.restore();
  }
}

class Volcano {
  constructor(x, y, maxHeight, speed) {
    this.pos = new Point(x, y);
    this.maxHeight = maxHeight;
    this.speed = new Point(0, speed);
    // Offset to compensate squared image and rounded fireball art
    this.size = VOLCANO_DOWN_IMG.width - 22;
  }

  update() {
    if (this.pos.y < CANVAS_BOTTOM - this.maxHeight) {
      this.speed.y *= -1;
    }

    this.pos.translate(0, -this.speed.y);
  }

  isVisible() {
    return this.pos.y <= CANVAS_BOTTOM;
  }

  draw(ctx) {
    ctx.save();

    if (this.speed.y > 0) {
      ctx.drawImage(VOLCANO_UP_IMG, this.pos.x, this.pos.y);
    } else {
      ctx.drawImage(VOLCANO_DOWN_IMG, this.pos.x, this.pos.y);
    }

    ctx.restore();
  }
}

// Wait for images and font
window.onload = drawStartScreen;

function initGame() {
  BG_SOUND.play();
  DEATH_SCREEN_SOUND.pause();
  DEATH_SCREEN_SOUND.currentTime = 0;

  // Start/Reset main variables
  timeInSeconds = 0;
  score = 0;
  maxAsteroids = ASTEROID_MAX_NUM;
  asteroidSpeedMax = ASTEROID_SPD_MAX;
  maxVolcanoes = VOLCANO_MAX_NUM;
  volcanoSpeedMax = VOLCANO_SPD_MAX;
  volcanoChance = VOLCANO_CHANCE;
  volcanoes = [];
  asteroids = [];

  // Clear main timers & intervals to allow "Play again" after death
  clearInterval(gameInterval);
  clearInterval(difficultyInterval);
  clearInterval(gameTimeInterval);

  // Setup new game
  player = new Player(50, CANVAS_BOTTOM / 2 - 200);

  startGameControls();

  gameInterval = setInterval(() => {
    updateEverything();
    drawEverything();
  }, 1000 / FPS);
  difficultyInterval = setInterval(increaseDifficulty, DIFFICULTY_TIME);
  gameTimeInterval = setInterval(() => (timeInSeconds += 1), 1000);

  renderDOMUI();
}

function updateEverything() {
  if (deathScreen) return;

  if (asteroids.length <= maxAsteroids) generateAsteroids();
  if (volcanoes.length <= maxVolcanoes) generateVolcanoes();
  player.update();

  // For Score
  let initialAsteroids = asteroids.length;

  asteroids.forEach(asteroid => asteroid.update());
  asteroids = asteroids.filter(asteroid => asteroid.isVisible());

  volcanoes.forEach(volcano => volcano.update());
  volcanoes = volcanoes.filter(volcano => volcano.isVisible());

  score += initialAsteroids - asteroids.length;
}

function moveBackground() {
  // Moving BG code: http://jsfiddle.net/AbdiasSoftware/zupjZ/
  bgPos -= 1;
  canvas.style.backgroundPosition = bgPos + "px -30px, " + bgPos + "px -30px";
}

function generateAsteroids() {
  asteroids.push(
    new Asteroid(
      CANVAS_RIGHT - ASTEROID_SIZE,
      rand(CANVAS_TOP, CANVAS_BOTTOM),
      rand(ASTEROID_SPD_MIN, asteroidSpeedMax)
    )
  );
}

function generateVolcanoes() {
  // Adds chance to Volcano spawn
  if (rand(0, 100) > 100 - volcanoChance) {
    VOLCANO_SOUND.play();
    let randX = rand(CANVAS_LEFT, CANVAS_RIGHT);
    volcanoes.push(
      new Volcano(
        randX,
        CANVAS_BOTTOM,
        rand(CANVAS_TOP, CANVAS_BOTTOM),
        rand(VOLCANO_SPD_MIN, volcanoSpeedMax)
      )
    );
  }
}

function increaseDifficulty() {
  maxAsteroids += 1;
  asteroidSpeedMax += 1;
  maxVolcanoes += 1;
  volcanoSpeedMax += 1;
  volcanoChance += 1;
}

function handleDeath(deathCause) {
  DEATH_SOUND.play();

  clearInterval(gameTimeInterval);

  if (highestScore < score) {
    highestScore = score;
  }

  if (highestTime < timeInSeconds) {
    highestTime = timeInSeconds;
  }

  attempt++;
  deathReason = deathCause;
  deathScreen = true;

  hideDOMUI();
}

function drawEverything() {
  ctx.clearRect(0, 0, canvas.width, CANVAS_BOTTOM);

  if (startScreen) {
    drawStartScreen();
  } else if (deathScreen) {
    drawDeathScreen();
  } else {
    // Game Objects
    player.draw(ctx);
    asteroids.forEach(asteroid => asteroid.draw(ctx));
    volcanoes.forEach(volcano => volcano.draw(ctx));

    // Game UI & Art
    drawBottomPlanet();
  }
}

function drawStartScreen() {
  BG_SOUND.play();

  backgroundMovementInterval = setInterval(() => moveBackground(), 1000 / FPS);

  ctx.save();

  ctx.textAlign = "center";
  ctx.fillStyle = "orange";
  ctx.font = "bold 90px Orbitron";
  ctx.fillText("Spaceman on Jupiter", CANVAS_CENTRE_X, CANVAS_CENTRE_Y - 100);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "40px Orbitron";
  ctx.fillText(
    "CONTROLS: UP to thrust, LEFT and RIGHT to move",
    CANVAS_CENTRE_X,
    CANVAS_BOTTOM - 300
  );
  ctx.fillText(
    "OBJECTIVE: Survive as long as you can",
    CANVAS_CENTRE_X,
    CANVAS_BOTTOM - 220
  );

  ctx.font = "30px Orbitron";
  ctx.fillText("Click to Start", CANVAS_CENTRE_X, CANVAS_BOTTOM - 50);

  ctx.restore();
}

function drawDeathScreen() {
  DEATH_SCREEN_SOUND.play();

  ctx.save();

  ctx.textAlign = "center";
  ctx.fillStyle = death[deathReason].color;
  ctx.font = "50px Orbitron";
  ctx.fillText(death[deathReason].msg, CANVAS_CENTRE_X, CANVAS_BOTTOM - 450);

  ctx.font = "30px Orbitron";
  ctx.fillText("Attempt: " + attempt, CANVAS_CENTRE_X, CANVAS_BOTTOM - 300);
  ctx.fillText("Score: " + score, CANVAS_CENTRE_X, CANVAS_BOTTOM - 250);
  ctx.fillText(
    "Time: " + timeInSeconds + " second(s)",
    CANVAS_CENTRE_X,
    CANVAS_BOTTOM - 200
  );
  ctx.fillText(
    "Best Attempt: " + highestScore + " points | " + highestTime + " second(s)",
    CANVAS_CENTRE_X,
    CANVAS_BOTTOM - 100
  );
  ctx.fillText(
    death[deathReason].explanation,
    CANVAS_CENTRE_X,
    CANVAS_BOTTOM - 400
  );
  ctx.fillText("Click to play again", CANVAS_CENTRE_X, CANVAS_BOTTOM - 50);

  ctx.fillStyle = "red";
  ctx.font = "bold 200px Orbitron";
  ctx.fillText("You died", CANVAS_CENTRE_X, CANVAS_CENTRE_Y - 200);

  ctx.restore();
}

function renderDOMUI() {
  scoreDOM.style.display = "block";
  timeDOM.style.display = "block";

  gameDOMUIInterval = setInterval(() => {
    scoreDOM.innerHTML = "Score: " + score;
    timeDOM.innerHTML = "Time: " + timeInSeconds;
  }, 1000);
}

function hideDOMUI() {
  scoreDOM.innerHTML = "Score: 0";
  timeDOM.innerHTML = "Time: 0";
  scoreDOM.style.display = "none";
  timeDOM.style.display = "none";

  clearInterval(gameDOMUIInterval);
}

function drawBottomPlanet() {
  ctx.save();

  ctx.fillStyle = "orange";
  ctx.translate(CANVAS_CENTRE_X, CANVAS_BOTTOM);
  ctx.beginPath();
  ctx.ellipse(0, 0, CANVAS_CENTRE_X + 10, 20, 0, Math.PI, true);
  ctx.fill();

  ctx.restore();
}

// CONTROLS
canvas.addEventListener("click", () => {
  if (startScreen) {
    startScreen = false;
    initGame();
  } else if (deathScreen) {
    deathScreen = false;
    initGame();
  }
});

function startGameControls() {
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
      player.thrust(true);
    }
  });

  window.addEventListener("keyup", e => {
    if (e.key === "ArrowUp") {
      player.thrust(false);
    }
  });

  window.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") {
      player.movingLeft = true;
    }
  });

  window.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") {
      player.movingLeft = false;
    }
  });

  window.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") {
      player.movingRight = true;
    }
  });

  window.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") {
      player.movingRight = false;
    }
  });
}

// HELPERS
function rand(min, max) {
  if (min === undefined) {
    min = 0;
    max = 1;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }

  return Math.floor(Math.random() * (max - min) + min);
}
