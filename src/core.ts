import '../src/style.css';

export interface FluidMotionCoreOptions {
  ghostCount?: number;
  blurMultiplier?: number;
  stretchMultiplier?: number;
}

export interface FluidMotionControls {
  updateOptions: (newOptions: FluidMotionCoreOptions) => void;
  destroy: () => void;
}

export function initFluidMotion(
  target: HTMLElement,
  initialOptions: FluidMotionCoreOptions = {}
): FluidMotionControls {
  let options = {
    ghostCount: 2,
    blurMultiplier: 10,
    stretchMultiplier: 2,
    ...initialOptions,
  };

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

  function createOrUpdateGhosts() {
    ghosts.forEach(g => g.remove());
    ghosts = [];

    const rect = target.getBoundingClientRect();
    elementSize = { width: rect.width, height: rect.height };
    ghosts = Array.from({ length: options.ghostCount }).map(() => {
      const ghost = target.cloneNode(true) as HTMLElement;
      ghost.removeAttribute('id');
      ghost.inert = true;
      // Ghosts get full opacity (remove any opacity styling)
      ghost.style.opacity = '1';
      target.parentElement?.insertBefore(ghost, target.nextSibling);
      return ghost;
    });

    // Only AFTER creating ghosts do we lower target opacity
    target.style.opacity = '0'; // Or your preferred value
  }

  function cleanupAnimation() {
    ghosts.forEach(g => g.remove());
    ghosts = [];
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    isAnimating = false;
    // Restore target opacity when animation ends
    target.style.opacity = '';
  }

  function update() {
    const current = getTransformPos(target);
    const dx = current.x - lastPosition.x;
    const dy = current.y - lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const angleDeg = angle * (180 / Math.PI);
    
    const relDist = distance / elementSize.width;
    const progress = totalDistance
      ? Math.min(
          1,
          Math.hypot(current.x - startPosition.x, current.y - startPosition.y) /
            totalDistance
        )
      : 0;
    const eased = Math.sin(progress * Math.PI);
    const verticalFactor = Math.abs(Math.sin(angle - Math.PI / 2));

    const blur = relDist * options.blurMultiplier * (1 - progress);
    const stretch = 1 + relDist * options.stretchMultiplier * verticalFactor * eased;

    ghosts.forEach((ghost, i) => {
      const factor = i === 0 ? 1 : (ghosts.length - i) / ghosts.length;
      const x = lastPosition.x + (current.x - lastPosition.x) * factor;
      const y = lastPosition.y + (current.y - lastPosition.y) * factor;

      ghost.classList.add('fnb-ghost');
      ghost.style.setProperty('--x', `${x}px`);
      ghost.style.setProperty('--y', `${y}px`);
      ghost.style.setProperty('--blur', `${blur}px`);
      ghost.style.setProperty('--angle', `${angleDeg}deg`);
      ghost.style.setProperty('--stretch', `${stretch}`);
      // Ensure ghost maintains full opacity
      ghost.style.opacity = '1';
    });

    lastPosition = current;
    animationId = requestAnimationFrame(update);
  }

  const onTransitionStart = () => {
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

    createOrUpdateGhosts(); // This now handles opacity changes
    update();
  };

  const onTransitionEnd = () => {
    cleanupAnimation();
  };

  target.addEventListener('transitionstart', onTransitionStart);
  target.addEventListener('transitionend', onTransitionEnd);

  function updateOptions(newOptions: FluidMotionCoreOptions) {
    const oldGhostCount = options.ghostCount;
    options = { ...options, ...newOptions };

    if (isAnimating && oldGhostCount !== options.ghostCount) {
      createOrUpdateGhosts();
    }
  }

  function destroy() {
    cleanupAnimation();
    target.removeEventListener('transitionstart', onTransitionStart);
    target.removeEventListener('transitionend', onTransitionEnd);
  }

  return { updateOptions, destroy };
}