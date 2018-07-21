let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

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

// OBSTACLES
// Scrolling Obstacles - akw: 1045 Lab 11 - Summer 2018
const OBSTACLES_PER_SEC = 2;
const OBSTACLE_SIZE = 20;
const SPD_MIN = 1;
const SPD_MAX = 5;

// VOLCANO
const VOLCANO_SPD_MIN = 2;
const VOLCANO_SPD_MAX = 4;

// ART
let bgPos = 30;
const ASTEROID_IMG = new Image();
ASTEROID_IMG.src = "images/asteroid_small.png";
const SPACEMAN_IMG = new Image();
SPACEMAN_IMG.src = "images/spaceman.png";

// Game variables
let startScreen = true;
let player;
let obstacles = [];
let volcanos = [];
let maxVolcanos = 3;
let score = 0;
let timeInSeconds = 0;

// Point Class - akw: 1045 Assignment 11 - Summer 2018
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
      this.pos.y = 0;
    }

    if (this.pos.y >= CANVAS_BOTTOM - PLAYER_HEIGHT) {
      this.pos.y = CANVAS_BOTTOM - PLAYER_HEIGHT;
      this.currentGravityVelocity = 0;
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

    if (this.hasCollision(obstacles)) {
      // TODO: Implement loss of life
      // score -= 5;
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
    return this.pos.distance(object.pos) < OBSTACLE_SIZE;
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

class Obstacle {
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
  constructor(baseX, baseY, topX, topY, maxHeight, speed) {
    this.base = new Point(baseX, baseY);
    this.top = new Point(topX, topY);
    this.maxHeight = maxHeight;
    this.speed = new Point(0, speed);
  }

  update() {
    if (this.top.y < CANVAS_BOTTOM - this.maxHeight) {
      this.speed.y *= -1;
    }

    this.top.y -= this.speed.y;
  }

  isVisible() {
    return this.top.y <= CANVAS_BOTTOM;
  }

  draw(ctx) {
    ctx.save();

    ctx.strokeStyle = "orange";
    ctx.lineWidth = 50;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.base.x, this.base.y);
    ctx.lineTo(this.top.x, this.top.y);
    ctx.stroke();

    ctx.restore();
  }
}

drawEverything(); // Start screen

function initGame() {
  player = new Player(50, CANVAS_BOTTOM - PLAYER_HEIGHT);

  setInterval(tick, 1000 / FPS);

  // Game Time
  setInterval(() => {
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

  if (obstacles.length <= 5) {
    generateObstacles();
  }

  rollDiceForVolcano();

  player.update();

  let initialObstacles = obstacles.length;

  obstacles.forEach(obstacle => obstacle.update());
  obstacles = obstacles.filter(obstacle => obstacle.isVisible());

  volcanos.forEach(volcano => volcano.update());
  volcanos = volcanos.filter(volcano => volcano.isVisible());

  // Update score
  score += initialObstacles - obstacles.length;
}

function drawEverything() {
  ctx.fillStyle = "black";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (startScreen) {
    drawStartScreen();
  } else {
    // UI
    drawGameUI();

    // Game Objects
    player.draw(ctx);
    obstacles.forEach(obstacle => obstacle.draw(ctx));
    volcanos.forEach(volcano => volcano.draw(ctx));

    // Art
    drawBottomPlanet();
  }
}

function generateObstacles() {
  let randY = rand(0, CANVAS_BOTTOM);
  let length = rand(0, 40);
  let obstacle = new Obstacle(
    canvas.width - OBSTACLE_SIZE,
    rand(0, canvas.height),
    rand(SPD_MIN, SPD_MAX)
  );

  obstacles.push(obstacle);
}

function rollDiceForVolcano() {
  if (rand(0, 100) > 99 && volcanos.length < maxVolcanos) {
    console.log("Volcano!");
    let randX = rand(0, CANVAS_RIGHT);
    volcanos.push(
      new Volcano(
        randX,
        CANVAS_BOTTOM,
        randX,
        CANVAS_BOTTOM,
        rand(0, canvas.height - 200),
        rand(VOLCANO_SPD_MIN, VOLCANO_SPD_MAX)
      )
    );
  }
}

function drawStartScreen() {
  ctx.save();

  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 100px sans-serif";
  ctx.fillText("Spaceman on Jupiter", canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = "30px sans-serif";
  ctx.fillText(
    "CONTROLS: UP to use thrust, LEFT and RIGHT to move",
    canvas.width / 2,
    canvas.height - 200
  );

  ctx.font = "30px sans-serif";
  ctx.fillText("Click to Start", canvas.width / 2, canvas.height - 50);

  ctx.restore();
}

function drawGameUI() {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("Score:" + score, 5, 30);

  ctx.font = "bold 30px sans-serif";
  ctx.fillText("Time:" + timeInSeconds, 5, 60);

  ctx.font = "bold 30px sans-serif";
  ctx.fillText("Lives:" + 0, 5, 90);
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

canvas.addEventListener("click", () => {
  if (startScreen) {
    startScreen = false;
    initGame();
  }
});

/*
		HELPERS
*/
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
