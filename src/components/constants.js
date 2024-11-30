// components/constants.js
export const GRID_SIZE = 100;
export const X_RANGE = [0, 400];
export const Y_RANGE = [0, 300];
export const DX = (X_RANGE[1] - X_RANGE[0]) / GRID_SIZE;
export const DY = (Y_RANGE[1] - Y_RANGE[0]) / GRID_SIZE;

export const INITIAL_VALUES = {
  meanX: 1.5,
  meanY: -1.5,
  logVarX: Math.log(1600),
  logVarY: Math.log(1600),
  logitCorr: 0,
  mean1X: 1.0,
  mean1Y: -1.0,
  mean2X: 1.5,
  mean2Y: -1.5,
  mean3X: 2.0,
  mean3Y: -2.0,
  logVar1: Math.log(900),
  logVar2: Math.log(900),
  logVar3: Math.log(900),
  mean1_10X: 1.0,
  mean1_10Y: -1.0,
  mean2_10X: 1.2,
  mean2_10Y: -1.2,
  mean3_10X: 1.4,
  mean3_10Y: -1.4,
  mean4_10X: 1.6,
  mean4_10Y: -1.6,
  mean5_10X: 1.8,
  mean5_10Y: -1.8,
  mean6_10X: 2.0,
  mean6_10Y: -2.0,
  mean7_10X: 2.2,
  mean7_10Y: -2.2,
  mean8_10X: 2.4,
  mean8_10Y: -2.4,
  mean9_10X: 2.6,
  mean9_10Y: -2.6,
  mean10_10X: 2.8,
  mean10_10Y: -2.8,
  logVar_10: Math.log(625)
};

export const POSTERIOR_TYPES = {
  ISOTROPIC: 'Gaussian (isotropic)',
  DIAGONAL: 'Gaussian (diagonal covariance)',
  FULL: 'Gaussian (full covariance)',
  MIXTURE: 'Mixture of 3 equal-weight isotropic Gaussians',
  MIXTURE_10: 'Mixture of 10 equal-weight isotropic Gaussians'
};

export const BOUNDS = {
  meanX: [-3, 3],
  meanY: [-3, 3],
  logVarX: [Math.log(100), Math.log(5000)],
  logVarY: [Math.log(100), Math.log(5000)],
  logitCorr: [Math.log(0.005 / 0.995), Math.log(0.995 / 0.005)],
  logVar: [Math.log(100), Math.log(5000)]
};

export const OPTIMIZATION_STEPS = 100;