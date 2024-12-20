const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const canvasBreedte = canvas.width;
const canvasHoogte = canvas.height;

const GROUND_HEIGHT = 80;
const GROUND_COLOR = "#4a4a4a";

import { getLevelData } from "./levels.js";

const levels = [getLevelData().level1, getLevelData().level2];

const gameState = {
  currentScreen: 0,
  screenTransition: {
    active: false,
    offset: 0,
    targetOffset: 0,
  },
};

const blok = {
  x: canvasBreedte / 2 - 25,
  y: canvasHoogte - GROUND_HEIGHT - 50,
  breedte: 50,
  hoogte: 50,
  kleur: "red",
  snelheidX: 0,
  snelheidY: 0,
  zwaartekracht: 0.1,
  springKracht: 0,
  minJumpForce: 2,
  maxJumpForce: 7.2,
  jumpChargeTime: 0,
  maxChargeTime: 800,
  isChargingJump: false,
  opGrond: true,
  jumpDirection: 0,
  bounceStrength: 0.6,
  walkSpeed: 3,
  isWalking: false,
};

const keyboard = {
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
};

function checkPlatformCollisions(nextX, nextY) {
  const currentLevel = levels[gameState.currentScreen];

  for (const platform of currentLevel.platforms) {
    // Vertical collision checks (landing and hitting from below)
    if (nextX + blok.breedte > platform.x && nextX < platform.x + platform.width) {
      if (blok.y + blok.hoogte <= platform.y && nextY + blok.hoogte > platform.y) {
        nextY = platform.y - blok.hoogte;
        blok.snelheidY = 0;
        blok.snelheidX = 0;
        blok.opGrond = true;
        return { x: nextX, y: nextY };
      }

      if (blok.y >= platform.y + platform.height && nextY < platform.y + platform.height) {
        nextY = platform.y + platform.height;
        blok.snelheidY = 0;
        return { x: nextX, y: nextY };
      }
    }

    // Horizontal collision checks (side collisions)
    if (nextY + blok.hoogte > platform.y && nextY < platform.y + platform.height) {
      // Left side collision
      if (blok.x + blok.breedte <= platform.x && nextX + blok.breedte > platform.x) {
        nextX = platform.x - blok.breedte;
        handleWallCollision(true);
      }
      // Right side collision
      if (blok.x >= platform.x + platform.width && nextX < platform.x + platform.width) {
        nextX = platform.x + platform.width;
        handleWallCollision(false);
      }
    }
  }

  return { x: nextX, y: nextY };
}

function updateJumpCharge() {
  if (blok.isChargingJump) {
    blok.jumpChargeTime += 16;
    let chargeProgress = Math.min(blok.jumpChargeTime / blok.maxChargeTime, 1);
    blok.springKracht = blok.minJumpForce + (blok.maxJumpForce - blok.minJumpForce) * chargeProgress;

    if (chargeProgress >= 1) {
      executeJump();
    }
  }
}

function executeJump() {
  if (blok.springKracht > 0) {
    let jumpPower = blok.springKracht * 1.3;
    blok.snelheidY = -jumpPower;

    if (keyboard.ArrowLeft) {
      blok.snelheidX = -jumpPower * 0.38;
    } else if (keyboard.ArrowRight) {
      blok.snelheidX = jumpPower * 0.4;
    } else {
      blok.snelheidX = 0;
    }

    blok.isChargingJump = false;
    blok.opGrond = false;
    blok.isWalking = false;
  }
}

