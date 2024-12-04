import React from "react";
import InteractiveVI from './components/InteractiveVI';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main content */}
      <main className="flex-grow flex justify-center items-center p-4">
        <InteractiveVI />
      </main>

      {/* Footer section with links */}
      <footer className="w-full py-4 bg-slate-50 border-t">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div>
              <a 
                href="https://lacerbi.github.io/blog/2024/vi-is-inference-is-optimization/" 
                className="text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read more about Variational Inference
              </a>
            </div>
            <div>
              <span>Created by </span>
              <a 
                href="https://lacerbi.github.io/" 
                className="text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Luigi Acerbi
              </a>
              <span> with the help of </span>
              <a 
                href="https://www.anthropic.com/news/3-5-models-and-computer-use" 
                className="text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Claude 3.6 Sonnet
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;