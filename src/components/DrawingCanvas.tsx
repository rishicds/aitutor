'use client'; // Required for event handlers and hooks

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onDrawingChange?: (dataUrl: string) => void; // Callback to pass drawing data
}

// Define the type for the handle exposed by useImperativeHandle
export interface DrawingCanvasHandle {
  clearCanvas: () => void;
}

// Use forwardRef to allow parent components to pass a ref
const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>((
  { width = 500, height = 300, onDrawingChange }, 
  ref // The forwarded ref
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Expose the clearCanvas function via the ref handle
  useImperativeHandle(ref, () => ({
    clearCanvas() {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;
  
      // Use the stored ratio for clearing correctly
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      context.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio); // Clear with white background
  
      // Trigger callback with cleared canvas data
      if (onDrawingChange) {
        const dataUrl = canvas.toDataURL('image/png');
        onDrawingChange(dataUrl);
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust for device pixel ratio for sharper drawing
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(ratio, ratio);
    context.lineCap = 'round';
    context.strokeStyle = 'black'; // Default drawing color
    context.lineWidth = 2; // Default line width
    contextRef.current = context;

    // Set background to white initially
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio); // Use ratio here too

  }, [width, height]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    if (!contextRef.current) return;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);

    // Trigger callback with canvas data URL when drawing finishes
    if (onDrawingChange && canvasRef.current) {
        // Export as PNG with white background
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onDrawingChange(dataUrl);
      }
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing} // Stop drawing if mouse leaves canvas
        style={{ border: '1px solid #ccc', touchAction: 'none' }} // Added border for visibility
      />
    </div>
  );
});

// Add display name for better debugging
DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas; 