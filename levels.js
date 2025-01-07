const LEVEL_DATA = {
  level1: {
    ground: { y: window.innerHeight - 80, height: 80 },
    platforms: [
      { x: 200, y: window.innerHeight - 470, width: 1307, height: 390 },
      { x: 1000, y: window.innerHeight - 470, width: 400, height: 390 },
    ],
  },

  level2: {
    ground: { y: window.innerHeight + 100, height: 0 },
    platforms: [
      { x: 500, y: window.innerHeight - 150, width: 200, height: 20 },
      { x: 900, y: window.innerHeight - 300, width: 200, height: 20 },
    ],
  },
};

export function getLevelData() {
  return LEVEL_DATA;
}
