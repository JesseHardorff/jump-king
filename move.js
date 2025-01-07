// Canvas setup first
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let canvasBreedte = window.innerWidth;
let canvasHoogte = window.innerHeight;
canvas.width = canvasBreedte;
canvas.height = canvasHoogte;

// Rest of your fullscreen handling code...

// Fullscreen handling
let isFullscreen = false;
let gameInitialized = false;

function enterFullscreen() {
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  }
}
function initializeGame() {
  // Update canvas dimensions
  canvasBreedte = window.innerWidth;
  canvasHoogte = window.innerHeight;
  canvas.width = canvasBreedte;
  canvas.height = canvasHoogte;

  // Update game state properties
  gameState.currentScreen = 0;
  gameState.screenTransition.active = false;
  gameState.screenTransition.offset = 0;
  gameState.screenTransition.targetOffset = 0;

  // Initialize player block
  blok.x = canvasBreedte / 2 - 25;
  blok.y = canvasHoogte - GROUND_HEIGHT - 50;

  gameInitialized = true;
}
      
// Check if previously was in fullscreen and restore it
if (localStorage.getItem("wasFullscreen") === "true") {
  enterFullscreen();
}

// Store fullscreen state when it changes
document.addEventListener("fullscreenchange", () => {
  localStorage.setItem("wasFullscreen", document.fullscreenElement !== null);
});

function exitHandler() {
  isFullscreen = document.fullscreenElement !== null;
  if (isFullscreen && !gameInitialized) {
    initializeGame();
  }
}

// Event listeners for fullscreen
document.addEventListener("fullscreenchange", exitHandler);
window.addEventListener("keydown", (e) => {
  if (e.key === "F11") {
    enterFullscreen();
    e.preventDefault();
  }
});

// Modified game loop
function spelLus() {
  if (!isFullscreen) {
    // Show fullscreen prompt
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvasBreedte, canvasHoogte);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press F11 for Fullscreen", canvasBreedte / 2, canvasHoogte / 2);
  } else if (gameInitialized) {
    // Run game only when fullscreen and initialized
    ctx.clearRect(0, 0, canvasBreedte, canvasHoogte);
    drawScreen(gameState.currentScreen, 0);
    ctx.fillStyle = blok.kleur;
    ctx.fillRect(blok.x, blok.y, blok.breedte, blok.hoogte);
    updateBlok();
  }
  requestAnimationFrame(spelLus);
}

// Import configurations
import { config } from "./config.js";
import { LEVEL_DATA } from "./levels.js";

// Ground settings
const GROUND_HEIGHT = window.innerHeight * 0.1;
const GROUND_COLOR = "#4a4a4a";

// Initialize levels
const levels = [LEVEL_DATA.level1, LEVEL_DATA.level2];

// Game state management
const gameState = {
  currentScreen: 0,
  screenTransition: {
    active: false,
    offset: 0,
    targetOffset: 0,
  },
};

// De speler met alle eigenschappen voor beweging en besturing
const blok = {
  // Startpositie in het midden van het scherm, net boven de grond
  x: canvasBreedte / 2 - 25,
  y: canvasHoogte - GROUND_HEIGHT - 50,
  breedte: 50,
  hoogte: 50,
  kleur: "red",

  // Bewegingsvariabelen voor beweging
  snelheidX: 0, // Horizontale snelheid
  snelheidY: 0, // Verticale snelheid
  zwaartekracht: 0.1, // Hoe snel de speler valt

  // Spring-mechanisme variabelen
  springKracht: 0, // Actuele kracht van de sprong
  minJumpForce: 2, // Minimale hoogte bij kort indrukken
  maxJumpForce: 7.2, // Maximale hoogte bij volledig opladen
  jumpChargeTime: 0, // Hoe lang de sprong al wordt opgeladen
  maxChargeTime: 800, // Maximale oplaadtijd in milliseconden
  isChargingJump: false, // Of de speler de sprong aan het opladen is

  // Status variabelen
  opGrond: true, // Of de speler op een platform/grond staat
  jumpDirection: 0, // Springrichting (-1 links, 0 midden, 1 rechts)
  bounceStrength: 0.6, // Hoe sterk de speler terugstuitert van muren
  walkSpeed: 3, // Horizontale loopsnelheid
  isWalking: false, // Of de speler aan het lopen is
};

// Houdt bij welke toetsen ingedrukt zijn voor besturing
const keyboard = {
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
};

