// distributions/targetDistributions.js

import { gaussian2d } from './utils';

export const TARGET_TYPES = {
  BANANA: 'Banana',
  BIMODAL: 'Bimodal',
  NESSIE: 'Nessie',
  MICKIE: 'Mickie',
  RING: 'Ring',
  FUNNEL: 'Funnel'
};

export const STEP_SIZES = {
  BANANA: 0.1,
  BIMODAL: 0.1,
  NESSIE: 0.1,
  MICKIE: 0.1,
  RING: 0.05,
  FUNNEL: 0.1
};

export const createTargetDistribution = (targetType) => {
  const distributions = {
    BANANA: (x, y) => {
      const bananaCenterY = 150 + 0.5 * Math.pow((x - 200) / 100, 2) * 100;
      const dx = x - 200;
      const dy = y - bananaCenterY;
      const variance = 2500;
      return 0.5 * Math.exp(-(dx * dx + 4 * dy * dy) / (2 * variance)) / 
             (2 * Math.PI * variance);
    },

    BIMODAL: (x, y) => {
      const d1 = gaussian2d(x, y, 120, 150, 2000, 2000, 0);
      const d2 = gaussian2d(x, y, 280, 220, 900, 900, 0);
      return 0.75 * d1 + 0.25 * d2;
    },

    MICKIE: (x, y) => {
      const d3 = gaussian2d(x, y, 150, 150, 1500, 1500, 0);
      const d4 = gaussian2d(x, y, 250, 150, 1500, 1500, 0);
      const d5 = gaussian2d(x, y, 200, 220, 1500, 1500, 0);
      return (d3 + d4 + d5) / 3;
    },

    NESSIE: (x, y) => {
      const dx = x - 200;
      const leftCurve = dx < 0 ? 0.8 * Math.pow(dx / 100, 2) : 0;
      const rightCurve = dx >= 0 ? 0.3 * Math.pow(dx / 100, 2) : 0;
      const bananaCenterY = 100 + (leftCurve + rightCurve) * 100;
      const dy = y - bananaCenterY;
      const baseVariance = 2500 * (1 + Math.tanh(-dx / 100));
      const heightModulation = 1 + 0.5 * Math.sin(dy / 50);
      const variance = baseVariance * heightModulation;
      const skewTerm = 0.3 * Math.exp(-Math.pow(dx / 100, 2)) * dy * dy / variance;
      return 0.5 * Math.exp(-(dx * dx + 4 * dy * dy + skewTerm) / (2 * variance)) / 
              (2 * Math.PI * Math.sqrt(variance));
    },

    RING: (x, y) => {
      const ringCenterX = 220;
      const ringCenterY = 180;
      const radius = 80;
      const ringWidth = 100;
      const dist = Math.sqrt(Math.pow(x - ringCenterX, 2) + Math.pow(y - ringCenterY, 2));
      return Math.exp(-Math.pow(dist - radius, 2) / (2 * ringWidth)) / 
              Math.sqrt(2 * Math.PI * ringWidth);
    },

    FUNNEL: (x, y) => {
      const funnelBaseY = 150;
      const localVar = Math.exp(0.025 * (x - 200));
      return 0.4 * gaussian2d(x, y, 200, funnelBaseY, 2500, localVar * 2000, 0);
    }
  };

  return distributions[targetType] || (() => 0);
};