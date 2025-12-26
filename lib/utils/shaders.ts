/**
 * GLSL Shader definitions for 3D effects
 * Extracted from UnifiedUniverse.tsx for reusability
 */

/**
 * Fresnel vertex shader for rim glow effect
 * Calculates normal and position for fragment shader
 */
export const fresnelVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * Fresnel fragment shader for rim glow effect
 * Creates a glowing edge effect based on viewing angle
 */
export const fresnelFragmentShader = `
uniform vec3 glowColor;
uniform float fresnelPower;
uniform float glowIntensity;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDirection = normalize(-vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), fresnelPower);
  gl_FragColor = vec4(glowColor, fresnel * glowIntensity);
}
`

/**
 * Creates fresnel shader uniforms object for Three.js
 */
export function createFresnelUniforms(
  glowColor: THREE.Color,
  fresnelPower: number = 2.5,
  glowIntensity: number = 0.6
) {
  return {
    glowColor: { value: glowColor },
    fresnelPower: { value: fresnelPower },
    glowIntensity: { value: glowIntensity },
  }
}

// Type import for createFresnelUniforms
import type * as THREE from 'three'
