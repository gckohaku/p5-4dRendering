export class Vector3 {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number);
	constructor(x: string, y: string, z: string);
	constructor(v: Vector3);

	constructor(arg1: number | string | Vector3, arg2?: number | string, arg3?: number | string) {
		if (arg1 instanceof Vector3) {
			const v: Vector3 = arg1;
			this.x = v.x;
			this.y = v.y;
			this.z = v.z;
		}
		else if (arg2 && arg3) {

			const x: number | string = arg1;
			const y: number | string = arg2;
			const z: number | string = arg3;

			if (typeof x === "string" && typeof y === "string" && typeof z === "string") {
				this.x = Number(x);
				this.y = Number(y);
				this.z = Number(z);
			}
			else if (typeof x === "number" && typeof y === "number" && typeof z === "number") {
				this.x = x;
				this.y = y;
				this.z = z;
			}
			else {
				throw new Error("Vector3 construct error: Unknown error");
			}
		}
		else {
			throw new Error("Vector3 construct error: Unknown error");
		}
	}

	minus(): Vector3 {
		return new Vector3(-this.x, -this.y, -this.z);
	}

	add(opp: Vector3): Vector3 {
		return new Vector3(this.x + opp.x, this.y + opp.y, this.z + opp.z);
	}

	sub(opp: Vector3): Vector3 {
		return this.add(opp.minus());
	}

	abs(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
}