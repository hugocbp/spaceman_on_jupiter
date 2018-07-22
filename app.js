let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const DEBUG_MODE = true;

const FPS = 60;
const PLAYER_HEIGHT = 104; // double spaceman img
const PLAYER_WIDTH = 64; // double spaceman img
const CANVAS_BOTTOM = canvas.height;
const CANVAS_RIGHT = canvas.width;
const CANVAS_LEFT = 0;
const THRUST_SPEED = 0.2;
const GRAVITY_SPEED = 0.06;
const LATERAL_MOVEMENT = 1;
const TEXT_COLOR = "white";

// ASTEROIDS
// Scrolling Asteroids - akw: 1045 Lab 11 - Summer 2018
const ASTEROIDS_PER_SEC = 2;
const ASTEROID_SIZE = 20;
const ASTEROID_SPD_MIN = 1;

// VOLCANO
const VOLCANO_SPD_MIN = 2;

// ART
let bgPos = 30;
const ASTEROID_IMG = new Image();
ASTEROID_IMG.src = "images/asteroid_small.png";
const VOLCANO_UP_IMG = new Image();
VOLCANO_UP_IMG.src = "images/fireball.png";
const VOLCANO_DOWN_IMG = new Image();
VOLCANO_DOWN_IMG.src = "images/fireball_down.png";
const SPACEMAN_IMG = new Image();
SPACEMAN_IMG.src = "images/spaceman.png";

// Game variables
let startScreen = true;
let deathScreen = false;
let player;
let asteroids = [];
let volcanos = [];
let score = 0;
let timeInSeconds = 0;
let deathMsg = "Don't die!";
let timer;

// Difficulty variables
let maxAsteroids = 3;
let asteroidSpeedMax = 5;
let maxVolcanos = 3;
let volcanoSpeedMax = 4;
let volcanoChance = 2;

// Point Class - akw: 1045 Assignment 11 - Summer 2018
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  translate(dx, dy) {
    if (!DEBUG_MODE) {
      this.x += dx;
      this.y += dy;
    }
  }

  distance(other) {
    console.assert(other instanceof Point);
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}

class Player {
  constructor(x, y) {
    this.pos = new Point(x, y);
    this.thrusting = false;
    this.currentThrust = 0;
    this.currentGravityVelocity = GRAVITY_SPEED;

    this.movingLeft = false;
    this.movingRight = false;
  }

  update() {
    if (this.pos.y <= 0) {
      handleDeath("orbit");
    }

    if (this.pos.y >= CANVAS_BOTTOM - PLAYER_HEIGHT) {
      handleDeath("jupiter");
    }

    // Gravity
    if (this.pos.y <= CANVAS_BOTTOM - PLAYER_HEIGHT && !this.thrusting) {
      ctx.save();
      this.currentGravityVelocity += GRAVITY_SPEED;
      this.pos.translate(0, this.currentGravityVelocity);
      ctx.restore();
    }

    // Thurst
    if (this.pos.y <= CANVAS_BOTTOM - PLAYER_HEIGHT && this.thrusting) {
      ctx.save();
      this.currentThrust += THRUST_SPEED;
      this.pos.translate(0, -this.currentThrust);
      ctx.restore();
    }

    // Sides
    if (this.pos.x > 0 && this.pos.x < CANVAS_RIGHT) {
      if (this.movingRight) {
        this.pos.x += LATERAL_MOVEMENT;
      }

      if (this.movingLeft) {
        this.pos.x -= LATERAL_MOVEMENT;
      }
    }

    if (this.hasCollision(asteroids)) {
      handleDeath("asteroid");
    }

    if (this.hasCollision(volcanos)) {
      handleDeath("volcano");
    }
  }

  // TODO: Refactor lateral movement
  moveForward() {
    this.pos.x += 10;
  }

  moveBackward() {
    this.pos.x -= 10;
  }

  // Collision logic - akw: 1045 Assignment 11 - Summer 2018
  hasCollision(objects) {
    return objects.some(object => this.isCollision(object));
  }

  isCollision(object) {
    return this.pos.distance(object.pos) < ASTEROID_SIZE;
  }

  draw(ctx) {
    ctx.save();

    // ctx.fillStyle = "white";
    // ctx.fillRect(this.pos.x, this.pos.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    ctx.drawImage(
      SPACEMAN_IMG,
      this.pos.x,
      this.pos.y,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );

    ctx.restore();
  }
}

class Asteroid {
  constructor(x, y, dx) {
    this.pos = new Point(x, y);
    this.dx = dx;
  }
  update() {
    this.pos.x -= this.dx;
  }
  isVisible() {
    if (this.pos.x < 0) {
      return false;
    }
    return true;
  }
  draw(ctx) {
    ctx.save();

    ctx.drawImage(ASTEROID_IMG, this.pos.x, this.pos.y);

    ctx.restore();
  }
}

class Volcano {
  // constructor(baseX, baseY, topX, topY, maxHeight, speed) {
  constructor(x, y, maxHeight, speed) {
    this.pos = new Point(x, y);
    this.maxHeight = maxHeight;
    this.speed = new Point(0, speed);
  }

