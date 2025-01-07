// Basis spelscherm afmetingen voor perfecte ratio
const TARGET_WIDTH = 959; // Vaste breedte van het spelgebied
const TARGET_HEIGHT = 716; // Vaste hoogte van het spelgebied
const canvas = document.getElementById("gameCanvas"); // Haalt het canvas element op
const ctx = canvas.getContext("2d"); // Context nodig voor tekenen

// Functie om canvas grootte aan te passen aan schermgrootte met behoud van ratio
function resizeCanvas() {
  const container = canvas.parentElement;
  // Berekent de verhoudingen van container en gewenste spelgrootte
  const containerAspect = container.clientWidth / container.clientHeight;
  const targetAspect = TARGET_WIDTH / TARGET_HEIGHT;

  // Past canvas aan zodat het altijd in het scherm past met juiste ratio
  if (containerAspect > targetAspect) {
    canvas.height = container.clientHeight;
    canvas.width = container.clientHeight * targetAspect;
  } else {
    canvas.width = container.clientWidth;
    canvas.height = container.clientWidth / targetAspect;
  }
}

resizeCanvas();

// Spel constanten
const GROUND_HEIGHT = 65; // Hoogte van de grond
const GROUND_COLOR = "#4a4a4a"; // Kleur van de grond

// Importeer en setup levels
import { getLevelData } from "./levels.js";
const levels = [getLevelData().level1, getLevelData().level2];

// Spelstatus object
const gameState = {
  currentScreen: 1, // Huidig level (0 = eerste level)
  screenTransition: {
    active: false, // Of er een level overgang bezig is
    offset: 0, // Verschuiving tijdens overgang
    targetOffset: 0, // Doel verschuiving
  },
};

// Speler object met alle eigenschappen
const blok = {
  x: TARGET_WIDTH / 2 - 25, // Start positie horizontaal (midden)
  y: TARGET_HEIGHT - GROUND_HEIGHT - 50, // Start positie verticaal
  breedte: 50, // Breedte van speler
  hoogte: 50, // Hoogte van speler
  kleur: "red", // Kleur van speler
  snelheidX: 0, // Horizontale bewegingssnelheid
  snelheidY: 0, // Verticale bewegingssnelheid
  zwaartekracht: 0, // Valsnelheid
  springKracht: 0, // Huidige springkracht
  minJumpForce: 2, // Minimale springhoogte
  maxJumpForce: 6.17, // Maximale springhoogte
  jumpChargeTime: 0, // Tijd dat spring wordt opgeladen
  maxChargeTime: 1500, // Maximale oplaadtijd voor sprong
  isChargingJump: false, // Of speler aan het opladen is
  opGrond: true, // Of speler op de grond staat
  jumpDirection: 0, // Springrichting (-1 links, 1 rechts)
  bounceStrength: 0.47, // Stuiter sterkte tegen muren
  walkSpeed: 1.2, // Loop snelheid
  isWalking: false, // Of speler loopt
};

// Toetsenbord status
const keyboard = {
  ArrowLeft: false, // Pijl links ingedrukt
  ArrowRight: false, // Pijl rechts ingedrukt
  Space: false, // Spatiebalk ingedrukt
};

