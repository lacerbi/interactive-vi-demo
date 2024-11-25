// components/ControlPanel.jsx

import React from 'react';
import { Play } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { POSTERIOR_TYPES, TARGET_TYPES, BOUNDS } from './constants';

export function ControlPanel({
  // Distribution type states
  targetType,
  setTargetType,
  posteriorType,
  setPosteriorType,
  
  // Variance and correlation values
  displayVarX,
  displayVarY,
  displayCorr,
  logVarX,  // Added
  logVarY,  // Added
  
  // Parameter setters
  setLogVarX,
  setLogVarY,
  setLogitCorr,
  
  // Mixture component states and setters
  logVar1,  // Added
  logVar2,  // Added
  logVar3,  // Added
  setLogVar1,
  setLogVar2,
  setLogVar3,
  
  // Optimization state and controls
  isOptimizing,
  setIsOptimizing,
  setOptimizationStep,
  
  // Reset handler
  handleReset,
}) {
  // Handle posterior type change
  const handlePosteriorTypeChange = (newType) => {
    setPosteriorType(newType);
    
    // Adjust parameters based on new type
    if (newType === POSTERIOR_TYPES.ISOTROPIC) {
      // For isotropic, set both variances to the average of current variances
      const avgLogVar = Math.log((Math.exp(logVarX) + Math.exp(logVarY)) / 2);
      setLogVarX(avgLogVar);
      setLogVarY(avgLogVar);
      setLogitCorr(0); // Set correlation to 0
    } else if (newType === POSTERIOR_TYPES.DIAGONAL) {
      // For diagonal, just set correlation to 0
      setLogitCorr(0);
    }
  };

  return (
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
          {Object.entries(POSTERIOR_TYPES).map(([key, value]) => (
            <option key={key} value={value}>{value}</option>
          ))}
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
              value={[Math.sqrt(Math.exp(logVar1))]}
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
              value={[Math.sqrt(Math.exp(logVar2))]}
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
              value={[Math.sqrt(Math.exp(logVar3))]}
              onValueChange={([v]) => setLogVar3(Math.log(v * v))}
              min={Math.sqrt(Math.exp(BOUNDS.logVar[0]))}
              max={Math.sqrt(Math.exp(BOUNDS.logVar[1]))}
              step={1}
            />
          </div>
        </div>
      )}

      {/* Control buttons */}
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
  );
}