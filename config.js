const canvas = document.getElementById("gameCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

export const config = {
  canvasBreedte: canvas.width,
  canvasHoogte: canvas.height,
  GROUND_HEIGHT: 65,
};
