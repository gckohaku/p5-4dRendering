import { Vector3 } from "./Vector3";

export class Frustum {
	viewAngleX: number;
	viewAngleY: number;
	viewNear: number;
	viewFar: number;
	aspect: number;

	position: Vector3;

	constructor(angleX: number, angleY: number, near: number, far: number, aspect: number, pos: Vector3);
	constructor(angleX: number, angleY: number, near: number, far: number, aspect: number, posX: number, posY: number, posZ: number)

	constructor(angleX: number, angleY: number, near: number, far: number, aspect: number, pos1: Vector3 | number, pos2?: number, pos3?: number) {
		this.viewAngleX = angleX;
		this.viewAngleY = angleY;
		this.viewNear = near;
		this.viewFar = far;
		this.aspect = aspect;

		if (pos1 instanceof Vector3) {
			this.position = pos1;
		}
		else if (typeof pos1 === "number" && typeof pos2 === "number" && typeof pos3 === "number") {
			this.position = new Vector3(pos1, pos2, pos3);
		}
		else {
			throw new Error(`Frustum constructing error: invalid type error`);
		}
	}
}