function handleWallCollision(isLeftWall) {
  blok.snelheidX *= -blok.bounceStrength;
  blok.springKracht *= blok.bounceStrength;
}
function updateBlok() {
  updateJumpCharge();

  if (blok.opGrond && !blok.isChargingJump) {
    let nextPosition = blok.x;

    if (keyboard.ArrowLeft) {
      nextPosition = blok.x - blok.walkSpeed;
    }
    if (keyboard.ArrowRight) {
      nextPosition = blok.x + blok.walkSpeed;
    }

    // Check for platform collisions before moving
    const currentLevel = levels[gameState.currentScreen];
    let canMove = true;

    for (const platform of currentLevel.platforms) {
      if (
        nextPosition + blok.breedte > platform.x &&
        nextPosition < platform.x + platform.width &&
        blok.y + blok.hoogte > platform.y &&
        blok.y < platform.y + platform.height
      ) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      blok.x = nextPosition;
      if (keyboard.ArrowLeft) blok.jumpDirection = -1;
      if (keyboard.ArrowRight) blok.jumpDirection = 1;
    }
  }

  if (blok.opGrond) {
    let futureY = blok.y + 2;
    let isOnPlatform = false;

    const currentLevel = levels[gameState.currentScreen];
    for (const platform of currentLevel.platforms) {
      if (
        blok.x + blok.breedte > platform.x &&
        blok.x < platform.x + platform.width &&
        Math.abs(blok.y + blok.hoogte - platform.y) < 2
      ) {
        isOnPlatform = true;
        break;
      }
    }

    const isOnGround =
      gameState.currentScreen === 0 && Math.abs(blok.y + blok.hoogte - (canvasHoogte - GROUND_HEIGHT)) < 2;

    if (!isOnPlatform && !isOnGround) {
      blok.opGrond = false;
      blok.snelheidY = 0.1;
      if (keyboard.ArrowLeft) {
        blok.snelheidX = -2;
      } else if (keyboard.ArrowRight) {
        blok.snelheidX = 2;
      }
    }
  }

  if (!blok.opGrond) {
    blok.snelheidY += blok.zwaartekracht;
  }

  let nextX = blok.x + blok.snelheidX;
  let nextY = blok.y + blok.snelheidY;

  const collision = checkPlatformCollisions(nextX, nextY);
  nextX = collision.x;
  nextY = collision.y;

  if (nextX < 0) {
    nextX = 0;
    handleWallCollision(true);
  }
  if (nextX + blok.breedte > canvasBreedte) {
    nextX = canvasBreedte - blok.breedte;
    handleWallCollision(false);
  }

  if (nextY < 0 && gameState.currentScreen < levels.length - 1) {
    gameState.screenTransition.active = true;
    gameState.screenTransition.targetOffset = canvasHoogte;
    nextY = canvasHoogte + nextY;
    gameState.currentScreen++;
    blok.snelheidX = blok.snelheidX;
    blok.snelheidY = blok.snelheidY;
  }

  if (nextY > canvasHoogte && gameState.currentScreen > 0) {
    gameState.screenTransition.active = true;
    gameState.screenTransition.targetOffset = -canvasHoogte;
    nextY = nextY - canvasHoogte;
    gameState.currentScreen--;
    blok.snelheidX = blok.snelheidX;
    blok.snelheidY = blok.snelheidY;
  }

  if (gameState.currentScreen === 0 && nextY + blok.hoogte > canvasHoogte - GROUND_HEIGHT) {
    nextY = canvasHoogte - GROUND_HEIGHT - blok.hoogte;
    blok.snelheidY = 0;
    blok.snelheidX = 0;
    blok.opGrond = true;
  }

  blok.x = nextX;
  blok.y = nextY;
}

window.addEventListener("keydown", (e) => {
  if (!blok.opGrond) return;

  keyboard[e.code] = true;

  if (e.code === "Space" && !blok.isChargingJump) {
    blok.isChargingJump = true;
    blok.jumpChargeTime = 0;
    blok.springKracht = 0;
  }
});

window.addEventListener("keyup", (e) => {
  keyboard[e.code] = false;

  if (e.code === "Space" && blok.isChargingJump) {
    executeJump();
  }
});

function drawScreen(screenIndex, offset) {
  const level = levels[screenIndex];

  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(0, level.ground.y - offset, canvasBreedte, level.ground.height);

  ctx.fillStyle = "#666666";
  for (const platform of level.platforms) {
    ctx.fillRect(platform.x, platform.y - offset, platform.width, platform.height);
  }
}

function spelLus() {
  ctx.clearRect(0, 0, canvasBreedte, canvasHoogte);
  drawScreen(gameState.currentScreen, 0);
  ctx.fillStyle = blok.kleur;
  ctx.fillRect(blok.x, blok.y, blok.breedte, blok.hoogte);
  updateBlok();
  requestAnimationFrame(spelLus);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

requestAnimationFrame(spelLus);
