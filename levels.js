

// Simplified level data with fixed values instead of dynamic calculations
export const LEVEL_DATA = {
  level1: {
      ground: { y: 900, height: 80 },
      platforms: [
          { x: 300, y: 600, width: 400, height: 300 },
          { x: 900, y: 600, width: 400, height: 300 }
      ]
  },
  level2: {
      ground: { y: 1100, height: 0 },
      platforms: [
          { x: 500, y: 800, width: 200, height: 20 },
          { x: 800, y: 700, width: 200, height: 20 }
      ]
  }
};