// Controleert en handelt platform botsingen af
function checkPlatformCollisions(nextX, nextY) {
  const currentLevel = levels[gameState.currentScreen];

  for (const platform of currentLevel.platforms) {
    // Verticale botsingsdetectie (landen en plafond)
    if (nextX + blok.breedte > platform.x && nextX < platform.x + platform.width) {
      // Landing op platform
      if (blok.y + blok.hoogte <= platform.y && nextY + blok.hoogte > platform.y) {
        nextY = platform.y - blok.hoogte;
        blok.snelheidY = 0;
        blok.snelheidX = 0;
        blok.opGrond = true;
        return { x: nextX, y: nextY };
      }
      // Stoten tegen plafond
      if (blok.y >= platform.y + platform.height && nextY < platform.y + platform.height) {
        nextY = platform.y + platform.height;
        blok.snelheidY = 0;
        return { x: nextX, y: nextY };
      }
    }

    // Horizontale botsingsdetectie (muren)
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

// Update de springkracht tijdens opladen
function updateJumpCharge() {
  if (blok.isChargingJump) {
    blok.jumpChargeTime += 16; // Verhoog oplaadtijd (60fps)
    // Bereken voortgang (0-1)
    let chargeProgress = Math.min(blok.jumpChargeTime / blok.maxChargeTime, 1);
    // Bereken springkracht op basis van voortgang
    blok.springKracht = blok.minJumpForce + (blok.maxJumpForce - blok.minJumpForce) * chargeProgress;

    if (chargeProgress >= 1) {
      executeJump(); // Voer sprong uit bij maximaal opladen
    }
  }
}

// Voer de sprong uit
function executeJump() {
  if (blok.springKracht > 0) {
    let jumpPower = blok.springKracht * 1.3; // Extra kracht voor betere gameplay
    blok.snelheidY = -jumpPower; // Negatieve Y is omhoog

    // Bepaal horizontale richting
    if (keyboard.ArrowLeft) {
      blok.snelheidX = -jumpPower * 0.37;
    } else if (keyboard.ArrowRight) {
      blok.snelheidX = jumpPower * 0.4;
    } else {
      blok.snelheidX = 0;
    }

    // Reset spring-variabelen
    blok.isChargingJump = false;
    blok.opGrond = false;
    blok.isWalking = false;
  }
}

// Handel muurbotsingen af
function handleWallCollision(isLeftWall) {
  blok.snelheidX *= -blok.bounceStrength; // Keer richting om met verminderde snelheid
  blok.springKracht *= blok.bounceStrength; // Verminder springkracht
}

// Update alle beweging en physics van de speler
function updateBlok() {
  updateJumpCharge();

  // Horizontale beweging op de grond
  if (blok.opGrond && !blok.isChargingJump) {
    let nextPosition = blok.x;

    // Beweeg links of rechts
    if (keyboard.ArrowLeft) {
      nextPosition = blok.x - blok.walkSpeed;
    }
    if (keyboard.ArrowRight) {
      nextPosition = blok.x + blok.walkSpeed;
    }

    const currentLevel = levels[gameState.currentScreen];
    let canMove = true;

    // Check of nieuwe positie vrij is
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

    // Beweeg speler als er geen obstakel is
    if (canMove) {
      blok.x = nextPosition;
      if (keyboard.ArrowLeft) blok.jumpDirection = -1;
      if (keyboard.ArrowRight) blok.jumpDirection = 1;
    }
  }

  // Check of speler nog op platform/grond staat
  if (blok.opGrond) {
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

    // Check of speler op de grond staat
    const isOnGround =
      gameState.currentScreen === 0 && Math.abs(blok.y + blok.hoogte - (TARGET_HEIGHT - GROUND_HEIGHT)) < 2;

    // Val als speler niet op platform/grond staat
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

  // Pas zwaartekracht toe als speler in de lucht is
  if (!blok.opGrond) {
    blok.snelheidY += blok.zwaartekracht;
  }

  // Bereken nieuwe positie
  let nextX = blok.x + blok.snelheidX;
  let nextY = blok.y + blok.snelheidY;

  // Check en handel botsingen af
  const collision = checkPlatformCollisions(nextX, nextY);
  nextX = collision.x;
  nextY = collision.y;

  // Scherm grenzen
  if (nextX < 0) {
    nextX = 0;
    blok.snelheidX = 0;
  }
  if (nextX + blok.breedte > TARGET_WIDTH) {
    nextX = TARGET_WIDTH - blok.breedte;
    blok.snelheidX = 0;
  }

  // Level overgangen
  if (nextY + blok.hoogte < 0 && gameState.currentScreen < levels.length - 1) {
    // Only transition when the entire block is above the screen
    gameState.screenTransition.active = true;
    gameState.screenTransition.targetOffset = TARGET_HEIGHT;
    nextY = TARGET_HEIGHT + nextY;
    gameState.currentScreen++;
  }

  if (nextY > TARGET_HEIGHT && gameState.currentScreen > 0) {
    gameState.screenTransition.active = true;
    gameState.screenTransition.targetOffset = -TARGET_HEIGHT;
    nextY = nextY - TARGET_HEIGHT;
    gameState.currentScreen--;
  }

  // Grond collision in eerste level
  if (gameState.currentScreen === 0 && nextY + blok.hoogte > TARGET_HEIGHT - GROUND_HEIGHT) {
    nextY = TARGET_HEIGHT - GROUND_HEIGHT - blok.hoogte;
    blok.snelheidY = 0;
    blok.snelheidX = 0;
    blok.opGrond = true;
  }

  // Update speler positie
  blok.x = nextX;
  blok.y = nextY;
}

// Toetsenbord event listeners
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

// Teken het huidige level
function drawScreen(screenIndex, offset) {
  const level = levels[screenIndex];
  // Teken de grond
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(0, level.ground.y - offset, TARGET_WIDTH, level.ground.height);
  // Teken de platforms
  ctx.fillStyle = "#666666";
  for (const platform of level.platforms) {
    ctx.fillRect(platform.x, platform.y - offset, platform.width, platform.height);
  }
}

// Hoofdspellus
function spelLus() {
  // Maak canvas leeg
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Schaal context voor juiste ratio
  const scaleX = canvas.width / TARGET_WIDTH;
  const scaleY = canvas.height / TARGET_HEIGHT;
  ctx.scale(scaleX, scaleY);

  // Teken level en speler
  drawScreen(gameState.currentScreen, 0);
  ctx.fillStyle = blok.kleur;
  ctx.fillRect(blok.x, blok.y, blok.breedte, blok.hoogte);

  // Reset transformatie
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Update speler en vraag volgende frame aan
  updateBlok();
  requestAnimationFrame(spelLus);
}

// Luister naar schermgrootte veranderingen
window.addEventListener("resize", resizeCanvas);

// Start de spellus
requestAnimationFrame(spelLus);
