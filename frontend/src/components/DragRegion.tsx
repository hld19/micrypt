export default function DragRegion() {
  return (
    <div
      data-wails-drag
      style={{
        // @ts-ignore
        '--wails-draggable': 'drag',
        WebkitAppRegion: 'drag',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        zIndex: 9999,
        cursor: 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      } as React.CSSProperties}
      className="bg-transparent pointer-events-auto"
    />
  );
}
