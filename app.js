let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const FPS = 60;
const PLAYER_HEIGHT = 50;
const PLAYER_WIDTH = 20;
const CANVAS_BOTTOM = canvas.height;
const CANVAS_RIGHT = canvas.width;
const CANVAS_LEFT = 0;
const THRUST_SPEED = 0.2;
const GRAVITY_SPEED = 0.07;
const LATERAL_MOVEMENT = 1;

// OBSTACLES
// Scrolling Obstacles - akw: 1045 Lab 11 - Summer 2018
const OBSTACLES_PER_SEC = 2;
const OBSTACLE_SIZE = 20;
const SPD_MIN = 1;
const SPD_MAX = 5;

let player;
let obstacles = [];

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
  }

  moveForward() {
    this.pos.x += 10;
  }

  moveBackward() {
    this.pos.x -= 10;
  }

  draw(ctx) {
    ctx.save();

    ctx.fillStyle = "white";
    ctx.fillRect(this.pos.x, this.pos.y, PLAYER_WIDTH, PLAYER_HEIGHT);

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
    // draw the line onto the context
    ctx.save();

    ctx.fillStyle = "red";
    ctx.fillRect(this.pos.x, this.pos.y, OBSTACLE_SIZE, OBSTACLE_SIZE);

    ctx.restore();
  }
}

initGame();
setInterval(tick, 1000 / FPS);

function tick() {
  update();
  drawEverything();
}

function initGame() {
  player = new Player(50, CANVAS_BOTTOM - PLAYER_HEIGHT);
}

function update() {
  if (obstacles.length <= 5) {
    generateObstacles();
  }

  player.update();
  obstacles.forEach(obstacle => obstacle.update());
  obstacles = obstacles.filter(obstacle => obstacle.isVisible());
}

function drawEverything() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // TODO: Debug below
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  obstacles.forEach(obstacle => obstacle.draw(ctx));
  player.draw(ctx);
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

// CONTROLS
window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") {
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
