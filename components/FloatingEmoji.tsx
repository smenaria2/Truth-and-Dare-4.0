

import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface FloatingEmojiProps {
  id: string;
  emoji: string;
  position: { x: number; y: number };
  startTime: number;
}

export const FloatingEmoji: React.FC<FloatingEmojiProps> = ({ emoji, position, startTime }) => {
  const [currentY, setCurrentY] = useState(position.y);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const animationDuration = 3000; // Total animation duration in ms
    const fadeStartTime = 1500; // When fading starts

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < animationDuration) {
        // Move upwards
        const progress = elapsed / animationDuration;
        const newY = position.y - (progress * 100); // Move 100px up

        // Fade out
        let newOpacity = 1;
        if (elapsed > fadeStartTime) {
          newOpacity = 1 - ((elapsed - fadeStartTime) / (animationDuration - fadeStartTime));
        }

        setCurrentY(newY);
        setOpacity(newOpacity);
        requestAnimationFrame(animate);
      } else {
        setOpacity(0); // Ensure it's completely gone
      }
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [startTime, position.y]);

  return (
    <div
      className={cn(
        "absolute text-4xl pointer-events-none z-40 transition-transform transition-opacity ease-out duration-100"
      )}
      style={{
        left: position.x,
        top: currentY,
        opacity: opacity,
        transform: 'translateX(-50%)', // Center the emoji horizontally
        willChange: 'transform, opacity',
      }}
      aria-hidden="true"
    >
      {emoji}
    </div>
  );
};