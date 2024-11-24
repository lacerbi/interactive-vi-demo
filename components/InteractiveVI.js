import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const InteractiveVI = () => {

  // Constants for grid calculation
  const GRID_SIZE = 100;
  const X_RANGE = [0, 400];
  const Y_RANGE = [0, 300];
  const DX = (X_RANGE[1] - X_RANGE[0]) / GRID_SIZE;
  const DY = (Y_RANGE[1] - Y_RANGE[0]) / GRID_SIZE;

  const INITIAL_VALUES = {
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
    logVar3: Math.log(900)    
  };

  const POSTERIOR_TYPES = {
    ISOTROPIC: 'Gaussian (isotropic)',
    DIAGONAL: 'Gaussian (diagonal covariance)',
    FULL: 'Gaussian (full covariance)',
    MIXTURE: 'Mixture of 3 equal-weight isotropic Gaussians'
  };

  const BOUNDS = {
    meanX: [-3, 3],
    meanY: [-3, 3],
    logVarX: [Math.log(400), Math.log(10000)],
    logVarY: [Math.log(400), Math.log(10000)],
    logitCorr: [Math.log(0.005 / 0.995), Math.log(0.995 / 0.005)],
    logVar: [Math.log(400), Math.log(10000)]
  };
  
  // Add a new state for tracking dragging
  const [isDragging, setIsDragging] = useState(false);

  // State for the variational parameters
  const [meanX, setMeanX] = useState(INITIAL_VALUES.meanX);  // (-3 to 3 scale)
  const [meanY, setMeanY] = useState(INITIAL_VALUES.meanY);  // (-3 to 3 scale)
  const [logVarX, setLogVarX] = useState(INITIAL_VALUES.logVarX);  // log variance
  const [logVarY, setLogVarY] = useState(INITIAL_VALUES.logVarY);  // log variance
  const [logitCorr, setLogitCorr] = useState(INITIAL_VALUES.logitCorr);  // logit correlation  

  // Add state for mixture components
  const [mean1X, setMean1X] = useState(INITIAL_VALUES.mean1X);
  const [mean1Y, setMean1Y] = useState(INITIAL_VALUES.mean1Y);
  const [mean2X, setMean2X] = useState(INITIAL_VALUES.mean2X);
  const [mean2Y, setMean2Y] = useState(INITIAL_VALUES.mean2Y);
  const [mean3X, setMean3X] = useState(INITIAL_VALUES.mean3X);
  const [mean3Y, setMean3Y] = useState(INITIAL_VALUES.mean3Y);
  const [logVar1, setLogVar1] = useState(INITIAL_VALUES.logVar1);
  const [logVar2, setLogVar2] = useState(INITIAL_VALUES.logVar2);
  const [logVar3, setLogVar3] = useState(INITIAL_VALUES.logVar3);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const transformMeanX = (x) => X_RANGE[0] + (x + 3) * (X_RANGE[1] - X_RANGE[0]) / 6;
  const transformMeanY = (y) => Y_RANGE[0] + (y + 3) * (Y_RANGE[1] - Y_RANGE[0]) / 6;
  const transformVarX = (logVar) => Math.exp(logVar);
  const transformVarY = (logVar) => Math.exp(logVar);
  const transformCorr = (logitCorr) => (2 / (1 + Math.exp(-logitCorr)) - 1);
  
  // Transform functions for mixture components
  const transformMeanForComponent = (meanValue, componentIndex) => {
    const meanX = componentIndex === 1 ? mean1X : componentIndex === 2 ? mean2X : mean3X;
    return X_RANGE[0] + (meanX + 3) * (X_RANGE[1] - X_RANGE[0]) / 6;
  };
  const transformVarForComponent = (logVar) => Math.exp(logVar);

  const displayMeanX = transformMeanX(meanX);
  const displayMeanY = transformMeanY(meanY);
  const displayVarX = transformVarX(logVarX);
  const displayVarY = transformVarY(logVarY);
  const displayCorr = transformCorr(logitCorr);

  const [gradientData, setGradientData] = useState([]);
  const [elbo, setElbo] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState(0);
  const [posteriorType, setPosteriorType] = useState(POSTERIOR_TYPES.FULL);
  const [targetType, setTargetType] = useState('BANANA');
  const [elboComponents, setElboComponents] = useState({
    crossEntropy: 0,
    entropy: 0,
    elbo: 0
  });

  // Helper function for 2D Gaussian
  const gaussian2d = useCallback((x, y, mx, my, vx, vy, rho) => {
    const dx = x - mx;
    const dy = y - my;
    const correlation = (dx * dx) / vx + (dy * dy) / vy - 
                       2 * rho * dx * dy / Math.sqrt(vx * vy);
    return Math.exp(-correlation / (2 * (1 - rho * rho))) / 
           (2 * Math.PI * Math.sqrt(vx * vy * (1 - rho * rho)));
  }, []);

  const TARGET_TYPES = {
    BANANA: 'Banana',
    BIMODAL: 'Bimodal',
    NESSIE: 'Nessie',
    MICKIE: 'Mickie',
    RING: 'Ring',
    FUNNEL: 'Funnel'
  };

  // Constants for optimization
  const STEP_SIZES = {
    BANANA: 0.2,
    BIMODAL: 0.2,
    NESSIE: 0.1,
    MICKIE: 0.1,
    RING: 0.05,
    FUNNEL: 0.1
  };
  const STEP_SIZE = STEP_SIZES[targetType];
  const OPTIMIZATION_STEPS = 50;

  // Target distributions
  const targetDist = useCallback((x, y) => {
    switch (targetType) {  
        case 'BANANA': {
            const bananaCenterY = 150 + 0.5 * Math.pow((x - 200) / 100, 2) * 100;
            const dx = x - 200;
            const dy = y - bananaCenterY;
            const variance = 2500;
            return 0.5 * Math.exp(-(dx * dx + 4 * dy * dy) / (2 * variance)) / (2 * Math.PI * variance);
        }
      case 'BIMODAL': {
        const d1 = gaussian2d(x, y, 120, 150, 2000, 2000, 0);
        const d2 = gaussian2d(x, y, 280, 220, 900, 900, 0);
        return 0.75 * d1 + 0.25 * d2;
      }
      case 'MICKIE': {
        const d3 = gaussian2d(x, y, 150, 150, 1500, 1500, 0);
        const d4 = gaussian2d(x, y, 250, 150, 1500, 1500, 0);
        const d5 = gaussian2d(x, y, 200, 220, 1500, 1500, 0);
        return (d3 + d4 + d5) / 3;
      }
      case 'NESSIE': {
        // Base position
        const dx = x - 200;
        
        // Asymmetric curve shape:
        // - Different quadratic coefficients for left/right sides
        // - Vertical shift that varies with x
        const leftCurve = dx < 0 ? 0.8 * Math.pow(dx / 100, 2) : 0;
        const rightCurve = dx >= 0 ? 0.3 * Math.pow(dx / 100, 2) : 0;
        const bananaCenterY = 100 + (leftCurve + rightCurve) * 100;
        
        // Vertical distance from curve
        const dy = y - bananaCenterY;
        
        // Varying thickness along the curve:
        // - Thicker on left side, thinner on right
        // - Additional modulation based on height
        const baseVariance = 2500 * (1 + Math.tanh(-dx / 100)); // Varies from ~5000 to ~0
        const heightModulation = 1 + 0.5 * Math.sin(dy / 50); // Oscillates between 0.5 and 1.5
        const variance = baseVariance * heightModulation;
        
        // Skewness: add asymmetric vertical displacement based on horizontal position
        const skewTerm = 0.3 * Math.exp(-Math.pow(dx / 100, 2)) * dy * dy / variance;
        
        // Density modulation: higher density on one end
        const densityModulation = 1 // 0.5 + 0.5 * Math.tanh(dx / 100);
        
        // Combine everything
        return 0.5 * densityModulation * 
               Math.exp(-(dx * dx + 4 * dy * dy + skewTerm) / (2 * variance)) / 
               (2 * Math.PI * Math.sqrt(variance));
      }
      case 'RING': {
        const ringCenterX = 220;
        const ringCenterY = 180;
        const radius = 80;
        const ringWidth = 100;
        const dist = Math.sqrt(Math.pow(x - ringCenterX, 2) + Math.pow(y - ringCenterY, 2));
        return Math.exp(-Math.pow(dist - radius, 2) / (2 * ringWidth)) / Math.sqrt(2 * Math.PI * ringWidth);
      }
      case 'FUNNEL': {
        const funnelBaseY = 150;
        const localVar = Math.exp(0.025 * (x - 200));
        return 0.4 * gaussian2d(x, y, 200, funnelBaseY, 2500, localVar * 2000, 0);
      }
      default:
        return 0;
    }
  }, [targetType, gaussian2d]);

  // Helper function to calculate distance
  const getDistanceToComponent = useCallback((mouseX, mouseY, meanX, meanY) => {
    const dx = mouseX - transformMeanX(meanX);
    const dy = mouseY - transformMeanY(meanY);
    return Math.sqrt(dx * dx + dy * dy);
  }, [transformMeanX, transformMeanY]);

    // Check if point is within 1SD ellipse
    const isWithinEllipse = useCallback((mouseX, mouseY, meanX, meanY, logVar) => {
        const dx = mouseX - transformMeanX(meanX);
        const dy = mouseY - transformMeanY(meanY);
        const variance = Math.exp(logVar);
        
        // For isotropic Gaussian, check if point is within circular 1SD contour
        return (dx * dx + dy * dy) <= variance;
    }, [transformMeanX, transformMeanY]);

  // Variational distribution
  const varDist = useCallback((x, y) => {
    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
      const component1 = gaussian2d(
        x, y,
        transformMeanX(mean1X), transformMeanY(mean1Y),
        transformVarForComponent(logVar1), transformVarForComponent(logVar1),
        0
      );
      const component2 = gaussian2d(
        x, y,
        transformMeanX(mean2X), transformMeanY(mean2Y),
        transformVarForComponent(logVar2), transformVarForComponent(logVar2),
        0
      );
      const component3 = gaussian2d(
        x, y,
        transformMeanX(mean3X), transformMeanY(mean3Y),
        transformVarForComponent(logVar3), transformVarForComponent(logVar3),
        0
      );
      return (component1 + component2 + component3) / 3;
    } else {
      // This is the original code for single Gaussian cases
      return gaussian2d(
        x, y, 
        displayMeanX, displayMeanY,
        displayVarX, displayVarY, 
        displayCorr
      );
    }
  }, [mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y, 
      logVar1, logVar2, logVar3, posteriorType, 
      displayMeanX, displayMeanY, displayVarX, displayVarY, displayCorr, 
      gaussian2d]);

  // Generate density gradient data
  useEffect(() => {
    const data = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const x = X_RANGE[0] + (i + 0.5) * DX;
        const y = Y_RANGE[0] + (j + 0.5) * DY;
        const density = targetDist(x, y);
        data.push({ x, y, density });
      }
    }
    setGradientData(data);
  }, [targetDist, DX, DY, X_RANGE, Y_RANGE, targetType]);

