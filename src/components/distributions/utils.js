// distributions/utils.js

// Helper function for 2D Gaussian PDF
export const gaussian2d = (x, y, mx, my, vx, vy, rho) => {
    return Math.exp(logGaussian2d(x, y, mx, my, vx, vy, rho));
};
  
// Helper function for 2D Gaussian log PDF
export const logGaussian2d = (x, y, mx, my, vx, vy, rho) => {
    const dx = x - mx;
    const dy = y - my;
    const correlation = (dx * dx) / vx + (dy * dy) / vy - 
                       2 * rho * dx * dy / Math.sqrt(vx * vy);
    return -(correlation / (2 * (1 - rho * rho))) - 
           Math.log(2 * Math.PI * Math.sqrt(vx * vy * (1 - rho * rho)));
};
  
// Helper function for computing log sum of exponents
export const logsumexp = (logValues) => {
    const maxLog = Math.max(...logValues);
    return maxLog + Math.log(
      logValues.map(v => Math.exp(v - maxLog)).reduce((a, b) => a + b, 0)
    );
};