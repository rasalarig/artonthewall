"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";

interface ImagePositionModalProps {
  imageUrl: string;
  initialPosition: { x: number; y: number };
  onSave: (position: { x: number; y: number }) => void;
  onClose: () => void;
}

export function ImagePositionModal({ imageUrl, initialPosition, onSave, onClose }: ImagePositionModalProps) {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [posStart, setPosStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPosStart({ ...position });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const sensitivity = 0.25;
    const newX = Math.max(0, Math.min(100, posStart.x - dx * sensitivity));
    const newY = Math.max(0, Math.min(100, posStart.y - dy * sensitivity));
    setPosition({ x: Math.round(newX), y: Math.round(newY) });
  }, [dragging, dragStart, posStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setPosStart({ ...position });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;
      const sensitivity = 0.25;
      const newX = Math.max(0, Math.min(100, posStart.x - dx * sensitivity));
      const newY = Math.max(0, Math.min(100, posStart.y - dy * sensitivity));
      setPosition({ x: Math.round(newX), y: Math.round(newY) });
    };
    const handleTouchEnd = () => setDragging(false);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging, dragStart, posStart]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground mb-2">Ajustar posicao da imagem</h3>
        <p className="text-sm text-muted mb-4">Arraste para escolher a area visivel nos cards</p>

        {/* Preview area - simulates card thumbnail */}
        <div className="mb-4">
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">Preview do card</p>
          <div
            ref={containerRef}
            className="relative w-full h-48 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent/50"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{ objectPosition: `${position.x}% ${position.y}%` }}
              draggable={false}
            />
            {/* Center crosshair */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
            </div>
          </div>
        </div>

        {/* Position readout */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted">
          <span>X: {position.x}%</span>
          <span>Y: {position.y}%</span>
          <button
            type="button"
            onClick={() => setPosition({ x: 50, y: 50 })}
            className="ml-auto text-xs text-accent hover:underline"
          >
            Centralizar
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={() => onSave(position)} className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-bold hover:bg-accent/80 transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
