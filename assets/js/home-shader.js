/* assets/js/home-shader.js — ambient page background (Paper Shaders, image dithering)
 * Dithers a nature photo (Wikimedia Commons, CC0) into a monochrome 8x8 Bayer
 * pixel pattern. The source image comes from the .shader-bg element's
 * data-image attribute, so each page can supply its own backdrop.
 * Light theme: dark pixels on white; dark theme flips via CSS invert(1).
 *
 * Perf: the shader library is self-hosted (./paper-shaders.min.js, same-origin
 * + cacheable, no third-party CDN round-trip) and the source photos are small
 * (~800px; dithering hides the low resolution). The page also preloads the
 * backdrop (see head.html) so it starts downloading before this module runs.
 * If WebGL/load fails, the element is removed and the plain --bg shows instead. */

import {
  ShaderMount,
  imageDitheringFragmentShader,
  getShaderColorFromString,
  DitheringTypes,
} from './paper-shaders.min.js';

const host = document.querySelector('.shader-bg');

/* ShaderMount expects a *loaded* HTMLImageElement for image uniforms
   (string URLs are only resolved by the React wrapper). */
function mount(image) {
  try {
    new ShaderMount(host, imageDitheringFragmentShader, {
      u_image: image,
      /* colorBack maps to dark image areas, colorFront/Highlight to light ones */
      u_colorFront: getShaderColorFromString('#ffffff'),
      u_colorBack: getShaderColorFromString('#1f1f1f'),
      u_colorHighlight: getShaderColorFromString('#ffffff'),
      u_type: DitheringTypes['8x8'],
      u_pxSize: 4,
      u_colorSteps: 2,
      u_originalColors: false,
      u_inverted: false,
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
  img.src = host.dataset.image || '/assets/images/sky-halftone.jpg';
}
