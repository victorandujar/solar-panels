/// <reference types="@react-three/fiber" />
import * as THREE from "three";
import { MeshProps, Object3DNode } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: MeshProps;
      group: Object3DNode<THREE.Group, typeof THREE.Group>;
      planeGeometry: Object3DNode<
        THREE.PlaneGeometry,
        typeof THREE.PlaneGeometry
      >;
      shapeGeometry: Object3DNode<
        THREE.ShapeGeometry,
        typeof THREE.ShapeGeometry
      >;
      meshStandardMaterial: Object3DNode<
        THREE.MeshStandardMaterial,
        typeof THREE.MeshStandardMaterial
      >;
      meshPhongMaterial: Object3DNode<
        THREE.MeshPhongMaterial,
        typeof THREE.MeshPhongMaterial
      >;
      lineBasicMaterial: Object3DNode<
        THREE.LineBasicMaterial,
        typeof THREE.LineBasicMaterial
      >;
      lineLoop: Object3DNode<THREE.LineLoop, typeof THREE.LineLoop>;
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      directionalLight: Object3DNode<
        THREE.DirectionalLight,
        typeof THREE.DirectionalLight
      >;
      axesHelper: Object3DNode<THREE.AxesHelper, typeof THREE.AxesHelper>;
    }
  }
}