// Controleert en handelt alle botsingen met platforms af
function checkPlatformCollisions(nextX, nextY) {
  const currentLevel = levels[gameState.currentScreen];

  for (const platform of currentLevel.platforms) {
    // Verticale botsingsdetectie (landen en plafond raken)
    if (nextX + blok.breedte > platform.x && nextX < platform.x + platform.width) {
      // Controleert landing op platform
      if (blok.y + blok.hoogte <= platform.y && nextY + blok.hoogte > platform.y) {
        nextY = platform.y - blok.hoogte; // Zet speler op platform
        blok.snelheidY = 0; // Stop verticale beweging
        blok.snelheidX = 0; // Stop horizontale beweging
        blok.opGrond = true; // Speler kan nu springen
        return { x: nextX, y: nextY };
      }

      // Controleert botsing met onderkant platform
      if (blok.y >= platform.y + platform.height && nextY < platform.y + platform.height) {
        nextY = platform.y + platform.height; // Duw speler onder platform
        blok.snelheidY = 0; // Stop verticale beweging
        return { x: nextX, y: nextY };
      }
    }

    // Horizontale botsingsdetectie (muren raken)
    if (nextY + blok.hoogte > platform.y && nextY < platform.y + platform.height) {
      // Linker muur botsing
      if (blok.x + blok.breedte <= platform.x && nextX + blok.breedte > platform.x) {
        nextX = platform.x - blok.breedte;
        handleWallCollision(true);
      }
      // Rechter muur botsing
      if (blok.x >= platform.x + platform.width && nextX < platform.x + platform.width) {
        nextX = platform.x + platform.width;
        handleWallCollision(false);
      }
    }
  }

  return { x: nextX, y: nextY };
}

// Berekent de springkracht tijdens het opladen
function updateJumpCharge() {
  if (blok.isChargingJump) {
    blok.jumpChargeTime += 16; // Ongeveer 60 keer per seconde bij 60fps
    // Berekent voortgang tussen 0 en 1
    let chargeProgress = Math.min(blok.jumpChargeTime / blok.maxChargeTime, 1);
    // Berekent springkracht op basis van oplaadtijd
    blok.springKracht = blok.minJumpForce + (blok.maxJumpForce - blok.minJumpForce) * chargeProgress;

    // Voert sprong automatisch uit bij maximaal opladen
    if (chargeProgress >= 1) {
      executeJump();
    }
  }
}

// Voert de sprong uit met de opgebouwde kracht
function executeJump() {
  if (blok.springKracht > 0) {
    let jumpPower = blok.springKracht * 1.3; // Extra boost voor betere gameplay
    blok.snelheidY = -jumpPower; // Negatief is omhoog

    // Bepaalt horizontale richting van de sprong
    if (keyboard.ArrowLeft) {
      blok.snelheidX = -jumpPower * 0.4; // 40% van springkracht voor horizontale beweging
    } else if (keyboard.ArrowRight) {
      blok.snelheidX = jumpPower * 0.4;
    } else {
      blok.snelheidX = 0; // Recht omhoog als geen richting
    }

    // Reset spring-gerelateerde variabelen
    blok.isChargingJump = false;
    blok.opGrond = false;
    blok.isWalking = false;
  }
}

// Handelt het terugstuiteren van muren af
function handleWallCollision(isLeftWall) {
  // Vermindert snelheid en springkracht bij stuiteren
  blok.snelheidX *= -blok.bounceStrength;
  blok.springKracht *= blok.bounceStrength;
}

