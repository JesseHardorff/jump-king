const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const canvasBreedte = canvas.width;
const canvasHoogte = canvas.height;

const blok = {
    // Waar het blok begint
    x: 225,
    y: canvasHoogte - 60,
    breedte: 50,
    hoogte: 50,
    kleur: "red",
    snelheidX: 0,
    snelheidY: 0,
    zwaartekracht: 0.1,
    springKracht: 0,
    
    // Hoe hoog je kan springen
    minSpringKracht: 2,
    maxSpringKracht: 7,
    
    // Hoe lang je kan laden
    oplaadTijd: 0,
    maxOplaadTijd: 1300,
    
    isSpringend: false,
    opGrond: true,
    bewegingRichting: 0,  // -1 links, 0 omhoog, 1 rechts
};

function springUitvoering() {
    if (blok.springKracht > 0) {
        // Hoe sterk je springt
        let basisSpringKracht = blok.springKracht * 1.3;
        
        if (blok.bewegingRichting !== 0) {
            blok.snelheidY = -basisSpringKracht;
            // Hoe ver je opzij springt
            blok.snelheidX = blok.bewegingRichting * (blok.springKracht * 0.4);
        } else {
            blok.snelheidY = -basisSpringKracht;
            blok.snelheidX = 0;
        }
        blok.isSpringend = false;
        blok.opGrond = false;
    }
}

function updateBlok() {
    if (blok.isSpringend) {
        blok.oplaadTijd += 16;
        let voortgang = Math.min(blok.oplaadTijd / blok.maxOplaadTijd, 1);
        blok.springKracht = blok.minSpringKracht + (blok.maxSpringKracht - blok.minSpringKracht) * (voortgang * voortgang);
    }

    if (!blok.opGrond) {
        blok.snelheidY += blok.zwaartekracht;
        blok.snelheidX = blok.bewegingRichting * (blok.springKracht * 0.5);
    }

    let volgendeX = blok.x + blok.snelheidX;
    let volgendeY = blok.y + blok.snelheidY;

    // Check of je niet buiten scherm gaat
    if (volgendeX < 0) {
        volgendeX = 0;
        blok.snelheidX = 0;
    }
    if (volgendeX + blok.breedte > canvasBreedte) {
        volgendeX = canvasBreedte - blok.breedte;
        blok.snelheidX = 0;
    }
    if (volgendeY < 0) {
        volgendeY = 0;
        blok.snelheidY = 0;
    }
    if (volgendeY + blok.hoogte > canvasHoogte) {
        volgendeY = canvasHoogte - blok.hoogte;
        blok.snelheidY = 0;
        blok.snelheidX = 0;
        blok.opGrond = true;
    }

    blok.x = volgendeX;
    blok.y = volgendeY;
}

window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp" && blok.opGrond && !blok.isSpringend) {
        blok.bewegingRichting = 0;
        startSprong();
    }
    if (e.code === "ArrowLeft" && blok.opGrond && !blok.isSpringend) {
        blok.bewegingRichting = -1;
        startSprong();
    }
    if (e.code === "ArrowRight" && blok.opGrond && !blok.isSpringend) {
        blok.bewegingRichting = 1;
        startSprong();
    }
});

window.addEventListener("keyup", (e) => {
    if ((e.code === "ArrowUp" && blok.bewegingRichting === 0) ||
        (e.code === "ArrowLeft" && blok.bewegingRichting === -1) ||
        (e.code === "ArrowRight" && blok.bewegingRichting === 1)) {
        if (blok.isSpringend) {
            springUitvoering();
        }
    }
});

function startSprong() {
    blok.isSpringend = true;
    blok.oplaadTijd = 0;
    blok.springKracht = 0;
}

function spelLus() {
    ctx.clearRect(0, 0, canvasBreedte, canvasHoogte);
    updateBlok();
    ctx.fillStyle = blok.kleur;
    ctx.fillRect(blok.x, blok.y, blok.breedte, blok.hoogte);
    requestAnimationFrame(spelLus);
}

requestAnimationFrame(spelLus);
