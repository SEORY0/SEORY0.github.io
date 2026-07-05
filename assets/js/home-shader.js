/* assets/js/home-shader.js — ambient home background (Paper Shaders, neuro noise)
 * Renders a grayscale "Ghost"-style neural web behind the home content panel.
 * Light theme draws gray-on-white; dark theme flips it via CSS invert(1).
 * If WebGL/CDN fails, the element is removed and the plain --bg shows instead. */

import {
  ShaderMount,
  neuroNoiseFragmentShader,
  getShaderColorFromString,
} from 'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.77/+esm';

const host = document.querySelector('.shader-bg');

if (host) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    new ShaderMount(
      host,
      neuroNoiseFragmentShader,
      {
        u_colorFront: getShaderColorFromString('#b0b0b0'),
        u_colorMid: getShaderColorFromString('#ececec'),
        u_colorBack: getShaderColorFromString('#ffffff'),
        u_brightness: 0,
        u_contrast: 1,
        /* pattern sizing defaults (fit: none) — see @paper-design/shaders shader-sizing */
        u_fit: 0,
        u_scale: 0.55,
        u_rotation: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_offsetX: 0,
        u_offsetY: 0,
        u_worldWidth: 0,
        u_worldHeight: 0,
      },
      undefined,
      reduceMotion ? 0 : 0.4,
      reduceMotion ? 60000 : 0
    );
  } catch (err) {
    host.remove();
  }
}
