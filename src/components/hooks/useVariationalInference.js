// components/hooks/useVariationalInference.js
import { useState, useCallback, useEffect } from 'react';
import { 
  BOUNDS, 
  POSTERIOR_TYPES, 
  INITIAL_VALUES,
  X_RANGE,
  Y_RANGE,
  GRID_SIZE,
  DX,
  DY
} from '../constants';
import { createTargetDistribution, STEP_SIZES } from '../distributions/targetDistributions';
import { gaussian2d } from '../distributions/utils';

export function useVariationalInference(initialTargetType = 'BANANA') {
   
  // State for the variational parameters
  const [meanX, setMeanX] = useState(INITIAL_VALUES.meanX);
  const [meanY, setMeanY] = useState(INITIAL_VALUES.meanY);
  const [logVarX, setLogVarX] = useState(INITIAL_VALUES.logVarX);
  const [logVarY, setLogVarY] = useState(INITIAL_VALUES.logVarY);
  const [logitCorr, setLogitCorr] = useState(INITIAL_VALUES.logitCorr);
  
  // State for mixture components
  const [mean1X, setMean1X] = useState(INITIAL_VALUES.mean1X);
  const [mean1Y, setMean1Y] = useState(INITIAL_VALUES.mean1Y);
  const [mean2X, setMean2X] = useState(INITIAL_VALUES.mean2X);
  const [mean2Y, setMean2Y] = useState(INITIAL_VALUES.mean2Y);
  const [mean3X, setMean3X] = useState(INITIAL_VALUES.mean3X);
  const [mean3Y, setMean3Y] = useState(INITIAL_VALUES.mean3Y);
  const [logVar1, setLogVar1] = useState(INITIAL_VALUES.logVar1);
  const [logVar2, setLogVar2] = useState(INITIAL_VALUES.logVar2);
  const [logVar3, setLogVar3] = useState(INITIAL_VALUES.logVar3);
  
  // State for 10-mixture components
  const [mean1_10X, setMean1_10X] = useState(INITIAL_VALUES.mean1_10X);
  const [mean1_10Y, setMean1_10Y] = useState(INITIAL_VALUES.mean1_10Y);
  const [mean2_10X, setMean2_10X] = useState(INITIAL_VALUES.mean2_10X);
  const [mean2_10Y, setMean2_10Y] = useState(INITIAL_VALUES.mean2_10Y);
  const [mean3_10X, setMean3_10X] = useState(INITIAL_VALUES.mean3_10X);
  const [mean3_10Y, setMean3_10Y] = useState(INITIAL_VALUES.mean3_10Y);
  const [mean4_10X, setMean4_10X] = useState(INITIAL_VALUES.mean4_10X);
  const [mean4_10Y, setMean4_10Y] = useState(INITIAL_VALUES.mean4_10Y);
  const [mean5_10X, setMean5_10X] = useState(INITIAL_VALUES.mean5_10X);
  const [mean5_10Y, setMean5_10Y] = useState(INITIAL_VALUES.mean5_10Y);
  const [mean6_10X, setMean6_10X] = useState(INITIAL_VALUES.mean6_10X);
  const [mean6_10Y, setMean6_10Y] = useState(INITIAL_VALUES.mean6_10Y);
  const [mean7_10X, setMean7_10X] = useState(INITIAL_VALUES.mean7_10X);
  const [mean7_10Y, setMean7_10Y] = useState(INITIAL_VALUES.mean7_10Y);
  const [mean8_10X, setMean8_10X] = useState(INITIAL_VALUES.mean8_10X);
  const [mean8_10Y, setMean8_10Y] = useState(INITIAL_VALUES.mean8_10Y);
  const [mean9_10X, setMean9_10X] = useState(INITIAL_VALUES.mean9_10X);
  const [mean9_10Y, setMean9_10Y] = useState(INITIAL_VALUES.mean9_10Y);
  const [mean10_10X, setMean10_10X] = useState(INITIAL_VALUES.mean10_10X);
  const [mean10_10Y, setMean10_10Y] = useState(INITIAL_VALUES.mean10_10Y);
  const [logVar_10, setLogVar_10] = useState(INITIAL_VALUES.logVar_10);

  // UI and optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState(0);
  const [posteriorType, setPosteriorType] = useState(POSTERIOR_TYPES.FULL);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [gradientData, setGradientData] = useState([]);
  const [elboComponents, setElboComponents] = useState({
    crossEntropy: 0,
    entropy: 0,
    elbo: 0
  });
  const [targetType, setTargetType] = useState(initialTargetType);

  // Transform functions
  const transformMeanX = useCallback((x) => 
    X_RANGE[0] + (x + 3) * (X_RANGE[1] - X_RANGE[0]) / 6, []);
  
  const transformMeanY = useCallback((y) => 
    Y_RANGE[0] + (y + 3) * (Y_RANGE[1] - Y_RANGE[0]) / 6, []);
  
  const transformVarX = useCallback((logVar) => Math.exp(logVar), []);
  const transformVarY = useCallback((logVar) => Math.exp(logVar), []);
  const transformCorr = useCallback((logitCorr) => 
    (2 / (1 + Math.exp(-logitCorr)) - 1), []);
  
  const transformVarForComponent = useCallback((logVar) => Math.exp(logVar), []);

  // Get step size based on target type
  const STEP_SIZE = STEP_SIZES[targetType];

  // Get target distribution function
  const targetLogPdf = useCallback((x, y) => createTargetDistribution(targetType)(x, y), [targetType]);

  // Variational distribution
  const varDist = useCallback((x, y) => {
    if (posteriorType === POSTERIOR_TYPES.MIXTURE_10) {
      const components = [
        gaussian2d(x, y, transformMeanX(mean1_10X), transformMeanY(mean1_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean2_10X), transformMeanY(mean2_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean3_10X), transformMeanY(mean3_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean4_10X), transformMeanY(mean4_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean5_10X), transformMeanY(mean5_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean6_10X), transformMeanY(mean6_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean7_10X), transformMeanY(mean7_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean8_10X), transformMeanY(mean8_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean9_10X), transformMeanY(mean9_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0),
        gaussian2d(x, y, transformMeanX(mean10_10X), transformMeanY(mean10_10Y), 
          transformVarForComponent(logVar_10), transformVarForComponent(logVar_10), 0)
      ];
      return components.reduce((sum, c) => sum + c, 0) / 10;
    } else if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
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
      return gaussian2d(
        x, y, 
        transformMeanX(meanX), transformMeanY(meanY),
        transformVarX(logVarX), transformVarY(logVarY), 
        transformCorr(logitCorr)
      );
    }
  }, [
    posteriorType,
    transformMeanX, transformMeanY,
    transformVarX, transformVarY,
    transformCorr, transformVarForComponent,
    mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
    meanX, meanY,
    logVar1, logVar2, logVar3,
    logVarX, logVarY, logitCorr,
    mean1_10X, mean1_10Y, mean2_10X, mean2_10Y, mean3_10X, mean3_10Y,
    mean4_10X, mean4_10Y, mean5_10X, mean5_10Y, mean6_10X, mean6_10Y,
    mean7_10X, mean7_10Y, mean8_10X, mean8_10Y, mean9_10X, mean9_10Y,
    mean10_10X, mean10_10Y, logVar_10
  ]);

    // Calculate ELBO components for given parameters using q-aligned grid
    const calculateElboComponents = useCallback((params = null) => {
        let crossEntropySum = 0;
        let entropySum = 0;
        
        const GRID_SIZE = 50;
        const GRID_EXTENT = 3; 
        const du = (2 * GRID_EXTENT) / GRID_SIZE;

        if (posteriorType === POSTERIOR_TYPES.MIXTURE_10) {
          // Parameters for 10-component mixture case with shared variance
          const {
              mean1_10X: m1x = mean1_10X,
              mean1_10Y: m1y = mean1_10Y,
              mean2_10X: m2x = mean2_10X,
              mean2_10Y: m2y = mean2_10Y,
              mean3_10X: m3x = mean3_10X,
              mean3_10Y: m3y = mean3_10Y,
              mean4_10X: m4x = mean4_10X,
              mean4_10Y: m4y = mean4_10Y,
              mean5_10X: m5x = mean5_10X,
              mean5_10Y: m5y = mean5_10Y,
              mean6_10X: m6x = mean6_10X,
              mean6_10Y: m6y = mean6_10Y,
              mean7_10X: m7x = mean7_10X,
              mean7_10Y: m7y = mean7_10Y,
              mean8_10X: m8x = mean8_10X,
              mean8_10Y: m8y = mean8_10Y,
              mean9_10X: m9x = mean9_10X,
              mean9_10Y: m9y = mean9_10Y,
              mean10_10X: m10x = mean10_10X,
              mean10_10Y: m10y = mean10_10Y,
              logVar_10: lv = logVar_10
          } = params || {};
  
          const gaussianDensity = (x, y, mx, my, v) => {
              const dx = x - mx;
              const dy = y - my;
              return Math.exp(-(dx * dx + dy * dy) / (2 * v)) / (2 * Math.PI * v);
          };
  
          const WEIGHT = 1/10;
          
          const components = [
              { mx: transformMeanX(m1x), my: transformMeanY(m1y) },
              { mx: transformMeanX(m2x), my: transformMeanY(m2y) },
              { mx: transformMeanX(m3x), my: transformMeanY(m3y) },
              { mx: transformMeanX(m4x), my: transformMeanY(m4y) },
              { mx: transformMeanX(m5x), my: transformMeanY(m5y) },
              { mx: transformMeanX(m6x), my: transformMeanY(m6y) },
              { mx: transformMeanX(m7x), my: transformMeanY(m7y) },
              { mx: transformMeanX(m8x), my: transformMeanY(m8y) },
              { mx: transformMeanX(m9x), my: transformMeanY(m9y) },
              { mx: transformMeanX(m10x), my: transformMeanY(m10y) }
          ];
  
          const v = transformVarForComponent(lv);
          const sqrtV = Math.sqrt(v);
          
          components.forEach(comp => {
              for(let i = 0; i < GRID_SIZE; i++) {
                  for(let j = 0; j < GRID_SIZE; j++) {
                      const u = -GRID_EXTENT + (i + 0.5) * du;
                      const w = -GRID_EXTENT + (j + 0.5) * du;
                      
                      const x = comp.mx + u * sqrtV;
                      const y = comp.my + w * sqrtV;
                      
                      const qComp = gaussianDensity(x, y, comp.mx, comp.my, v);
                      
                      const q = WEIGHT * components.reduce((sum, c) => 
                          sum + gaussianDensity(x, y, c.mx, c.my, v), 0
                      );
                      
                      if(q > 1e-10) {
                          const logp = targetLogPdf(x, y);
                          const contribution = WEIGHT * qComp * du * du * v;
                          crossEntropySum += contribution * logp;
                          entropySum -= contribution * Math.log(q + 1e-10);
                      }
                  }
              }
          });
        } else if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
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
                            const logp = targetLogPdf(x, y);
                            const contribution = WEIGHT * qComp * du * du * comp.v;
                            crossEntropySum += contribution * logp;
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
                        const logp = targetLogPdf(x, y);
                        crossEntropySum += q * logp * du * du * jacobian;
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
        posteriorType, targetLogPdf,
        logVar1, logVar2, logVar3,
        logVarX, logVarY, logitCorr,
        mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
        meanX, meanY,
        mean1_10X, mean1_10Y, mean2_10X, mean2_10Y, mean3_10X, mean3_10Y,
        mean4_10X, mean4_10Y, mean5_10X, mean5_10Y, mean6_10X, mean6_10Y,
        mean7_10X, mean7_10Y, mean8_10X, mean8_10Y, mean9_10X, mean9_10Y,
        mean10_10X, mean10_10Y, logVar_10,
        transformCorr, transformMeanX, transformMeanY,
        transformVarForComponent, transformVarX, transformVarY
      ]);

  // Calculate gradient using finite differences in transformed space
  const calculateGradient = useCallback(() => {
    const h = 1e-3;
    
    if (posteriorType === POSTERIOR_TYPES.MIXTURE_10) {
      const baseParams = {
          mean1_10X, mean1_10Y,
          mean2_10X, mean2_10Y,
          mean3_10X, mean3_10Y,
          mean4_10X, mean4_10Y,
          mean5_10X, mean5_10Y,
          mean6_10X, mean6_10Y,
          mean7_10X, mean7_10Y,
          mean8_10X, mean8_10Y,
          mean9_10X, mean9_10Y,
          mean10_10X, mean10_10Y,
          logVar_10
      };
      const baseElbo = calculateElboComponents(baseParams).elbo;
      
      const gradients = {
          dMean1_10X: 0, dMean1_10Y: 0,
          dMean2_10X: 0, dMean2_10Y: 0,
          dMean3_10X: 0, dMean3_10Y: 0,
          dMean4_10X: 0, dMean4_10Y: 0,
          dMean5_10X: 0, dMean5_10Y: 0,
          dMean6_10X: 0, dMean6_10Y: 0,
          dMean7_10X: 0, dMean7_10Y: 0,
          dMean8_10X: 0, dMean8_10Y: 0,
          dMean9_10X: 0, dMean9_10Y: 0,
          dMean10_10X: 0, dMean10_10Y: 0,
          dLogVar_10: 0
      };
      
      // Component 1
      gradients.dMean1_10X = (calculateElboComponents({
          ...baseParams, mean1_10X: mean1_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean1_10Y = (calculateElboComponents({
          ...baseParams, mean1_10Y: mean1_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 2
      gradients.dMean2_10X = (calculateElboComponents({
          ...baseParams, mean2_10X: mean2_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean2_10Y = (calculateElboComponents({
          ...baseParams, mean2_10Y: mean2_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 3
      gradients.dMean3_10X = (calculateElboComponents({
          ...baseParams, mean3_10X: mean3_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean3_10Y = (calculateElboComponents({
          ...baseParams, mean3_10Y: mean3_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 4
      gradients.dMean4_10X = (calculateElboComponents({
          ...baseParams, mean4_10X: mean4_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean4_10Y = (calculateElboComponents({
          ...baseParams, mean4_10Y: mean4_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 5
      gradients.dMean5_10X = (calculateElboComponents({
          ...baseParams, mean5_10X: mean5_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean5_10Y = (calculateElboComponents({
          ...baseParams, mean5_10Y: mean5_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 6
      gradients.dMean6_10X = (calculateElboComponents({
          ...baseParams, mean6_10X: mean6_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean6_10Y = (calculateElboComponents({
          ...baseParams, mean6_10Y: mean6_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 7
      gradients.dMean7_10X = (calculateElboComponents({
          ...baseParams, mean7_10X: mean7_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean7_10Y = (calculateElboComponents({
          ...baseParams, mean7_10Y: mean7_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 8
      gradients.dMean8_10X = (calculateElboComponents({
          ...baseParams, mean8_10X: mean8_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean8_10Y = (calculateElboComponents({
          ...baseParams, mean8_10Y: mean8_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 9
      gradients.dMean9_10X = (calculateElboComponents({
          ...baseParams, mean9_10X: mean9_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean9_10Y = (calculateElboComponents({
          ...baseParams, mean9_10Y: mean9_10Y + h
      }).elbo - baseElbo) / h;
      
      // Component 10
      gradients.dMean10_10X = (calculateElboComponents({
          ...baseParams, mean10_10X: mean10_10X + h
      }).elbo - baseElbo) / h;
      
      gradients.dMean10_10Y = (calculateElboComponents({
          ...baseParams, mean10_10Y: mean10_10Y + h
      }).elbo - baseElbo) / h;
      
      // Shared variance
      gradients.dLogVar_10 = (calculateElboComponents({
          ...baseParams, logVar_10: logVar_10 + h
      }).elbo - baseElbo) / h;
      
      return gradients;
    } else if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
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
    calculateElboComponents,
    posteriorType,
    logVar1, logVar2, logVar3,
    logVarX, logVarY, logitCorr,
    mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
    meanX, meanY,
    mean1_10X, mean1_10Y, mean2_10X, mean2_10Y,
    mean3_10X, mean3_10Y, mean4_10X, mean4_10Y,
    mean5_10X, mean5_10Y, mean6_10X, mean6_10Y,
    mean7_10X, mean7_10Y, mean8_10X, mean8_10Y,
    mean9_10X, mean9_10Y, mean10_10X, mean10_10Y,
    logVar_10
  ]);

// Perform one step of gradient ascent
const performOptimizationStep = useCallback(() => {
    const gradient = calculateGradient();
      
    if (posteriorType === POSTERIOR_TYPES.MIXTURE_10) {      
      setMean1_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean1_10X * STEP_SIZE)));
      setMean1_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean1_10Y * STEP_SIZE)));
      
      setMean2_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean2_10X * STEP_SIZE)));
      setMean2_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean2_10Y * STEP_SIZE)));
      
      setMean3_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean3_10X * STEP_SIZE)));
      setMean3_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean3_10Y * STEP_SIZE)));
      
      setMean4_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean4_10X * STEP_SIZE)));
      setMean4_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean4_10Y * STEP_SIZE)));
      
      setMean5_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean5_10X * STEP_SIZE)));
      setMean5_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean5_10Y * STEP_SIZE)));
      
      setMean6_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean6_10X * STEP_SIZE)));
      setMean6_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean6_10Y * STEP_SIZE)));
      
      setMean7_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean7_10X * STEP_SIZE)));
      setMean7_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean7_10Y * STEP_SIZE)));
      
      setMean8_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean8_10X * STEP_SIZE)));
      setMean8_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean8_10Y * STEP_SIZE)));
      
      setMean9_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean9_10X * STEP_SIZE)));
      setMean9_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean9_10Y * STEP_SIZE)));
      
      setMean10_10X(prev => Math.max(BOUNDS.meanX[0], Math.min(BOUNDS.meanX[1], 
          prev + gradient.dMean10_10X * STEP_SIZE)));
      setMean10_10Y(prev => Math.max(BOUNDS.meanY[0], Math.min(BOUNDS.meanY[1], 
          prev + gradient.dMean10_10Y * STEP_SIZE)));
      
      setLogVar_10(prev => Math.max(BOUNDS.logVar[0], Math.min(BOUNDS.logVar[1], 
          prev + gradient.dLogVar_10 * STEP_SIZE)));

    } else if (posteriorType === POSTERIOR_TYPES.MIXTURE) {

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
  }, [calculateGradient, posteriorType, STEP_SIZE, logVarX]);

  // Effect for updating gradient data
  useEffect(() => {
    const data = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const x = X_RANGE[0] + (i + 0.5) * DX;
        const y = Y_RANGE[0] + (j + 0.5) * DY;
        const density = Math.exp(targetLogPdf(x, y));
        data.push({ x, y, density })
      }
    }
    setGradientData(data);
  }, [targetLogPdf, targetType]);

  // Effect for updating ELBO
  useEffect(() => {
    const components = calculateElboComponents();
    setElboComponents(components);
  }, [calculateElboComponents]);

  // Handle reset of posterior values
  const handleReset = useCallback(() => {
    if (posteriorType === POSTERIOR_TYPES.MIXTURE_10) {
      setMean1_10X(INITIAL_VALUES.mean1_10X);
      setMean1_10Y(INITIAL_VALUES.mean1_10Y);
      setMean2_10X(INITIAL_VALUES.mean2_10X);
      setMean2_10Y(INITIAL_VALUES.mean2_10Y);
      setMean3_10X(INITIAL_VALUES.mean3_10X);
      setMean3_10Y(INITIAL_VALUES.mean3_10Y);
      setMean4_10X(INITIAL_VALUES.mean4_10X);
      setMean4_10Y(INITIAL_VALUES.mean4_10Y);
      setMean5_10X(INITIAL_VALUES.mean5_10X);
      setMean5_10Y(INITIAL_VALUES.mean5_10Y);
      setMean6_10X(INITIAL_VALUES.mean6_10X);
      setMean6_10Y(INITIAL_VALUES.mean6_10Y);
      setMean7_10X(INITIAL_VALUES.mean7_10X);
      setMean7_10Y(INITIAL_VALUES.mean7_10Y);
      setMean8_10X(INITIAL_VALUES.mean8_10X);
      setMean8_10Y(INITIAL_VALUES.mean8_10Y);
      setMean9_10X(INITIAL_VALUES.mean9_10X);
      setMean9_10Y(INITIAL_VALUES.mean9_10Y);
      setMean10_10X(INITIAL_VALUES.mean10_10X);
      setMean10_10Y(INITIAL_VALUES.mean10_10Y);
      setLogVar_10(INITIAL_VALUES.logVar_10);
      setSelectedComponent(null);
    } else if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
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
  }, [posteriorType]);

  // Return all necessary values and functions
  return {
    // States
    meanX, setMeanX,
    meanY, setMeanY,
    logVarX, setLogVarX,
    logVarY, setLogVarY,
    logitCorr, setLogitCorr,
    mean1X, setMean1X,
    mean1Y, setMean1Y,
    mean2X, setMean2X,
    mean2Y, setMean2Y,
    mean3X, setMean3X,
    mean3Y, setMean3Y,
    logVar1, setLogVar1,
    logVar2, setLogVar2,
    logVar3, setLogVar3,
    mean1_10X, setMean1_10X,
    mean1_10Y, setMean1_10Y,
    mean2_10X, setMean2_10X,
    mean2_10Y, setMean2_10Y,
    mean3_10X, setMean3_10X,
    mean3_10Y, setMean3_10Y,
    mean4_10X, setMean4_10X,
    mean4_10Y, setMean4_10Y,
    mean5_10X, setMean5_10X,
    mean5_10Y, setMean5_10Y,
    mean6_10X, setMean6_10X,
    mean6_10Y, setMean6_10Y,
    mean7_10X, setMean7_10X,
    mean7_10Y, setMean7_10Y,
    mean8_10X, setMean8_10X,
    mean8_10Y, setMean8_10Y,
    mean9_10X, setMean9_10X,
    mean9_10Y, setMean9_10Y,
    mean10_10X, setMean10_10X,
    mean10_10Y, setMean10_10Y,
    logVar_10, setLogVar_10,
    isOptimizing, setIsOptimizing,
    optimizationStep, setOptimizationStep,
    posteriorType, setPosteriorType,
    selectedComponent, setSelectedComponent,
    isDragging, setIsDragging,
    gradientData, setGradientData,
    targetType, setTargetType,
    
    // Transform functions
    transformMeanX,
    transformMeanY,
    transformVarX,
    transformVarY,
    transformCorr,
    transformVarForComponent,

    // Computed values
    displayMeanX: transformMeanX(meanX),
    displayMeanY: transformMeanY(meanY),
    displayVarX: transformVarX(logVarX),
    displayVarY: transformVarY(logVarY),
    displayCorr: transformCorr(logitCorr),
    
    // Core functions
    gaussian2d,
    calculateElboComponents,
    performOptimizationStep,
    handleReset,
    
    // Values
    elboComponents
  };
}