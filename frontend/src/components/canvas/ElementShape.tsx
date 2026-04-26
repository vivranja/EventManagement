'use client';
import { Group, Rect, Circle, Text, Ellipse } from 'react-konva';
import { CanvasElement } from '../../types';

interface Props {
  el: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<CanvasElement>) => void;
  onDragEndCommit?: () => void;
  snapEnabled: boolean;
  gridSize: number;
  stageRef?: React.RefObject<unknown>;
}

function snap(v: number, grid: number, enabled: boolean) {
  return enabled ? Math.round(v / grid) * grid : v;
}

export default function ElementShape({
  el,
  isSelected,
  onSelect,
  onChange,
  onDragEndCommit,
  snapEnabled,
  gridSize
}: Props) {

  const handleDragEnd = (e: any) => {
    onChange({
      x: snap(e.target.x(), gridSize, snapEnabled),
      y: snap(e.target.y(), gridSize, snapEnabled),
    });

    // commit history after drag ends
    onDragEndCommit?.();
  };

  const commonProps = {
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: !el.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onDragMove: (e: any) => {
      if (snapEnabled) {
        e.target.x(snap(e.target.x(), gridSize, snapEnabled));
        e.target.y(snap(e.target.y(), gridSize, snapEnabled));
      }
    },
  };

  const selStroke = isSelected ? '#6c63ff' : el.stroke;
  const selStrokeWidth = isSelected ? Math.max(el.strokeWidth, 2) : el.strokeWidth;

  const renderShape = () => {
    switch (el.type) {
      case 'round-table':
        return (
          <Group {...commonProps} offsetX={el.width / 2} offsetY={el.height / 2}>
            <Circle
              x={el.width / 2}
              y={el.height / 2}
              radius={el.width / 2}
              fill={el.fill}
              stroke={selStroke}
              strokeWidth={selStrokeWidth}
            />
            {Array.from({ length: el.seats || 8 }).map((_, i) => {
              const angle = (i / (el.seats || 8)) * 2 * Math.PI - Math.PI / 2;
              const r = el.width / 2 + 10;
              return (
                <Circle
                  key={i}
                  x={el.width / 2 + Math.cos(angle) * r}
                  y={el.height / 2 + Math.sin(angle) * r}
                  radius={6}
                  fill="#c8a97e"
                  stroke={selStroke}
                  strokeWidth={1}
                />
              );
            })}
            <Text
              text={el.label || ''}
              x={0}
              y={el.height / 2 - 7}
              width={el.width}
              align="center"
              fontSize={11}
              fill="#fff"
              fontStyle="bold"
            />
          </Group>
        );

      case 'rect-table':
        return (
          <Group {...commonProps}>
            <Rect
              width={el.width}
              height={el.height}
              fill={el.fill}
              stroke={selStroke}
              strokeWidth={selStrokeWidth}
              cornerRadius={4}
            />
            {Array.from({ length: Math.floor(el.width / 36) }).map((_, i) => (
              <Rect
                key={`t${i}`}
                x={10 + i * 36}
                y={-14}
                width={24}
                height={12}
                fill="#c8a97e"
                stroke={selStroke}
                strokeWidth={1}
                cornerRadius={3}
              />
            ))}
            {Array.from({ length: Math.floor(el.width / 36) }).map((_, i) => (
              <Rect
                key={`b${i}`}
                x={10 + i * 36}
                y={el.height + 2}
                width={24}
                height={12}
                fill="#c8a97e"
                stroke={selStroke}
                strokeWidth={1}
                cornerRadius={3}
              />
            ))}
            <Text
              text={el.label || ''}
              x={0}
              y={el.height / 2 - 7}
              width={el.width}
              align="center"
              fontSize={11}
              fill="#fff"
              fontStyle="bold"
            />
          </Group>
        );

      case 'chair':
        return (
          <Group {...commonProps}>
            <Rect
              width={el.width}
              height={el.height}
              fill={el.fill}
              stroke={selStroke}
              strokeWidth={selStrokeWidth}
              cornerRadius={4}
            />
            <Rect
              x={4}
              y={4}
              width={el.width - 8}
              height={(el.height - 8) * 0.55}
              fill="rgba(0,0,0,0.15)"
              cornerRadius={3}
            />
          </Group>
        );

      case 'stage':
        return (
          <Group {...commonProps}>
            <Rect
              width={el.width}
              height={el.height}
              fill={el.fill}
              stroke={selStroke}
              strokeWidth={selStrokeWidth}
              cornerRadius={4}
            />
            <Rect
              x={0}
              y={el.height - 8}
              width={el.width}
              height={8}
              fill="rgba(0,0,0,0.2)"
              cornerRadius={[0, 0, 4, 4]}
            />
            <Text
              text={el.label || 'STAGE'}
              x={0}
              y={el.height / 2 - 9}
              width={el.width}
              align="center"
              fontSize={el.fontSize || 14}
              fill="#fff"
              fontStyle="bold"
              letterSpacing={2}
            />
          </Group>
        );

      case 'wall':
        return (
          <Group {...commonProps}>
            <Rect
              width={el.width}
              height={el.height}
              fill={el.fill}
              stroke={selStroke}
              strokeWidth={selStrokeWidth}
            />
            <Rect
              width={el.width}
              height={el.height}
              fill="rgba(255,255,255,0.05)"
              strokeWidth={0}
            />
          </Group>
        );

      case 'text-label':
        return (
          <Group {...commonProps}>
            <Text
              text={el.label || 'Label'}
              x={0}
              y={0}
              fontSize={el.fontSize || 16}
              fill={el.fill}
              fontStyle="bold"
            />
          </Group>
        );

      default:
        return (
          <Group {...commonProps}>
            <Ellipse
              radiusX={el.width / 2}
              radiusY={el.height / 2}
              x={el.width / 2}
              y={el.height / 2}
              fill={el.fill}
              stroke={selStroke}
              strokeWidth={selStrokeWidth}
            />
          </Group>
        );
    }
  };

  return renderShape();
}