// Calculate ELBO components for given parameters using q-aligned grid
const calculateElboComponents = useCallback((params = null) => {
    let crossEntropySum = 0;
    let entropySum = 0;
    
    const GRID_SIZE = 40;
    const GRID_EXTENT = 3; 
    const du = (2 * GRID_EXTENT) / GRID_SIZE;

    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
        // Parameters for mixture case
        const {
            mean1X: m1x = mean1X,
            mean1Y: m1y = mean1Y,
            logVar1: lv1 = logVar1,
            mean2X: m2x = mean2X,
            mean2Y: m2y = mean2Y,
            logVar2: lv2 = logVar2,
            mean3X: m3x = mean3X,
            mean3Y: m3y = mean3Y,
            logVar3: lv3 = logVar3
        } = params || {};

        const gaussianDensity = (x, y, mx, my, v) => {
            const dx = x - mx;
            const dy = y - my;
            return Math.exp(-(dx * dx + dy * dy) / (2 * v)) / (2 * Math.PI * v);
        };

        const WEIGHT = 1/3;
        
        const components = [
            { 
                mx: transformMeanX(m1x), 
                my: transformMeanY(m1y), 
                v: transformVarForComponent(lv1) 
            },
            { 
                mx: transformMeanX(m2x), 
                my: transformMeanY(m2y), 
                v: transformVarForComponent(lv2) 
            },
            { 
                mx: transformMeanX(m3x), 
                my: transformMeanY(m3y), 
                v: transformVarForComponent(lv3) 
            }
        ];

        components.forEach(comp => {
            const sqrtV = Math.sqrt(comp.v);
            
            for(let i = 0; i < GRID_SIZE; i++) {
                for(let j = 0; j < GRID_SIZE; j++) {
                    const u = -GRID_EXTENT + (i + 0.5) * du;
                    const v = -GRID_EXTENT + (j + 0.5) * du;
                    
                    const x = comp.mx + u * sqrtV;
                    const y = comp.my + v * sqrtV;
                    
                    const qComp = gaussianDensity(x, y, comp.mx, comp.my, comp.v);
                    
                    const q = WEIGHT * components.reduce((sum, c) => 
                        sum + gaussianDensity(x, y, c.mx, c.my, c.v), 0
                    );
                    
                    if(q > 1e-10) {
                        const p = targetDist(x, y);
                        const contribution = WEIGHT * qComp * du * du * comp.v;
                        crossEntropySum += contribution * Math.log(p + 1e-10);
                        entropySum -= contribution * Math.log(q + 1e-10);
                    }
                }
            }
        });
    } else {
        // Parameters for single Gaussian case
        const {
            meanX: mx = meanX,
            meanY: my = meanY,
            logVarX: lvx = logVarX,
            logVarY: lvy = logVarY,
            logitCorr: lc = logitCorr
        } = params || {};

        // Transform parameters
        const vx = transformVarX(lvx);
        const vy = transformVarY(lvy);
        const rho = transformCorr(lc);
        const tMx = transformMeanX(mx);
        const tMy = transformMeanY(my);

        const sqrtVx = Math.sqrt(vx);
        const sqrtVy = Math.sqrt(vy);
        const angle = 0.5 * Math.atan2(2 * rho * sqrtVx * sqrtVy, vx - vy);
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        const jacobian = sqrtVx * sqrtVy;
                
        for(let i = 0; i < GRID_SIZE; i++) {
            for(let j = 0; j < GRID_SIZE; j++) {
                const u = -GRID_EXTENT + (i + 0.5) * du;
                const v = -GRID_EXTENT + (j + 0.5) * du;
                
                const x = tMx + (u * sqrtVx * cosAngle - v * sqrtVy * sinAngle);
                const y = tMy + (u * sqrtVx * sinAngle + v * sqrtVy * cosAngle);
                
                const q = gaussian2d(x, y, tMx, tMy, vx, vy, rho);
                
                if(q > 1e-10) {
                    const p = targetDist(x, y);
                    crossEntropySum += q * Math.log(p + 1e-10) * du * du * jacobian;
                    entropySum -= q * Math.log(q) * du * du * jacobian;
                }
            }
        }
    }

    return {
        crossEntropy: crossEntropySum,
        entropy: entropySum,
        elbo: crossEntropySum + entropySum
    };
}, [
    posteriorType, targetDist, gaussian2d,
    mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
    logVar1, logVar2, logVar3,
    meanX, meanY, logVarX, logVarY, logitCorr,
    transformMeanX, transformMeanY, transformVarX, transformVarY, transformCorr,
    transformVarForComponent
]);

