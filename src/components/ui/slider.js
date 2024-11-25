// components/ui/slider.js

import React from 'react';
import * as RadixSlider from '@radix-ui/react-slider';

export const Slider = ({ value, onValueChange, min, max, step }) => (
  <RadixSlider.Root
    className="relative flex items-center w-full h-5"
    value={value}
    onValueChange={onValueChange}
    min={min}
    max={max}
    step={step}
  >
    <RadixSlider.Track className="relative flex-grow h-1 bg-gray-200 rounded">
      <RadixSlider.Range className="absolute h-full bg-blue-500 rounded" />
    </RadixSlider.Track>
    <RadixSlider.Thumb 
      className="block w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
    />
  </RadixSlider.Root>
);

export default Slider;