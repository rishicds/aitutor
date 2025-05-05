'use client';

import React, { useState } from 'react';
import DrawingCanvas, { DrawingCanvasHandle } from '@/components/DrawingCanvas';
import KatexRenderer from '@/components/KatexRenderer';

// Define the structure for the solution object
interface StructuredSolution {
    type?: string;
    problem?: string;
    steps?: string[];
    solution?: string;
}

// Simple Spinner Component (can be moved to a separate file later)
const Spinner = () => (
    <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SmartCanvasPage = () => {
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | StructuredSolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = React.useRef<DrawingCanvasHandle>(null);

  const handleDrawingChange = (dataUrl: string) => {
    setDrawingDataUrl(dataUrl);
    setRecognizedText(null);
    setSolution(null);
    setError(null);
  };

  const handleClear = () => {
    // Call the clearCanvas method exposed by the DrawingCanvas component
    canvasRef.current?.clearCanvas(); 
  };

  const handleSolve = async () => {
    if (!drawingDataUrl) {
      setError('Please draw something first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecognizedText(null);
    setSolution(null);

    try {
      const response = await fetch('/api/solve-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: drawingDataUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process the drawing.');
      }

      const result = await response.json();
      // Basic validation of the result structure
      if (result && result.recognizedText && result.solution) {
          setRecognizedText(result.recognizedText);
          setSolution(result.solution);
      } else {
          throw new Error("Received incomplete data from the server.");
      }

    } catch (err) {
      console.error("Error solving drawing:", err);
      setError((err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Remove max-w-4xl from the top level, apply flex container for layout
    <div className="flex flex-col h-[calc(100vh-var(--header-height,64px))]"> {/* Adjust height based on header */} 
      {/* Top Section: Title/Instructions */}
      <div className="text-center p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Smart Canvas</h1>
        <p className="text-md text-gray-600 mt-1">{"Draw your problem below and click \"Solve It!\"."}</p>
      </div>

      {/* Main Area: Canvas and Results side-by-side on large screens */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden"> {/* Flex container for columns */} 
        
        {/* Left Column: Canvas + Buttons */}
        <div className="w-full lg:w-1/2 flex flex-col p-4 lg:border-r border-gray-200"> 
          {/* Canvas Wrapper */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex-shrink-0"> {/* Prevent shrinking */} 
            <DrawingCanvas
              ref={canvasRef}
              width={550} // Adjust width slightly maybe for padding
              height={350}
              onDrawingChange={handleDrawingChange}
            />
          </div>
          {/* Buttons below canvas */}
          <div className="flex justify-between items-center mt-4 flex-shrink-0"> 
              <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-150 text-sm font-medium"
              >
                  Clear
              </button>
              <button
                onClick={handleSolve}
                disabled={isLoading || !drawingDataUrl}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-base font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? 'Solving...' : 'Solve It!'}
              </button>
          </div>
        </div>

        {/* Right Column: Results Area */}
        <div className="w-full lg:w-1/2 flex flex-col p-4 overflow-y-auto"> {/* Allow vertical scrolling for results */} 
          <h2 className="text-xl font-semibold mb-3 text-gray-700 flex-shrink-0">Result</h2>
          <div className="flex-1 space-y-4"> {/* Use remaining space */} 
            {/* Loading State */}
            {isLoading && (
              <div className="w-full text-center p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm h-full flex flex-col justify-center items-center"> {/* Center spinner */} 
                <Spinner />
                <p className="text-lg text-gray-600 mt-2">Processing your drawing...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="w-full p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-sm">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {/* Initial/Empty State */}
             {!isLoading && !error && !recognizedText && !solution && (
                <div className="w-full text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 h-full flex flex-col justify-center items-center"> 
                    <p className="text-gray-500">The recognized text and solution will appear here once you solve a drawing.</p>
                </div>
             )}

            {/* Success State - Display Results */}
            {!isLoading && !error && (recognizedText || solution) && (
              <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm space-y-4"> {/* Reduced padding slightly */} 
                {recognizedText && (
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-gray-700">Recognized Input:</h3> {/* Use h3 */} 
                    <div className="bg-white p-3 rounded border border-gray-300 text-gray-800 whitespace-pre-wrap text-sm">
                      <KatexRenderer content={recognizedText} />
                    </div>
                  </div>
                )}
                {solution && (
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-gray-700">Solution:</h3> {/* Use h3 */} 
                    {typeof solution === 'string' ? (
                      <div className="bg-white p-3 rounded border border-gray-300 text-gray-800 whitespace-pre-wrap text-sm">
                        <KatexRenderer content={solution} />
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded border border-gray-300 text-gray-800 space-y-3 text-left text-sm"> {/* Reduced padding */} 
                        {solution.problem && (
                          <div>
                            <strong>Problem:</strong>
                            <p className="mt-1 text-gray-700">
                              <KatexRenderer content={solution.problem} />
                            </p>
                          </div>
                        )}
                        {solution.steps && Array.isArray(solution.steps) && solution.steps.length > 0 && (
                          <div className="pt-3 border-t border-gray-200 mt-3">
                            <strong>Steps:</strong>
                            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1 text-gray-700">
                              {solution.steps.map((step: string, index: number) => (
                                <li key={index}>
                                  <KatexRenderer content={step} />
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {solution.solution && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <strong>Final Answer:</strong>
                            <p className="mt-1 font-semibold text-gray-900">
                              <KatexRenderer content={solution.solution} />
                            </p>
                          </div>
                        )}
                        {solution.type && <p className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500"><small>Type: <KatexRenderer content={solution.type} /></small></p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCanvasPage; 