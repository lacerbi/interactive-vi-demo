// components/InteractiveVI.jsx
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { VisualizationPanel } from './VisualizationPanel';
import { ControlPanel } from './ControlPanel';
import { useVariationalInference } from './hooks/useVariationalInference';
import { OPTIMIZATION_STEPS, BOUNDS } from './constants';

const InteractiveVI = () => {
  const [currentTargetType, setCurrentTargetType] = useState('BANANA');
  
  const {
    logVarX, setLogVarX,
    logVarY, setLogVarY,
    setLogitCorr,
    setMeanX,
    setMeanY,
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
    setIsDragging,
    gradientData,
    
    // Transform functions
    transformMeanX,
    transformMeanY,
    transformVarForComponent,

    // Computed values
    displayMeanX,
    displayMeanY,
    displayVarX,
    displayVarY,
    displayCorr,
    
    // Core functions
    performOptimizationStep,
    handleReset,
    setTargetType,  // Make sure this is exported from the hook
    
    // Values
    elboComponents
  } = useVariationalInference(currentTargetType);  // Pass current target type

  // Handle target type change
  const handleTargetTypeChange = (newType) => {
    setCurrentTargetType(newType);
    setTargetType(newType);
    handleReset();
  };

  // Effect for optimization loop
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
  }, [isOptimizing, optimizationStep, performOptimizationStep, setIsOptimizing, setOptimizationStep]);

  // Description text based on optimization state
  const descriptionText = isOptimizing
    ? `Optimization will run for ${OPTIMIZATION_STEPS} steps...\nStep ${optimizationStep}/${OPTIMIZATION_STEPS}`
    : "Drag the distribution component(s) and adjust their shape to find the best approximation of the target (blue density). Press Optimize to start gradient ascent from the current configuration.";

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Interactive Variational Inference</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-[400px,1fr] gap-4">
            <div>
              <VisualizationPanel 
                gradientData={gradientData}
                displayMeanX={displayMeanX}
                displayMeanY={displayMeanY}
                displayVarX={displayVarX}
                displayVarY={displayVarY}
                displayCorr={displayCorr}
                elboComponents={elboComponents}
                setMeanX={setMeanX}
                setMeanY={setMeanY}
                mean1X={mean1X}
                mean1Y={mean1Y}
                mean2X={mean2X}
                mean2Y={mean2Y}
                mean3X={mean3X}
                mean3Y={mean3Y}
                logVar1={logVar1}
                logVar2={logVar2}
                logVar3={logVar3}
                selectedComponent={selectedComponent}
                setMean1X={setMean1X}
                setMean1Y={setMean1Y}
                setMean2X={setMean2X}
                setMean2Y={setMean2Y}
                setMean3X={setMean3X}
                setMean3Y={setMean3Y}
                mean1_10X={mean1_10X}
                mean1_10Y={mean1_10Y}
                mean2_10X={mean2_10X}
                mean2_10Y={mean2_10Y}
                mean3_10X={mean3_10X}
                mean3_10Y={mean3_10Y}
                mean4_10X={mean4_10X}
                mean4_10Y={mean4_10Y}
                mean5_10X={mean5_10X}
                mean5_10Y={mean5_10Y}
                mean6_10X={mean6_10X}
                mean6_10Y={mean6_10Y}
                mean7_10X={mean7_10X}
                mean7_10Y={mean7_10Y}
                mean8_10X={mean8_10X}
                mean8_10Y={mean8_10Y}
                mean9_10X={mean9_10X}
                mean9_10Y={mean9_10Y}
                mean10_10X={mean10_10X}
                mean10_10Y={mean10_10Y}
                logVar_10={logVar_10}
                setMean1_10X={setMean1_10X}
                setMean1_10Y={setMean1_10Y}
                setMean2_10X={setMean2_10X}
                setMean2_10Y={setMean2_10Y}
                setMean3_10X={setMean3_10X}
                setMean3_10Y={setMean3_10Y}
                setMean4_10X={setMean4_10X}
                setMean4_10Y={setMean4_10Y}
                setMean5_10X={setMean5_10X}
                setMean5_10Y={setMean5_10Y}
                setMean6_10X={setMean6_10X}
                setMean6_10Y={setMean6_10Y}
                setMean7_10X={setMean7_10X}
                setMean7_10Y={setMean7_10Y}
                setMean8_10X={setMean8_10X}
                setMean8_10Y={setMean8_10Y}
                setMean9_10X={setMean9_10X}
                setMean9_10Y={setMean9_10Y}
                setMean10_10X={setMean10_10X}
                setMean10_10Y={setMean10_10Y}
                setSelectedComponent={setSelectedComponent}
                setIsDragging={setIsDragging}
                transformMeanX={transformMeanX}
                transformMeanY={transformMeanY}
                transformVarForComponent={transformVarForComponent}
                posteriorType={posteriorType}
                targetType={currentTargetType}
                bounds={BOUNDS}
              />

              <div className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                {descriptionText}
              </div>
            </div>

            <ControlPanel 
              targetType={currentTargetType}
              setTargetType={handleTargetTypeChange}
              posteriorType={posteriorType}
              setPosteriorType={setPosteriorType}
              displayVarX={displayVarX}
              displayVarY={displayVarY}
              displayCorr={displayCorr}
              logVarX={logVarX}
              logVarY={logVarY}
              setLogVarX={setLogVarX}
              setLogVarY={setLogVarY}
              setLogitCorr={setLogitCorr}
              logVar1={logVar1}
              logVar2={logVar2}
              logVar3={logVar3}
              setLogVar1={setLogVar1}
              setLogVar2={setLogVar2}
              setLogVar3={setLogVar3}
              logVar_10={logVar_10}
              setLogVar_10={setLogVar_10}
              isOptimizing={isOptimizing}
              setIsOptimizing={setIsOptimizing}
              setOptimizationStep={setOptimizationStep}
              handleReset={handleReset}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveVI;