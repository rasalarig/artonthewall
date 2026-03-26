"use client";
import React, { useRef, useState, useCallback } from "react";

export interface DragHandleProps {
  draggable: true;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  "data-drag-index": number;
}

interface DraggableListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => React.ReactNode;
  className?: string;
}

export function DraggableList<T>({
  items,
  keyExtractor,
  onReorder,
  renderItem,
  className = "",
}: DraggableListProps<T>) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragVisual, setDragVisual] = useState<number | null>(null);
  const [overVisual, setOverVisual] = useState<number | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const makeDragProps = useCallback((index: number): DragHandleProps => ({
    draggable: true,
    "data-drag-index": index,
    onDragStart: (e: React.DragEvent) => {
      dragIndexRef.current = index;
      setDragVisual(index);
      e.dataTransfer.effectAllowed = "move";
      // Set drag image to the element itself
      const el = e.currentTarget as HTMLElement;
      e.dataTransfer.setDragImage(el, el.offsetWidth / 2, 20);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      setOverVisual(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const fromIndex = dragIndexRef.current;
      if (fromIndex === null || fromIndex === index) {
        dragIndexRef.current = null;
        setDragVisual(null);
        setOverVisual(null);
        return;
      }
      const currentItems = [...itemsRef.current];
      const [moved] = currentItems.splice(fromIndex, 1);
      currentItems.splice(index, 0, moved);
      onReorderRef.current(currentItems);
      dragIndexRef.current = null;
      setDragVisual(null);
      setOverVisual(null);
    },
    onDragEnd: () => {
      dragIndexRef.current = null;
      setDragVisual(null);
      setOverVisual(null);
    },
  }), []);

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isDragging = dragVisual === index;
        const isOver = overVisual === index && dragVisual !== null && dragVisual !== index;
        return (
          <div
            key={keyExtractor(item)}
            style={{
              opacity: isDragging ? 0.4 : 1,
              transition: "all 0.15s ease",
              outline: isOver ? "2px solid #FFE600" : "none",
              outlineOffset: "-2px",
              borderRadius: "inherit",
            }}
          >
            {renderItem(item, index, makeDragProps(index))}
          </div>
        );
      })}
    </div>
  );
}
