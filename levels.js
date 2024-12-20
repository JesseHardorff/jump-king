import { config } from "./config.js";

const LEVEL_DATA = {
  level1: {
    ground: { y: config.canvasHoogte - 80, height: 80 },
    platforms: [
      { x: 0, y: config.canvasHoogte - 470, width: 500, height: 390 },
      { x: config.canvasBreedte - 500, y: config.canvasHoogte - 470, width: 500, height: 390 },
    ],
  },

  level2: {
    ground: { y: config.canvasHoogte + 100, height: 0 },
    platforms: [
      { x: 100, y: config.canvasHoogte - 150, width: 200, height: 20 },
      { x: config.canvasBreedte - 300, y: config.canvasHoogte - 300, width: 200, height: 20 },
    ],
  },
};

export function getLevelData() {
  return LEVEL_DATA;
}
