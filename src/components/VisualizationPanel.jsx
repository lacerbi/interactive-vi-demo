// components/VisualizationPanel.jsx
import React, { useCallback } from 'react';
import { POSTERIOR_TYPES, X_RANGE, Y_RANGE, DX, DY } from './constants';
import { LOG_NORMALIZATION_CONSTANTS } from './distributions/targetDistributions';

export function VisualizationPanel({
  // Data and display values
  gradientData,
  displayMeanX,
  displayMeanY,
  displayVarX,
  displayVarY,
  displayCorr,
  elboComponents,
  
  // Mixture component states
  mean1X,
  mean1Y,
  mean2X,
  mean2Y,
  mean3X,
  mean3Y,
  logVar1,
  logVar2,
  logVar3,
  selectedComponent,
  
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
  logVar_10,
  setMean1_10X, setMean1_10Y,
  setMean2_10X, setMean2_10Y,
  setMean3_10X, setMean3_10Y,
  setMean4_10X, setMean4_10Y,
  setMean5_10X, setMean5_10Y,
  setMean6_10X, setMean6_10Y,
  setMean7_10X, setMean7_10Y,
  setMean8_10X, setMean8_10Y,
  setMean9_10X, setMean9_10Y,
  setMean10_10X, setMean10_10Y,

  // State setters
  setMeanX,
  setMeanY,
  setMean1X,
  setMean1Y,
  setMean2X,
  setMean2Y,
  setMean3X,
  setMean3Y,
  setSelectedComponent,
  setIsDragging,
  
  // Transform functions
  transformMeanX,
  transformMeanY,
  transformVarForComponent,
  
  // Type indicators
  posteriorType,
  targetType,
  
  // Bounds for parameters
  bounds
}) {
  // Get step size based on target type
  const LOG_Z = LOG_NORMALIZATION_CONSTANTS[targetType];

  // Helper function to generate ellipse path
  const generateEllipsePath = useCallback((centerX, centerY, sdMultiplier = 1, variance = null) => {
    const numPoints = 50;
    const path = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      
      if (variance !== null) {
        // For mixture components (isotropic)
        const transformedX = x * Math.sqrt(variance) * sdMultiplier;
        const transformedY = y * Math.sqrt(variance) * sdMultiplier;
        const px = centerX + transformedX;
        const py = centerY + transformedY;
        path.push(i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`);
      } else {
        // For single Gaussian (possibly correlated)
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

  // Helper function to check if point is within ellipse
  const isWithinEllipse = useCallback((mouseX, mouseY, meanX, meanY, logVar) => {
    if (posteriorType === POSTERIOR_TYPES.MIXTURE_10) {
      logVar = logVar_10; // Use shared variance for all components
    }
    const dx = mouseX - transformMeanX(meanX);
    const dy = mouseY - transformMeanY(meanY);
    const variance = Math.exp(logVar);
    return (dx * dx + dy * dy) <= variance;
  }, [transformMeanX, transformMeanY, posteriorType, logVar_10]);

  // Helper function to calculate distance to component
  const getDistanceToComponent = useCallback((mouseX, mouseY, meanX, meanY) => {
    const dx = mouseX - transformMeanX(meanX);
    const dy = mouseY - transformMeanY(meanY);
    return Math.sqrt(dx * dx + dy * dy);
  }, [transformMeanX, transformMeanY]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = Math.min(Math.max(0, e.clientX - rect.left), X_RANGE[1]);
    const mouseY = Math.min(Math.max(0, e.clientY - rect.top), Y_RANGE[1]);
  
    if (posteriorType === POSTERIOR_TYPES.MIXTURE_10) {
      if (e.buttons !== 1) {
        // Check all 10 components
        const candidateComponents = [];
        const componentParams = [
          { meanX: mean1_10X, meanY: mean1_10Y, id: 1 },
          { meanX: mean2_10X, meanY: mean2_10Y, id: 2 },
          { meanX: mean3_10X, meanY: mean3_10Y, id: 3 },
          { meanX: mean4_10X, meanY: mean4_10Y, id: 4 },
          { meanX: mean5_10X, meanY: mean5_10Y, id: 5 },
          { meanX: mean6_10X, meanY: mean6_10Y, id: 6 },
          { meanX: mean7_10X, meanY: mean7_10Y, id: 7 },
          { meanX: mean8_10X, meanY: mean8_10Y, id: 8 },
          { meanX: mean9_10X, meanY: mean9_10Y, id: 9 },
          { meanX: mean10_10X, meanY: mean10_10Y, id: 10 },
        ];

        componentParams.forEach(({meanX, meanY, id}) => {
          if (isWithinEllipse(mouseX, mouseY, meanX, meanY, logVar_10)) {
            candidateComponents.push({
              id,
              distance: getDistanceToComponent(mouseX, mouseY, meanX, meanY)
            });
          }
        });

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

      // Handle dragging for 10-component mixture
      if (e.buttons === 1 && selectedComponent !== null) {
        setIsDragging(true);
        const newX = 6 * (mouseX - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]) - 3;
        const newY = 6 * (mouseY - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]) - 3;
        const boundedX = Math.max(bounds.meanX[0], Math.min(bounds.meanX[1], newX));
        const boundedY = Math.max(bounds.meanY[0], Math.min(bounds.meanY[1], newY));

        // Update selected component position
        switch(selectedComponent) {
          case 1: setMean1_10X(boundedX); setMean1_10Y(boundedY); break;
          case 2: setMean2_10X(boundedX); setMean2_10Y(boundedY); break;
          case 3: setMean3_10X(boundedX); setMean3_10Y(boundedY); break;
          case 4: setMean4_10X(boundedX); setMean4_10Y(boundedY); break;
          case 5: setMean5_10X(boundedX); setMean5_10Y(boundedY); break;
          case 6: setMean6_10X(boundedX); setMean6_10Y(boundedY); break;
          case 7: setMean7_10X(boundedX); setMean7_10Y(boundedY); break;
          case 8: setMean8_10X(boundedX); setMean8_10Y(boundedY); break;
          case 9: setMean9_10X(boundedX); setMean9_10Y(boundedY); break;
          case 10: setMean10_10X(boundedX); setMean10_10Y(boundedY); break;
          default:
            // No component selected or invalid component number
            console.warn(`Invalid component selected: ${selectedComponent}`);
            break;
        }
      }
    } else if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
      if (e.buttons !== 1) {  // If not dragging
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
        const boundedX = Math.max(bounds.meanX[0], Math.min(bounds.meanX[1], newX));
        const boundedY = Math.max(bounds.meanY[0], Math.min(bounds.meanY[1], newY));
        
        switch(selectedComponent) {
          case 1:
            setMean1X(boundedX);
            setMean1Y(boundedY);
            break;
          case 2:
            setMean2X(boundedX);
            setMean2Y(boundedY);
            break;
          case 3:
            setMean3X(boundedX);
            setMean3Y(boundedY);
            break;
          default:
            // No component selected or invalid component number
            break;
        }
      }
    } else {
      // Single Gaussian case
      if (e.buttons === 1) {
        const newX = 6 * (mouseX - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]) - 3;
        const newY = 6 * (mouseY - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]) - 3;
        setMeanX(Math.max(bounds.meanX[0], Math.min(bounds.meanX[1], newX)));
        setMeanY(Math.max(bounds.meanY[0], Math.min(bounds.meanY[1], newY)));
      }
    }
  }, [
    posteriorType, selectedComponent,
    mean1X, mean1Y, mean2X, mean2Y, mean3X, mean3Y,
    logVar1, logVar2, logVar3,
    mean1_10X, mean1_10Y, mean2_10X, mean2_10Y,
    mean3_10X, mean3_10Y, mean4_10X, mean4_10Y,
    mean5_10X, mean5_10Y, mean6_10X, mean6_10Y,
    mean7_10X, mean7_10Y, mean8_10X, mean8_10Y,
    mean9_10X, mean9_10Y, mean10_10X, mean10_10Y,
    logVar_10,
    setMean1_10X, setMean1_10Y, setMean2_10X, setMean2_10Y,
    setMean3_10X, setMean3_10Y, setMean4_10X, setMean4_10Y,
    setMean5_10X, setMean5_10Y, setMean6_10X, setMean6_10Y,
    setMean7_10X, setMean7_10Y, setMean8_10X, setMean8_10Y,
    setMean9_10X, setMean9_10Y, setMean10_10X, setMean10_10Y,
    bounds, isWithinEllipse, getDistanceToComponent,
    setMean1X, setMean1Y, setMean2X, setMean2Y, setMean3X, setMean3Y,
    setMeanX, setMeanY, setSelectedComponent, setIsDragging
  ]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Calculate max density for normalization
  const maxDensity = Math.max(...gradientData.map(p => p.density));

  // Component for displaying ELBO values
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
      <text x="280" y="20" className="font-mono text-sm" fill="gray">
        log Z: {LOG_Z}
      </text>
    </g>
  );

  return (
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
        
        {/* Variational distribution visualization */}
        {posteriorType === POSTERIOR_TYPES.MIXTURE_10 ? (
          // 10-component mixture visualization
          <>
            {[
              { x: mean1_10X, y: mean1_10Y, id: 1 },
              { x: mean2_10X, y: mean2_10Y, id: 2 },
              { x: mean3_10X, y: mean3_10Y, id: 3 },
              { x: mean4_10X, y: mean4_10Y, id: 4 },
              { x: mean5_10X, y: mean5_10Y, id: 5 },
              { x: mean6_10X, y: mean6_10Y, id: 6 },
              { x: mean7_10X, y: mean7_10Y, id: 7 },
              { x: mean8_10X, y: mean8_10Y, id: 8 },
              { x: mean9_10X, y: mean9_10Y, id: 9 },
              { x: mean10_10X, y: mean10_10Y, id: 10 }
            ].map((comp) => (
              <React.Fragment key={comp.id}>
                <path
                  d={generateEllipsePath(
                    transformMeanX(comp.x),
                    transformMeanY(comp.y),
                    2,
                    transformVarForComponent(logVar_10)
                  )}
                  fill="none"
                  stroke={selectedComponent === comp.id ? "rgba(128,0,128,0.5)" : "rgba(128,0,128,0.3)"}
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <path
                  d={generateEllipsePath(
                    transformMeanX(comp.x),
                    transformMeanY(comp.y),
                    1,
                    transformVarForComponent(logVar_10)
                  )}
                  fill="rgba(128,0,128,0.2)"
                  stroke={selectedComponent === comp.id ? "purple" : "rgba(128,0,128,0.5)"}
                  strokeWidth="2"
                />
                <circle 
                  cx={transformMeanX(comp.x)}
                  cy={transformMeanY(comp.y)}
                  r="4"
                  fill={selectedComponent === comp.id ? "purple" : "rgba(128,0,128,0.5)"}
                />
              </React.Fragment>
            ))}
          </>
        ) : posteriorType === POSTERIOR_TYPES.MIXTURE ? (
          <>
            {/* Mixture Component 1 */}
            <>
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
              />
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
              />
              <circle 
                cx={transformMeanX(mean1X)}
                cy={transformMeanY(mean1Y)}
                r="4"
                fill={selectedComponent === 1 ? "red" : "rgba(255,0,0,0.5)"}
              />
            </>

            {/* Mixture Component 2 */}
            <>
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
              />
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
              />
              <circle 
                cx={transformMeanX(mean2X)}
                cy={transformMeanY(mean2Y)}
                r="4"
                fill={selectedComponent === 2 ? "green" : "rgba(0,255,0,0.5)"}
              />
            </>

            {/* Mixture Component 3 */}
            <>
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
              />
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
              />
              <circle 
                cx={transformMeanX(mean3X)}
                cy={transformMeanY(mean3Y)}
                r="4"
                fill={selectedComponent === 3 ? "orange" : "rgba(255,165,0,0.5)"}
              />
            </>
          </>
        ) : (
          <>
            {/* Single Gaussian visualization */}
            <path
              d={generateEllipsePath(displayMeanX, displayMeanY, 2)}
              fill="none"
              stroke="rgba(255,0,0,0.3)"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
            <path
              d={generateEllipsePath(displayMeanX, displayMeanY, 1)}
              fill="rgba(255,0,0,0.2)"
              stroke="red"
              strokeWidth="2"
            />
            <circle 
              cx={displayMeanX} 
              cy={displayMeanY} 
              r="4" 
              fill="red"
            />
          </>
        )}

        {/* ELBO display */}
        <ElboDisplay />
      </svg>
    </div>
  );
}