useEffect(() => {
    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
        const elboComponents = calculateElboComponents(null, null, null, null, null);
        setElbo(elboComponents.elbo);
        setElboComponents(elboComponents);
    } else {
        const elboComponents = calculateElboComponents(
            displayMeanX, displayMeanY, 
            displayVarX, displayVarY, 
            displayCorr
        );
        setElbo(elboComponents.elbo);
        setElboComponents(elboComponents);
    }
}, [
    posteriorType,
    displayMeanX, displayMeanY, displayVarX, displayVarY, displayCorr,
    mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
    logVar1, logVar2, logVar3,
    calculateElboComponents
]);

    
  // Calculate gradient using finite differences in transformed space
  const calculateGradient = useCallback(() => {
    const h = 1e-3;
    
    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
        const baseParams = {
            mean1X, mean1Y, logVar1,
            mean2X, mean2Y, logVar2,
            mean3X, mean3Y, logVar3
        };
        const baseElbo = calculateElboComponents(baseParams).elbo;
        
        const gradients = {
            dMean1X: 0, dMean1Y: 0, dLogVar1: 0,
            dMean2X: 0, dMean2Y: 0, dLogVar2: 0,
            dMean3X: 0, dMean3Y: 0, dLogVar3: 0
        };
        
        // Component 1
        gradients.dMean1X = (calculateElboComponents({
            ...baseParams, mean1X: mean1X + h
        }).elbo - baseElbo) / h;
        
        gradients.dMean1Y = (calculateElboComponents({
            ...baseParams, mean1Y: mean1Y + h
        }).elbo - baseElbo) / h;
        
        gradients.dLogVar1 = (calculateElboComponents({
            ...baseParams, logVar1: logVar1 + h
        }).elbo - baseElbo) / h;
        
        // Component 2
        gradients.dMean2X = (calculateElboComponents({
            ...baseParams, mean2X: mean2X + h
        }).elbo - baseElbo) / h;
        
        gradients.dMean2Y = (calculateElboComponents({
            ...baseParams, mean2Y: mean2Y + h
        }).elbo - baseElbo) / h;
        
        gradients.dLogVar2 = (calculateElboComponents({
            ...baseParams, logVar2: logVar2 + h
        }).elbo - baseElbo) / h;
        
        // Component 3
        gradients.dMean3X = (calculateElboComponents({
            ...baseParams, mean3X: mean3X + h
        }).elbo - baseElbo) / h;
        
        gradients.dMean3Y = (calculateElboComponents({
            ...baseParams, mean3Y: mean3Y + h
        }).elbo - baseElbo) / h;
        
        gradients.dLogVar3 = (calculateElboComponents({
            ...baseParams, logVar3: logVar3 + h
        }).elbo - baseElbo) / h;
        
        return gradients;
    } else {
        const baseParams = {
            meanX, meanY,
            logVarX, logVarY,
            logitCorr
        };
        const baseElbo = calculateElboComponents(baseParams).elbo;
        
        const dMeanX = (calculateElboComponents({
            ...baseParams, meanX: meanX + h
        }).elbo - baseElbo) / h;
        
        const dMeanY = (calculateElboComponents({
            ...baseParams, meanY: meanY + h
        }).elbo - baseElbo) / h;
        
        let dLogVarX = 0, dLogVarY = 0, dLogitCorr = 0;
        
        if (posteriorType === POSTERIOR_TYPES.ISOTROPIC) {
            const dLogVar = (calculateElboComponents({
                ...baseParams, 
                logVarX: logVarX + h,
                logVarY: logVarX + h
            }).elbo - baseElbo) / h;
            dLogVarX = dLogVar;
            dLogVarY = dLogVar;
        } else {
            dLogVarX = (calculateElboComponents({
                ...baseParams, logVarX: logVarX + h
            }).elbo - baseElbo) / h;
            
            dLogVarY = (calculateElboComponents({
                ...baseParams, logVarY: logVarY + h
            }).elbo - baseElbo) / h;
            
            if (posteriorType === POSTERIOR_TYPES.FULL) {
                dLogitCorr = (calculateElboComponents({
                    ...baseParams, logitCorr: logitCorr + h
                }).elbo - baseElbo) / h;
            }
        }
        
        return { dMeanX, dMeanY, dLogVarX, dLogVarY, dLogitCorr };
    }
}, [
    posteriorType, meanX, meanY, logVarX, logVarY, logitCorr,
    mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
    logVar1, logVar2, logVar3,
    calculateElboComponents
]);