// Update alle beweging en physics van de speler
function updateBlok() {
  updateJumpCharge();

  // Horizontale beweging op de grond
  if (blok.opGrond && !blok.isChargingJump) {
    let nextPosition = blok.x;

    if (keyboard.ArrowLeft) {
      nextPosition = blok.x - blok.walkSpeed;
    }
    if (keyboard.ArrowRight) {
      nextPosition = blok.x + blok.walkSpeed;
    }

    // Controleert of de nieuwe positie vrij is
    const currentLevel = levels[gameState.currentScreen];
    let canMove = true;

    for (const platform of currentLevel.platforms) {
      // Controleert botsing met platforms tijdens lopen
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

    // Beweegt speler en update springrichting
    if (canMove) {
      blok.x = nextPosition;
      if (keyboard.ArrowLeft) blok.jumpDirection = -1;
      if (keyboard.ArrowRight) blok.jumpDirection = 1;
    }
  }

  // Controleert of speler nog op platform staat
  if (blok.opGrond) {
    let futureY = blok.y + 2;
    let isOnPlatform = false;

    const currentLevel = levels[gameState.currentScreen];
    for (const platform of currentLevel.platforms) {
      // Controleert of speler boven platform is
      if (
        blok.x + blok.breedte > platform.x &&
        blok.x < platform.x + platform.width &&
        Math.abs(blok.y + blok.hoogte - platform.y) < 2
      ) {
        isOnPlatform = true;
        break;
      }
    }

    // Controleert of speler op de grond staat
    const isOnGround =
      gameState.currentScreen === 0 && Math.abs(blok.y + blok.hoogte - (canvasHoogte - GROUND_HEIGHT)) < 2;

    // Start val als speler niet op platform/grond staat
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

  // Past zwaartekracht toe tijdens vallen
  if (!blok.opGrond) {
    blok.snelheidY += blok.zwaartekracht;
  }

  // Berekent nieuwe positie
  let nextX = blok.x + blok.snelheidX;
  let nextY = blok.y + blok.snelheidY;

  // Controleert botsingen met platforms
  const collision = checkPlatformCollisions(nextX, nextY);
  nextX = collision.x;
  nextY = collision.y;

  // Voorkomt dat speler buiten scherm gaat
  if (nextX < 0) {
    nextX = 0;
    handleWallCollision(true);
  }
  if (nextX + blok.breedte > canvasBreedte) {
    nextX = canvasBreedte - blok.breedte;
    handleWallCollision(false);
  }

  // Regelt overgang naar volgend level
  if (nextY < 0 && gameState.currentScreen < levels.length - 1) {
    gameState.screenTransition.active = true;
    gameState.screenTransition.targetOffset = canvasHoogte;
    nextY = canvasHoogte + nextY;
    gameState.currentScreen++;
    blok.snelheidX = blok.snelheidX;
    blok.snelheidY = blok.snelheidY;
  }

  // Regelt overgang naar vorig level
  if (nextY > canvasHoogte && gameState.currentScreen > 0) {
    gameState.screenTransition.active = true;
    gameState.screenTransition.targetOffset = -canvasHoogte;
    nextY = nextY - canvasHoogte;
    gameState.currentScreen--;
    blok.snelheidX = blok.snelheidX;
    blok.snelheidY = blok.snelheidY;
  }

  // Controleert botsing met grond in eerste level
  if (gameState.currentScreen === 0 && nextY + blok.hoogte > canvasHoogte - GROUND_HEIGHT) {
    nextY = canvasHoogte - GROUND_HEIGHT - blok.hoogte;
    blok.snelheidY = 0;
    blok.snelheidX = 0;
    blok.opGrond = true;
  }

  // Update eindpositie van speler
  blok.x = nextX;
  blok.y = nextY;
}

// Luistert naar toetsaanslagen voor besturing
window.addEventListener("keydown", (e) => {
  if (!blok.opGrond) return; // Kan alleen springen op de grond

  keyboard[e.code] = true;

  // Start spring opladen bij spatiebalk
  if (e.code === "Space" && !blok.isChargingJump) {
    blok.isChargingJump = true;
    blok.jumpChargeTime = 0;
    blok.springKracht = 0;
  }
});

// Luistert naar het loslaten van toetsen
window.addEventListener("keyup", (e) => {
  keyboard[e.code] = false;

  // Voert sprong uit bij loslaten spatiebalk
  if (e.code === "Space" && blok.isChargingJump) {
    executeJump();
  }
});

// Tekent het huidige level met platforms
function drawScreen(screenIndex, offset) {
  const level = levels[screenIndex];

  // Set background color
  ctx.fillStyle = "#87CEEB"; // Sky blue background
  ctx.fillRect(0, 0, canvasBreedte, canvasHoogte);

  // Draw black borders
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, config.BORDER_WIDTH, canvasHoogte);
  ctx.fillRect(canvasBreedte - config.BORDER_WIDTH, 0, config.BORDER_WIDTH, canvasHoogte);

  // Draw ground
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(
    config.BORDER_WIDTH,
    level.ground.y - offset,
    canvasBreedte - config.BORDER_WIDTH * 2,
    level.ground.height
  );

  // Draw platforms
  ctx.fillStyle = "#666666";
  for (const platform of level.platforms) {
    ctx.fillRect(platform.x, platform.y - offset, platform.width, platform.height);
  }
}

// Past canvas grootte aan bij window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Start het spel
requestAnimationFrame(spelLus);