  update() {
    if (this.pos.y < CANVAS_BOTTOM - this.maxHeight) {
      this.speed.y *= -1;
    }

    this.pos.y -= this.speed.y;
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

drawStartScreen(); // Start screen before game init

function initGame() {
  player = new Player(50, CANVAS_BOTTOM / 2);
  startGameControls();

  // Game Loop
  setInterval(tick, 1000 / FPS);

  // Difficulty timer
  setInterval(increaseDifficulty, 5000);

  // Game Time
  timer = setInterval(() => {
    timeInSeconds += 1;
  }, 1000);
}

function tick() {
  update();
  drawEverything();
}

function update() {
  // Moving BG code: http://jsfiddle.net/AbdiasSoftware/zupjZ/
  bgPos -= 0.5;
  canvas.style.backgroundPosition = bgPos + "px -30px, " + bgPos + "px -30px";

  if (deathScreen) return;

  if (asteroids.length <= maxAsteroids) {
    generateAsteroids();
  }

  if (volcanos.length <= maxVolcanos) {
    generateVolcanos();
  }

  player.update();

  let initialAsteroids = asteroids.length;

  asteroids.forEach(asteroid => asteroid.update());
  asteroids = asteroids.filter(asteroid => asteroid.isVisible());

  volcanos.forEach(volcano => volcano.update());
  volcanos = volcanos.filter(volcano => volcano.isVisible());

  // Update score
  score += initialAsteroids - asteroids.length;
}

function generateAsteroids() {
  let randY = rand(0, CANVAS_BOTTOM);
  let length = rand(0, 40);
  let asteroid = new Asteroid(
    canvas.width - ASTEROID_SIZE,
    rand(0, canvas.height),
    rand(ASTEROID_SPD_MIN, asteroidSpeedMax)
  );

  asteroids.push(asteroid);
}

function generateVolcanos() {
  if (rand(0, 100) > 100 - volcanoChance) {
    console.log("Volcano!");
    let randX = rand(0, CANVAS_RIGHT);
    volcanos.push(
      new Volcano(
        randX,
        CANVAS_BOTTOM,
        rand(0, canvas.height - 200),
        rand(VOLCANO_SPD_MIN, volcanoSpeedMax)
      )
    );
  }
}

function increaseDifficulty() {
  maxAsteroids += 1;
  asteroidSpeedMax += 1;
  maxVolcanos += 1;
  volcanoSpeedMax += 1;
  volcanoChance += 1;
}

function handleDeath(deathCause) {
  clearInterval(timer);

  switch (deathCause) {
    case "asteroid":
      deathMsg = "Asteroids are hard... REALLY hard!";
      break;
    case "jupiter":
      deathMsg = "The floor is LAVA!!!!!";
      break;
    case "orbit":
      deathMsg = "You went to meet the Flying Spaghetti Monster...";
      break;
    case "volcano":
      deathMsg = "Fireballs are pretty, but they burn...";
      break;
  }
  deathScreen = true;
}

function drawEverything() {
  ctx.fillStyle = "black";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (startScreen) {
    drawStartScreen();
  } else if (deathScreen) {
    drawDeathScreen();
  } else {
    // UI
    drawGameUI();

    // Game Objects
    player.draw(ctx);
    asteroids.forEach(asteroid => asteroid.draw(ctx));
    volcanos.forEach(volcano => volcano.draw(ctx));

    // Art
    drawBottomPlanet();
  }
}

function drawStartScreen() {
  ctx.save();

  ctx.textAlign = "center";
  ctx.fillStyle = "orange";
  ctx.font = "bold 80px Orbitron";
  ctx.fillText("Spaceman on Jupiter", canvas.width / 2, canvas.height / 2 - 50);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "30px Orbitron";
  ctx.fillText(
    "CONTROLS: UP to use thrust, LEFT and RIGHT to move",
    canvas.width / 2,
    canvas.height - 200
  );

  ctx.font = "30px Orbitron";
  ctx.fillText("Click to Start", canvas.width / 2, canvas.height - 50);

  ctx.restore();
}

function drawDeathScreen() {
  ctx.save();

  ctx.textAlign = "center";
  ctx.fillStyle = "red";
  ctx.font = "bold 100px Orbitron";
  ctx.fillText("You died", canvas.width / 2, canvas.height / 2 - 200);

  ctx.fillStyle = "orange";
  ctx.font = "40px Orbitron";
  ctx.fillText(deathMsg, canvas.width / 2, canvas.height - 400);

  ctx.font = "30px Orbitron";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height - 200);

  ctx.fillText(
    "Time: " + timeInSeconds + " second(s)",
    canvas.width / 2,
    canvas.height - 150
  );

  ctx.restore();
}

function drawGameUI() {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 30px Orbitron";
  ctx.fillText("Score:" + score, 5, 30);

  ctx.font = "bold 30px Orbitron";
  ctx.fillText("Time:" + timeInSeconds, 5, 60);
}

function drawBottomPlanet() {
  ctx.save();

  ctx.fillStyle = "orange";
  ctx.translate(canvas.width / 2, canvas.height);
  ctx.beginPath();
  ctx.ellipse(0, 0, canvas.width / 2 + 10, 20, 0, Math.PI, true);
  ctx.fill();

  ctx.restore();
}

// CONTROLS
canvas.addEventListener("click", () => {
  if (startScreen) {
    startScreen = false;
    initGame();
  }
});

function startGameControls() {
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
      player.currentGravityVelocity = 0;
      player.thrusting = true;
    }
  });

  window.addEventListener("keyup", e => {
    if (e.key === "ArrowUp") {
      player.thrusting = false;
      player.currentThrust = 0;
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

  if (DEBUG_MODE) {
    canvas.addEventListener("mousemove", e => {
      player.pos.x = e.offsetX;
      player.pos.y = e.offsetY;
    });
  }
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

  return Math.random() * (max - min) + min;
}
