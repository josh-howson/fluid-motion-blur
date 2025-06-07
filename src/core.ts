import '../src/style.css';

export interface FluidMotionCoreOptions {
  ghostCount?: number;
  blurMultiplier?: number;
  stretchMultiplier?: number;
  threshold?: number;
}

export function initFluidMotion(
  target: HTMLElement,
  options: FluidMotionCoreOptions = {}
) {
  const {
    ghostCount = 2,
    blurMultiplier = 10,
    stretchMultiplier = 2,
    threshold = 0,
  } = options;

  let ghosts: HTMLElement[] = [];
  let animationId: number | null = null;
  let lastPosition = { x: 0, y: 0 };
  let isAnimating = false;
  let elementSize = { width: 0, height: 0 };
  let startPosition = { x: 0, y: 0 };
  let endPosition = { x: 0, y: 0 };
  let totalDistance = 0;

  function getTransformPos(el: HTMLElement): { x: number; y: number } {
    const style = getComputedStyle(el);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return { x: matrix.e, y: matrix.f };
  }

  function createGhosts() {
    const rect = target.getBoundingClientRect();
    elementSize = { width: rect.width, height: rect.height };
    ghosts = Array.from({ length: ghostCount }).map(() => {
      const ghost = target.cloneNode(true) as HTMLElement;
      ghost.removeAttribute('id');
      ghost.inert = true;
      target.parentElement?.insertBefore(ghost, target.nextSibling);
      return ghost;
    });
  }

  function cleanup() {
    ghosts.forEach(g => g.remove());
    ghosts = [];
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    isAnimating = false;
    target.style.opacity = '';
  }

  function update() {
    const current = getTransformPos(target);
    const dx = current.x - lastPosition.x;
    const dy = current.y - lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < threshold) {
      animationId = requestAnimationFrame(update);
      return;
    }

    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const angleDeg = angle * (180 / Math.PI);

    const relDist = distance / elementSize.width;
    const progress = totalDistance
      ? Math.min(
        1,
        Math.sqrt(
          Math.pow(current.x - startPosition.x, 2) +
          Math.pow(current.y - startPosition.y, 2)
        ) / totalDistance
      )
      : 0;
    const eased = Math.sin(progress * Math.PI);
    const verticalFactor = Math.abs(Math.sin(angle - Math.PI / 2));

    const blur = relDist * blurMultiplier * (1 - progress);
    const stretch = 1 + relDist * stretchMultiplier * verticalFactor * eased;

    ghosts.forEach((ghost, i) => {
      const factor = (ghosts.length - 1 - i) / ghosts.length;
      const x = lastPosition.x + (current.x - lastPosition.x) * factor;
      const y = lastPosition.y + (current.y - lastPosition.y) * factor;

      ghost.classList.add('fnb-ghost');

      ghost.style.setProperty('--x', `${x}px`);
      ghost.style.setProperty('--y', `${y}px`);
      ghost.style.setProperty('--blur', `${blur}px`);
      ghost.style.setProperty('--angle', `${angleDeg}deg`);
      ghost.style.setProperty('--stretch', `${stretch}`);
    });

    lastPosition = current;
    animationId = requestAnimationFrame(update);
  }

  target.addEventListener('transitionstart', () => {
    if (isAnimating) return;
    isAnimating = true;

    startPosition = getTransformPos(target);
    lastPosition = startPosition;

    const match = target.style.transform.match(
      /translate\(([\d.-]+)px,\s*([\d.-]+)px\)/
    );
    endPosition = match
      ? { x: parseFloat(match[1]), y: parseFloat(match[2]) }
      : startPosition;

    totalDistance = Math.hypot(
      endPosition.x - startPosition.x,
      endPosition.y - startPosition.y
    );

    createGhosts();
    target.style.opacity = '0';
    update();
  });

  target.addEventListener('transitionend', cleanup);
}
