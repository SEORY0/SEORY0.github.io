/* assets/js/home-shader.js — ambient home background (Paper Shaders, halftone dots)
 * Halftones a sky photo (Wikimedia Commons, CC0: "Cumulus clouds in the sky")
 * into a monochrome dot screen. Light theme: dark dots on white; dark theme
 * flips via CSS invert(1). If WebGL/CDN fails, the element is removed and the
 * plain --bg background shows instead. */

import {
  ShaderMount,
  halftoneDotsFragmentShader,
  getShaderColorFromString,
  HalftoneDotsTypes,
  HalftoneDotsGrids,
} from 'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.77/+esm';

const host = document.querySelector('.shader-bg');

/* ShaderMount expects a *loaded* HTMLImageElement for image uniforms
   (string URLs are only resolved by the React wrapper). */
function mount(image) {
  try {
    new ShaderMount(host, halftoneDotsFragmentShader, {
      u_image: image,
      u_colorFront: getShaderColorFromString('#1f1f1f'),
      u_colorBack: getShaderColorFromString('#ffffff'),
      u_size: 0.5,
      u_radius: 1.25,
      u_contrast: 0.55,
      u_originalColors: false,
      u_inverted: false,
      u_grainMixer: 0,
      u_grainOverlay: 0,
      u_grainSize: 0.5,
      u_grid: HalftoneDotsGrids.hex,
      u_type: HalftoneDotsTypes.classic,
      /* object sizing — behave like background-size: cover */
      u_fit: 2,
      u_scale: 1,
      u_rotation: 0,
      u_originX: 0.5,
      u_originY: 0.5,
      u_offsetX: 0,
      u_offsetY: 0,
      u_worldWidth: 0,
      u_worldHeight: 0,
    });
  } catch (err) {
    host.remove();
  }
}

if (host) {
  const img = new Image();
  img.onload = () => mount(img);
  img.onerror = () => host.remove();
  img.src = '/assets/images/sky-halftone.jpg';
}
