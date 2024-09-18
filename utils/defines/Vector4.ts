export class Vector4 {
	x: number;
	y: number;
	z: number;
	w: number;

	constructor(x: number, y: number, z: number, w: number);
	constructor(x: string, y: string, z: string, w: string);
	constructor(v: Vector4);

	constructor(arg1: number | string | Vector4, arg2?: number | string, arg3?: number | string, arg4?: number | string) {
		if (arg1 instanceof Vector4) {
			const v: Vector4 = arg1;
			this.x = v.x;
			this.y = v.y;
			this.z = v.z;
			this.w = v.w
		}
		else if (arg2 && arg3 && arg4) {

			const x: number | string = arg1;
			const y: number | string = arg2;
			const z: number | string = arg3;
			const w: number | string = arg4;

			if (typeof x === "string" && typeof y === "string" && typeof z === "string" && typeof w === "string") {
				this.x = Number(x);
				this.y = Number(y);
				this.z = Number(z);
				this.w = Number(w);
			}
			else if (typeof x === "number" && typeof y === "number" && typeof z === "number" && typeof w === "number") {
				this.x = x;
				this.y = y;
				this.z = z;
				this.w = w;
			}
			else {
				throw new Error("Vector2 construct error: Unknown error");
			}
		}
		else {
			throw new Error("Vector2 construct error: Unknown error");
		}
	}

	minus(): Vector4 {
		return new Vector4(-this.x, -this.y, -this.z, -this.w);
	}

	add(opp: Vector4): Vector4 {
		return new Vector4(this.x + opp.x, this.y + opp.y, this.z + opp.z, this.w + opp.w);
	}

	sub(opp: Vector4): Vector4 {
		return this.add(opp.minus());
	}

	abs(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
	}
}