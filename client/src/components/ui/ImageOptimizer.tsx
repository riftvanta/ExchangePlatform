import React, { useState, useEffect } from 'react';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholderSrc?: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  // Additional accessibility props
  longDesc?: string; // URL to a long description
  role?: string; // For decorative images, use 'presentation'
  labelledBy?: string; // ID of element that labels this image
}

/**
 * ImageOptimizer component for efficient and accessible image loading
 * - Uses native lazy loading
 * - Shows a placeholder while loading
 * - Handles errors gracefully
 * - Supports responsive sizing
 * - Includes proper accessibility attributes
 */
export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width,
  height,
  placeholderSrc = '/placeholder-image.jpg',
  className = '',
  objectFit = 'cover',
  onLoad,
  onError,
  longDesc,
  role,
  labelledBy,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc);
  // State to track if image is still loading
  const [isLoading, setIsLoading] = useState(true);

  // Determine if image is decorative
  const isDecorative = role === 'presentation' || role === 'none' || alt === '';

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setError(false);
    setIsLoading(true);
    setImageSrc(placeholderSrc);

    // Create an image object to pre-load the image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setError(true);
      setIsLoading(false);
      if (onError) onError();
    };

    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholderSrc, onLoad, onError]);

  const imageStyles: React.CSSProperties = {
    objectFit,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    transition: 'opacity 0.3s ease, filter 0.3s ease',
    opacity: isLoaded ? 1 : 0.5,
    filter: isLoaded ? 'none' : 'blur(8px)',
  };

  // Create appropriate ARIA attributes
  const ariaProps = {
    // If decorative, use role="presentation" and empty alt
    role: isDecorative ? 'presentation' : role,
    alt: isDecorative ? '' : alt,
    // If there's a long description, link to it
    'aria-describedby': longDesc ? `desc-${src.replace(/\W/g, '')}` : undefined,
    // If there's a labelled by ID, use it
    'aria-labelledby': labelledBy,
    // Indicate loading state to screen readers
    'aria-busy': isLoading,
  };

  return (
    <div 
      className={`image-optimizer ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isLoading && (
        <div 
          className="sr-only" 
          aria-live="polite"
        >
          Image is loading
        </div>
      )}
      
      {error ? (
        <div 
          className="image-error" 
          role="alert"
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgb(var(--color-neutral-100))',
            color: 'rgb(var(--color-neutral-500))',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Image failed to load: {alt}
        </div>
      ) : (
        <img
          src={imageSrc}
          {...ariaProps}
          loading="lazy" 
          style={imageStyles}
          onLoad={() => {
            if (imageSrc === src) {
              setIsLoaded(true);
              setIsLoading(false);
              if (onLoad) onLoad();
            }
          }}
          onError={() => {
            if (imageSrc === src) {
              setError(true);
              setIsLoading(false);
              if (onError) onError();
            }
          }}
        />
      )}
      
      {/* Hidden long description if provided */}
      {longDesc && (
        <div className="sr-only" id={`desc-${src.replace(/\W/g, '')}`}>
          <a href={longDesc}>Long description of this image</a>
        </div>
      )}
    </div>
  );
};

export default ImageOptimizer; 