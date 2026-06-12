import type { Map as LeafletMap } from "leaflet";

type PanFallbackOptions = {
  onDrag?: () => void;
};

export function attachMapPanFallback(
  map: LeafletMap,
  options: PanFallbackOptions = {},
) {
  const container = map.getContainer();
  let activePointerId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let moved = false;

  const isControlTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest(".leaflet-control"));

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || isControlTarget(event.target)) return;

    activePointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    moved = false;
    container.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) < 1) return;

    moved = true;
    options.onDrag?.();
    map.panBy([-dx, -dy], { animate: false });
    lastX = event.clientX;
    lastY = event.clientY;
    event.preventDefault();
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    if (moved) {
      options.onDrag?.();
    }
    container.releasePointerCapture?.(event.pointerId);
    activePointerId = null;
    moved = false;
  };

  container.addEventListener("pointerdown", handlePointerDown);
  container.addEventListener("pointermove", handlePointerMove);
  container.addEventListener("pointerup", handlePointerUp);
  container.addEventListener("pointercancel", handlePointerUp);

  return () => {
    container.removeEventListener("pointerdown", handlePointerDown);
    container.removeEventListener("pointermove", handlePointerMove);
    container.removeEventListener("pointerup", handlePointerUp);
    container.removeEventListener("pointercancel", handlePointerUp);
  };
}
