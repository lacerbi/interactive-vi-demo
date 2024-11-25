// components/VisualizationPanel.jsx
import React, { useCallback } from 'react';
import { POSTERIOR_TYPES, X_RANGE, Y_RANGE, DX, DY } from './constants';

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
  
  // Bounds for parameters
  bounds
}) {
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
    const dx = mouseX - transformMeanX(meanX);
    const dy = mouseY - transformMeanY(meanY);
    const variance = Math.exp(logVar);
    return (dx * dx + dy * dy) <= variance;
  }, [transformMeanX, transformMeanY]);

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
  
    if (posteriorType === POSTERIOR_TYPES.MIXTURE) {
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
        {posteriorType === POSTERIOR_TYPES.MIXTURE ? (
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