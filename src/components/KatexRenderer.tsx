'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface KatexRendererProps {
  content: string;
  className?: string;
}

const KatexRenderer: React.FC<KatexRendererProps> = ({ content, className }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Basic attempt to render math delimited by $...$ or $$...$$
    // This is a simplified approach; more robust parsing might be needed for complex cases.
    try {
      // Replace display math first ($$...$$)
      let html = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathContent) => {
        try {
          return katex.renderToString(mathContent, { displayMode: true, throwOnError: false });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("KaTeX display render error:", message);
          return `<span style="color: red;">[KaTeX Error: ${match}]</span>`;
        } 
      });

      // Replace inline math second ($...$)
      html = html.replace(/\$([^$]+?)\$/g, (match, mathContent) => {
        // Avoid rendering if it looks like a currency amount (e.g., $5.00)
        if (/^\d+(\.\d+)?$/.test(mathContent)) {
            return match; // Return original match if it's just a number
        }
        try {
          return katex.renderToString(mathContent, { displayMode: false, throwOnError: false });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("KaTeX inline render error:", message);
          return `<span style="color: red;">[KaTeX Error: ${match}]</span>`;
        }
      });
      
      return html;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error rendering KaTeX:", message);
      return `<span style="color: red;">Error rendering content: ${content}</span>`; // Fallback for safety
    }
  }, [content]);

  // Use dangerouslySetInnerHTML to render the KaTeX output
  // Ensure the input `content` is trusted (e.g., from your own API)
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderedHtml }} />;
};

export default KatexRenderer;