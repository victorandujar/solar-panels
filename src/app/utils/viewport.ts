import * as THREE from "three";

export function calculateViewport(
  element: HTMLElement | null,
  globalViewport?: THREE.Vector4,
): THREE.Vector4 {
  if (!element) {
    return new THREE.Vector4(0, 0, 250, 250); // Default fallback
  }

  const rect = element.getBoundingClientRect();

  // Si tenemos un viewport global, usar esas coordenadas relativas
  if (globalViewport) {
    return new THREE.Vector4(
      rect.left,
      window.innerHeight - rect.bottom, // WebGL usa coordenadas invertidas en Y
      rect.width,
      rect.height,
    );
  }

  // Si no, usar las coordenadas del elemento
  return new THREE.Vector4(
    rect.left,
    window.innerHeight - rect.bottom,
    rect.width,
    rect.height,
  );
}

export function getElementViewport(elementId: string): THREE.Vector4 {
  const element = document.getElementById(elementId);
  return calculateViewport(element);
}
