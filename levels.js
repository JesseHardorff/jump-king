import { config } from "./config.js";

const TARGET_HEIGHT = 716;
const FLOOR_HEIGHT = TARGET_HEIGHT - 65;
const MAX_RIGHT = 959;
const MAX_LEFT = 0;

const LEVEL_DATA = {
  level1: {
    ground: { y: FLOOR_HEIGHT, height: 65 },
    platforms: [
      { x: MAX_LEFT, y: FLOOR_HEIGHT - 285, width: 255, height: 285 },
      { x: MAX_RIGHT - 255, y: FLOOR_HEIGHT - 285, width: 255, height: 285 },
      { x: MAX_RIGHT - 592, y: FLOOR_HEIGHT - 575, width: 225, height: 100 },

      { x: MAX_LEFT, y: 0, width: 15, height: TARGET_HEIGHT - 285 },
      { x: MAX_RIGHT - 15, y: 0, width: 15, height: TARGET_HEIGHT - 285 },
    ],
  },
  level2: {
    ground: { y: TARGET_HEIGHT + 100, height: 0 }, // Ground hidden below view
    platforms: [
      { x: 590, y: TARGET_HEIGHT - 130, width: 195, height: 70 },
      { x: 590, y: TARGET_HEIGHT - 320, width: 175, height: 70 },

      { x: MAX_LEFT, y: 0, width: 15, height: TARGET_HEIGHT },
      { x: MAX_RIGHT - 15, y: 0, width: 15, height: TARGET_HEIGHT },
    ],
  },
};
export function getLevelData() {
  return LEVEL_DATA;
}
