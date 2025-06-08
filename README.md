# Fluid Motion Blur

Motion blur for the web.

## Installation

```bash
npm install fluid-motion-blur
```

## Usage

```javascript
import { initFluidMotion } from 'fluid-motion-blur';

const element = document.getElementById('my-element');
const controls = initFluidMotion(element, {
  ghostCount: 3,
  blurMultiplier: 15,
  stretchMultiplier: 1.5
});

// Later...
controls.updateOptions({ ghostCount: 5 });
controls.destroy();
```

## Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| ghostCount | number | 2 | Number of ghost elements to create |
| blurMultiplier | number | 10 | Intensity of the blur effect |
| stretchMultiplier | number | 2 | Intensity of the stretch effect |