let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const FPS = 60;
const PLAYER_HEIGHT = 50;
const PLAYER_WIDTH = 20;
const CANVAS_BOTTOM = canvas.height;
const THRUST_SPEED = 10;
const GRAVITY_SPEED = 5;

let player;

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
  }

  thrust() {
    // console.log("Thrusting");
    ctx.save();
    this.thrusting = true;
    this.currentThrust += THRUST_SPEED;
    this.pos.translate(0, -this.currentThrust);
    ctx.restore();
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
      this.currentGravityVelocity += GRAVITY_SPEED;
      this.pos.translate(0, this.currentGravityVelocity);
    }
  }

  draw(ctx) {
    ctx.save();

    ctx.fillStyle = "white";
    ctx.fillRect(this.pos.x, this.pos.y, PLAYER_WIDTH, PLAYER_HEIGHT);

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
  player.update();
}

function drawEverything() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // TODO: Debug below
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.draw(ctx);
}

// CONTROLS
window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") {
    // console.log("Thrust");
    player.thrust();
  }
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowUp") {
    // console.log("Thrust");
    player.thrusting = false;
    player.currentThrust = 0;
  }
});