// Perform one step of gradient ascent
const performOptimizationStep = useCallback(() => {
    const gradient = calculateGradient();
      
    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
      setMean1X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
        prev + gradient.dMean1X * STEP_SIZE)));
      setMean1Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
        prev + gradient.dMean1Y * STEP_SIZE)));
      setLogVar1(prev => Math.max(BOUNDS.logVar[0], Math.min(BOUNDS.logVar[1], 
        prev + gradient.dLogVar1 * STEP_SIZE)));
        
      setMean2X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
        prev + gradient.dMean2X * STEP_SIZE)));
      setMean2Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
        prev + gradient.dMean2Y * STEP_SIZE)));
      setLogVar2(prev => Math.max(BOUNDS.logVar[0], Math.min(BOUNDS.logVar[1], 
        prev + gradient.dLogVar2 * STEP_SIZE)));
        
      setMean3X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
        prev + gradient.dMean3X * STEP_SIZE)));
      setMean3Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
        prev + gradient.dMean3Y * STEP_SIZE)));
      setLogVar3(prev => Math.max(BOUNDS.logVar[0], Math.min(BOUNDS.logVar[1], 
        prev + gradient.dLogVar3 * STEP_SIZE)));
    } else {
      setMeanX(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
        prev + gradient.dMeanX * STEP_SIZE)));
      setMeanY(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
        prev + gradient.dMeanY * STEP_SIZE)));
    
      if (posteriorType === POSTERIOR_TYPES.ISOTROPIC) {
        const newLogVar = Math.max(
          BOUNDS.logVarX[0],
          Math.min(BOUNDS.logVarX[1], logVarX + gradient.dLogVarX * STEP_SIZE)
        );
        setLogVarX(newLogVar);
        setLogVarY(newLogVar);
        setLogitCorr(0);
      } else {
        setLogVarX(prev => Math.max(BOUNDS.logVarX[0], Math.min(BOUNDS.logVarX[1], 
          prev + gradient.dLogVarX * STEP_SIZE)));
        setLogVarY(prev => Math.max(BOUNDS.logVarY[0], Math.min(BOUNDS.logVarY[1], 
          prev + gradient.dLogVarY * STEP_SIZE)));
        
        if (posteriorType === POSTERIOR_TYPES.FULL) {
          setLogitCorr(prev => Math.max(BOUNDS.logitCorr[0], Math.min(BOUNDS.logitCorr[1], 
            prev + gradient.dLogitCorr * STEP_SIZE)));
        } else {
          setLogitCorr(0);
        }
      }
    }
    
    setOptimizationStep(prev => prev + 1);
  }, [calculateGradient, posteriorType, BOUNDS.meanX, BOUNDS.meanY, BOUNDS.logVarX, BOUNDS.logVarY, BOUNDS.logitCorr, BOUNDS.logVar, STEP_SIZE, logVarX]);
  
  // Create separate effect for optimization loop
  useEffect(() => {
    let timeoutId;
    
    const runOptimizationStep = () => {
      if (isOptimizing && optimizationStep < OPTIMIZATION_STEPS) {
        performOptimizationStep();
        timeoutId = setTimeout(runOptimizationStep, 50);
      } else if (optimizationStep >= OPTIMIZATION_STEPS) {
        setIsOptimizing(false);
        setOptimizationStep(0);
      }
    };
  
    if (isOptimizing) {
      timeoutId = setTimeout(runOptimizationStep, 50);
    }
  
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOptimizing, optimizationStep]);

  // Generate ellipse path for given standard deviation
  const generateEllipsePath = useCallback((centerX, centerY, sdMultiplier = 1, variance = null) => {
    const numPoints = 50;
    const path = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      
      // For mixture components, use isotropic variance if provided
      if (variance !== null) {
        const transformedX = x * Math.sqrt(variance) * sdMultiplier;
        const transformedY = y * Math.sqrt(variance) * sdMultiplier;
        const px = centerX + transformedX;
        const py = centerY + transformedY;
        path.push(i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`);
      } else {
        // Original transformation for correlated Gaussian
        const transformedX = x * Math.sqrt(displayVarX) * sdMultiplier * Math.sqrt(1 - displayCorr * displayCorr) + 
                            y * displayCorr * Math.sqrt(displayVarX) * sdMultiplier;
        const transformedY = y * Math.sqrt(displayVarY) * sdMultiplier;
        const px = centerX + transformedX;
        const py = centerY + transformedY;
        path.push(i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`);
      }
    }
    
    return path.join(' ') + ' Z';
  }, [displayVarX, displayVarY, displayCorr]);

  // Handle drag events
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = Math.min(Math.max(0, e.clientX - rect.left), X_RANGE[1]);
    const mouseY = Math.min(Math.max(0, e.clientY - rect.top), Y_RANGE[1]);
  
    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
      if (!isDragging) {
        // Find all components whose 1SD ellipse contains the mouse point
        const candidateComponents = [];
        
        if (isWithinEllipse(mouseX, mouseY, mean1X, mean1Y, logVar1)) {
          candidateComponents.push({
            id: 1,
            distance: getDistanceToComponent(mouseX, mouseY, mean1X, mean1Y)
          });
        }
        if (isWithinEllipse(mouseX, mouseY, mean2X, mean2Y, logVar2)) {
          candidateComponents.push({
            id: 2,
            distance: getDistanceToComponent(mouseX, mouseY, mean2X, mean2Y)
          });
        }
        if (isWithinEllipse(mouseX, mouseY, mean3X, mean3Y, logVar3)) {
          candidateComponents.push({
            id: 3,
            distance: getDistanceToComponent(mouseX, mouseY, mean3X, mean3Y)
          });
        }
  
        // If we found any candidates, select the closest one
        if (candidateComponents.length > 0) {
          const closestComponent = candidateComponents.reduce(
            (min, current) => current.distance < min.distance ? current : min,
            candidateComponents[0]
          );
          setSelectedComponent(closestComponent.id);
        } else {
          setSelectedComponent(null);
        }
      }
  
      // Handle dragging
      if (e.buttons === 1 && selectedComponent !== null) {  // Left mouse button is pressed
        setIsDragging(true);
        
        // Transform from screen coordinates back to model coordinates
        const newX = 6 * (mouseX - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]) - 3;
        const newY = 6 * (mouseY - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]) - 3;
        
        // Update the selected component's position
        switch(selectedComponent) {
          case 1:
            setMean1X(Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], newX)));
            setMean1Y(Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], newY)));
            break;
          case 2:
            setMean2X(Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], newX)));
            setMean2Y(Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], newY)));
            break;
          case 3:
            setMean3X(Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], newX)));
            setMean3Y(Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], newY)));
            break;
        }
      }
    } else if (posteriorType !== POSTERIOR_TYPES.MIXTURE) {
      // Original single Gaussian case
      if (e.buttons === 1) {
        setMeanX(Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 6 * (mouseX - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]) - 3)));
        setMeanY(Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 6 * (mouseY - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]) - 3)));
      }
    }
  }, [
    posteriorType, selectedComponent, isDragging, 
    mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
    logVar1, logVar2, logVar3,
    BOUNDS.meanX, BOUNDS.meanY, X_RANGE, Y_RANGE,
    isWithinEllipse, getDistanceToComponent
  ]);

  // Add mouse up handler to reset dragging state
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle posterior type change
  const handlePosteriorTypeChange = (newType) => {
    setPosteriorType(newType);
    
    // Adjust parameters based on new type
    if (newType === POSTERIOR_TYPES.ISOTROPIC) {
      // For isotropic, set both variances to the average of current variances
      const avgLogVar = (logVarX + logVarY) / 2;
      setLogVarX(avgLogVar);
      setLogVarY(avgLogVar);
      setLogitCorr(0); // Set correlation to 0
    } else if (newType === POSTERIOR_TYPES.DIAGONAL) {
      // For diagonal, just set correlation to 0
      setLogitCorr(0);
    }
  };

  // Handle reset of posterior values
  const handleReset = () => {
    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
        setMean1X(INITIAL_VALUES.mean1X);
        setMean1Y(INITIAL_VALUES.mean1Y);
        setMean2X(INITIAL_VALUES.mean2X);
        setMean2Y(INITIAL_VALUES.mean2Y);
        setMean3X(INITIAL_VALUES.mean3X);
        setMean3Y(INITIAL_VALUES.mean3Y);
        setLogVar1(INITIAL_VALUES.logVar1);
        setLogVar2(INITIAL_VALUES.logVar2);
        setLogVar3(INITIAL_VALUES.logVar3);
        setSelectedComponent(null);
      } else {

        setMeanX(INITIAL_VALUES.meanX);
        setMeanY(INITIAL_VALUES.meanY);
        setLogVarX(INITIAL_VALUES.logVarX);
        
        if (posteriorType === POSTERIOR_TYPES.ISOTROPIC) {
        setLogVarY(INITIAL_VALUES.logVarX); // Use X variance for both in isotropic case
        setLogitCorr(0);
        } else if (posteriorType === POSTERIOR_TYPES.DIAGONAL) {
        setLogVarY(INITIAL_VALUES.logVarY);
        setLogitCorr(0);
        } else {
        setLogVarY(INITIAL_VALUES.logVarY);
        setLogitCorr(INITIAL_VALUES.logitCorr);
        }
    }
    
    setIsOptimizing(false);
    setOptimizationStep(0);
  };
  
  // Max density for normalization
  const maxDensity = useMemo(() => {
    return Math.max(...gradientData.map(p => p.density));
  }, [gradientData]);

  // Display ELBO
  const ElboDisplay = () => (
    <g>
        <text x="20" y="20" className="font-mono text-sm" fill="black">
            ELBO: {elboComponents.elbo.toFixed(3)}
        </text>
        <text x="20" y="40" className="font-mono text-sm" fill="#2563eb">
            Cross-entropy: {elboComponents.crossEntropy.toFixed(3)}
        </text>
        <text x="20" y="60" className="font-mono text-sm" fill="#dc2626">
            Entropy: {elboComponents.entropy.toFixed(3)}
        </text>
    </g>
);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Interactive Variational Inference</CardTitle>
      </CardHeader>
      <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-[auto,1fr] gap-4">
            {/* Left column: Interactive display panel */}
            <div>
                <div 
                    className="relative border rounded-lg bg-slate-50 cursor-move"
                    style={{ width: X_RANGE[1], height: Y_RANGE[1] }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}                    
                >
                    <svg 
                        width={X_RANGE[1]} 
                        height={Y_RANGE[1]} 
                        className="overflow-visible"
                    >
                        {/* Density gradient background */}
                        {gradientData.map((point, i) => (
                            <rect
                            key={i}
                            x={point.x - DX/2}
                            y={point.y - DY/2}
                            width={DX}
                            height={DY}
                            fill={`rgba(0,0,255,${point.density / maxDensity * 0.5})`}
                            />
                        ))}
                        
                    {/* Mixture components visualization */}
                    {posteriorType === POSTERIOR_TYPES.MIXTURE && (
                    <>
                        {/* Component 1 */}
                        <>
                        {/* 2 SD contour */}
                        <path
                            d={generateEllipsePath(
                            transformMeanX(mean1X),
                            transformMeanY(mean1Y),
                            2,
                            transformVarForComponent(logVar1)
                            )}
                            fill="none"
                            stroke={selectedComponent === 1 ? "rgba(255,0,0,0.5)" : "rgba(255,0,0,0.3)"}
                            strokeWidth="1"
                            strokeDasharray="5,5"
                            style={{ cursor: 'move' }}
                        />
                        {/* 1 SD filled */}
                        <path
                            d={generateEllipsePath(
                            transformMeanX(mean1X),
                            transformMeanY(mean1Y),
                            1,
                            transformVarForComponent(logVar1)
                            )}
                            fill="rgba(255,0,0,0.2)"
                            stroke={selectedComponent === 1 ? "red" : "rgba(255,0,0,0.5)"}
                            strokeWidth="2"
                            style={{ cursor: 'move' }}
                        />
                        <circle 
                            cx={transformMeanX(mean1X)}
                            cy={transformMeanY(mean1Y)}
                            r="4"
                            fill={selectedComponent === 1 ? "red" : "rgba(255,0,0,0.5)"}
                            style={{ cursor: 'move' }}
                        />
                        </>

                        {/* Component 2 */}
                        <>
                        {/* 2 SD contour */}
                        <path
                            d={generateEllipsePath(
                            transformMeanX(mean2X),
                            transformMeanY(mean2Y),
                            2,
                            transformVarForComponent(logVar2)
                            )}
                            fill="none"
                            stroke={selectedComponent === 2 ? "rgba(0,255,0,0.5)" : "rgba(0,255,0,0.3)"}
                            strokeWidth="1"
                            strokeDasharray="5,5"
                            style={{ cursor: 'move' }}
                        />
                        {/* 1 SD filled */}
                        <path
                            d={generateEllipsePath(
                            transformMeanX(mean2X),
                            transformMeanY(mean2Y),
                            1,
                            transformVarForComponent(logVar2)
                            )}
                            fill="rgba(0,255,0,0.2)"
                            stroke={selectedComponent === 2 ? "green" : "rgba(0,255,0,0.5)"}
                            strokeWidth="2"
                            style={{ cursor: 'move' }}
                        />
                        <circle 
                            cx={transformMeanX(mean2X)}
                            cy={transformMeanY(mean2Y)}
                            r="4"
                            fill={selectedComponent === 2 ? "green" : "rgba(0,255,0,0.5)"}
                            style={{ cursor: 'move' }}
                        />
                        </>

                        {/* Component 3 */}
                        <>
                        {/* 2 SD contour */}
                        <path
                            d={generateEllipsePath(
                            transformMeanX(mean3X),
                            transformMeanY(mean3Y),
                            2,
                            transformVarForComponent(logVar3)
                            )}
                            fill="none"
                            stroke={selectedComponent === 3 ? "rgba(255,165,0,0.5)" : "rgba(255,165,0,0.3)"}
                            strokeWidth="1"
                            strokeDasharray="5,5"
                            style={{ cursor: 'move' }}
                        />
                        {/* 1 SD filled */}
                        <path
                            d={generateEllipsePath(
                            transformMeanX(mean3X),
                            transformMeanY(mean3Y),
                            1,
                            transformVarForComponent(logVar3)
                            )}
                            fill="rgba(255,165,0,0.2)"
                            stroke={selectedComponent === 3 ? "orange" : "rgba(255,165,0,0.5)"}
                            strokeWidth="2"
                            style={{ cursor: 'move' }}
                        />
                        <circle 
                            cx={transformMeanX(mean3X)}
                            cy={transformMeanY(mean3Y)}
                            r="4"
                            fill={selectedComponent === 3 ? "orange" : "rgba(255,165,0,0.5)"}
                            style={{ cursor: 'move' }}
                        />
                        </>
                    </>
                    )}

                  {/* Regular Gaussian visualization for other types */}
                  {posteriorType !== POSTERIOR_TYPES.MIXTURE && (
                        <>
                        {/* Variational approximation - 2 SD contour */}
                        <path
                        d={generateEllipsePath(displayMeanX, displayMeanY, 2)}
                        fill="none"
                        stroke="rgba(255,0,0,0.3)"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        />
                        
                        {/* Variational approximation - 1 SD contour */}
                        <path
                            d={generateEllipsePath(displayMeanX, displayMeanY, 1)}
                            fill="rgba(255,0,0,0.2)"
                            stroke="red"
                            strokeWidth="2"
                        />
                        
                        {/* Mean of approximation */}
                        <circle 
                            cx={displayMeanX} 
                            cy={displayMeanY} 
                            r="4" 
                            fill="red"
                        />
                        </>
                    )}

                        {/* ELBO */}
                        <ElboDisplay />
                    </svg>
                </div>

                {/* Text spanning only the first column */}
                <div 
                    className="text-sm text-gray-600 mt-2"
                    style={{ maxWidth: `${X_RANGE[1]}px` }}
                >
                    {isOptimizing
                    ? `Optimization will run for ${OPTIMIZATION_STEPS} steps...\nStep ${optimizationStep}/${OPTIMIZATION_STEPS}`
                    : "Drag the red distribution and adjust its shape to find the best approximation of the target (blue density). Press Optimize to start gradient ascent from the current configuration."}
                </div>
            </div>

            {/* Right column: Controls */}
            <div className="space-y-6 p-4 border rounded-lg">
                {/* Select target distribution */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Distribution</label>
                    <select 
                        value={targetType}
                        onChange={(e) => {
                            setTargetType(e.target.value);
                            handleReset();
                        }}
                        className="w-full p-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        {Object.entries(TARGET_TYPES).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                </div>

                {/* Select variational posterior class */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Posterior Type</label>
                    <select 
                        value={posteriorType}
                        onChange={(e) => handlePosteriorTypeChange(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <option value={POSTERIOR_TYPES.ISOTROPIC}>{POSTERIOR_TYPES.ISOTROPIC}</option>
                        <option value={POSTERIOR_TYPES.DIAGONAL}>{POSTERIOR_TYPES.DIAGONAL}</option>
                        <option value={POSTERIOR_TYPES.FULL}>{POSTERIOR_TYPES.FULL}</option>
                        <option value={POSTERIOR_TYPES.MIXTURE}>{POSTERIOR_TYPES.MIXTURE}</option>
                    </select>
                </div>

                {/* Controls for regular Gaussian */}
                {posteriorType !== POSTERIOR_TYPES.MIXTURE && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">X Scale</label>
                            <Slider 
                                value={[Math.sqrt(displayVarX)]}
                                onValueChange={([v]) => {
                                    const newLogVar = Math.log(v * v);
                                    setLogVarX(newLogVar);
                                    if (posteriorType === POSTERIOR_TYPES.ISOTROPIC) {
                                        setLogVarY(newLogVar);
                                    }
                                }}
                                min={Math.sqrt(Math.exp(BOUNDS.logVarX[0]))}
                                max={Math.sqrt(Math.exp(BOUNDS.logVarX[1]))}
                                step={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Y Scale</label>
                            <Slider 
                                value={[Math.sqrt(displayVarY)]}
                                onValueChange={([v]) => {
                                    const newLogVar = Math.log(v * v);
                                    setLogVarY(newLogVar);
                                    if (posteriorType === POSTERIOR_TYPES.ISOTROPIC) {
                                        setLogVarX(newLogVar);
                                    }
                                }}
                                min={Math.sqrt(Math.exp(BOUNDS.logVarY[0]))}
                                max={Math.sqrt(Math.exp(BOUNDS.logVarY[1]))}
                                step={1}
                                disabled={posteriorType === POSTERIOR_TYPES.ISOTROPIC}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Correlation {posteriorType === POSTERIOR_TYPES.FULL ? `(${displayCorr.toFixed(2)})` : '(0.00)'}
                            </label>
                            <Slider 
                                value={[posteriorType === POSTERIOR_TYPES.FULL ? displayCorr : 0]}
                                onValueChange={([v]) => {
                                    if (posteriorType === POSTERIOR_TYPES.FULL) {
                                        setLogitCorr(Math.log((v + 1) / (1 - (v + 1) / 2)));
                                    }
                                }}
                                min={2 / (1 + Math.exp(-BOUNDS.logitCorr[0])) - 1}
                                max={2 / (1 + Math.exp(-BOUNDS.logitCorr[1])) - 1}
                                step={0.01}
                                disabled={posteriorType !== POSTERIOR_TYPES.FULL}
                            />
                        </div>
                    </div>
                )}

                {/* Controls for mixture components */}
                {posteriorType === POSTERIOR_TYPES.MIXTURE && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <label className="text-sm font-medium">Component 1 Scale</label>
                            </div>
                            <Slider 
                                value={[Math.sqrt(transformVarForComponent(logVar1))]}
                                onValueChange={([v]) => setLogVar1(Math.log(v * v))}
                                min={Math.sqrt(Math.exp(BOUNDS.logVar[0]))}
                                max={Math.sqrt(Math.exp(BOUNDS.logVar[1]))}
                                step={1}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <label className="text-sm font-medium">Component 2 Scale</label>
                            </div>
                            <Slider 
                                value={[Math.sqrt(transformVarForComponent(logVar2))]}
                                onValueChange={([v]) => setLogVar2(Math.log(v * v))}
                                min={Math.sqrt(Math.exp(BOUNDS.logVar[0]))}
                                max={Math.sqrt(Math.exp(BOUNDS.logVar[1]))}
                                step={1}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <label className="text-sm font-medium">Component 3 Scale</label>
                            </div>
                            <Slider 
                                value={[Math.sqrt(transformVarForComponent(logVar3))]}
                                onValueChange={([v]) => setLogVar3(Math.log(v * v))}
                                min={Math.sqrt(Math.exp(BOUNDS.logVar[0]))}
                                max={Math.sqrt(Math.exp(BOUNDS.logVar[1]))}
                                step={1}
                            />
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                    <Button
                        onClick={() => {
                            setIsOptimizing(true);
                            setOptimizationStep(0);
                        }}
                        className="flex items-center justify-center gap-2 w-full"
                        disabled={isOptimizing}
                    >
                        <Play className="w-4 h-4" />
                        {isOptimizing ? 'Optimizing...' : 'Optimize'}
                    </Button>
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="flex items-center justify-center gap-2 w-full"
                        disabled={isOptimizing}
                    >
                        Reset
                    </Button>            
                </div>
            </div>
        </div>
    </div>
    </CardContent>
    </Card>
  );
};

export default InteractiveVI;