// distributions/utils.js

// Helper function for 2D Gaussian
export const gaussian2d = (x, y, mx, my, vx, vy, rho) => {
    const dx = x - mx;
    const dy = y - my;
    const correlation = (dx * dx) / vx + (dy * dy) / vy - 
                       2 * rho * dx * dy / Math.sqrt(vx * vy);
    return Math.exp(-correlation / (2 * (1 - rho * rho))) / 
           (2 * Math.PI * Math.sqrt(vx * vy * (1 - rho * rho)));
  };