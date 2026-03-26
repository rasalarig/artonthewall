"use client";
import React, { useState, useCallback } from "react";

export interface DragHandleProps {
  draggable: true;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  "data-drag-index": number;
  style?: React.CSSProperties;
}

interface DraggableListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => React.ReactNode;
  className?: string;
  direction?: "horizontal" | "vertical";
}

export function DraggableList<T>({
  items,
  keyExtractor,
  onReorder,
  renderItem,
  className = "",
  direction = "vertical",
}: DraggableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, moved);
    onReorder(newItems);
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, items, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const getDragHandleProps = useCallback((index: number): DragHandleProps => ({
    draggable: true,
    onDragStart: handleDragStart(index),
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver(index),
    onDrop: handleDrop(index),
    "data-drag-index": index,
    style: {
      opacity: dragIndex === index ? 0.4 : 1,
      transition: "all 0.2s ease",
      ...(overIndex === index && dragIndex !== null && dragIndex !== index
        ? {
            borderTop: direction === "vertical" ? "2px solid #FFE600" : undefined,
            borderLeft: direction !== "vertical" ? "2px solid #FFE600" : undefined,
          }
        : {}),
    },
  }), [dragIndex, overIndex, handleDragStart, handleDragEnd, handleDragOver, handleDrop, direction]);

  return (
    <div className={className}>
      {items.map((item, index) => (
        <React.Fragment key={keyExtractor(item)}>
          {renderItem(item, index, getDragHandleProps(index))}
        </React.Fragment>
      ))}
    </div>
  );
}
