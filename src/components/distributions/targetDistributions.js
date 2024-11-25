// distributions/targetDistributions.js

import { logGaussian2d, logsumexp } from './utils';

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

export const LOG_NORMALIZATION_CONSTANTS = {
  BANANA: -0.693,
  BIMODAL: 0,
  NESSIE: 3.230,
  MICKIE: 0,
  RING: 6.22,
  FUNNEL: 0
};

// target (unnormalized) log pdfs
export const createTargetDistribution = (targetType) => {
  const distributions = {
    BANANA: (x, y) => {
      const bananaCenterY = 150 + 0.5 * Math.pow((x - 200) / 100, 2) * 100;
      const dx = x - 200;
      const dy = y - bananaCenterY;
      const variance = 2500;
      return -(dx * dx + 4 * dy * dy) / (2 * variance) - 
             Math.log(2 * Math.PI * variance);
    },

    BIMODAL: (x, y) => {
      const logD1 = logGaussian2d(x, y, 120, 150, 2000, 2000, 0);
      const logD2 = logGaussian2d(x, y, 280, 220, 900, 900, 0);
      return logsumexp([Math.log(0.75) + logD1, Math.log(0.25) + logD2]);
    },

    MICKIE: (x, y) => {
      const logD3 = logGaussian2d(x, y, 150, 150, 1500, 1500, 0);
      const logD4 = logGaussian2d(x, y, 250, 150, 1500, 1500, 0);
      const logD5 = logGaussian2d(x, y, 200, 220, 1500, 1500, 0);
      return logsumexp([
        Math.log(1/3) + logD3,
        Math.log(1/3) + logD4,
        Math.log(1/3) + logD5
      ]);
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
      return -(dx * dx + 4 * dy * dy + skewTerm) / (2 * variance) - 
             Math.log(2 * Math.PI * Math.sqrt(variance));
    },

    RING: (x, y) => {
      const ringCenterX = 220;
      const ringCenterY = 180;
      const radius = 80;
      const ringWidth = 100;
      const dist = Math.sqrt(Math.pow(x - ringCenterX, 2) + Math.pow(y - ringCenterY, 2));
      return -Math.pow(dist - radius, 2) / (2 * ringWidth) - 
             0.5 * Math.log(2 * Math.PI * ringWidth);
    },

    FUNNEL: (x, y) => {
      const funnelBaseY = 150;
      const localVar = Math.exp(0.025 * (x - 200));
      return logGaussian2d(x, y, 200, funnelBaseY, 2500, localVar * 2000, 0);
    }
  };

  return distributions[targetType] || (() => -Infinity);
};