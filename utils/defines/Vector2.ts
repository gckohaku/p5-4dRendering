export class Vector2 {
	x: number;
	y: number;

	constructor(x: number, y: number);
	constructor(x: string, y: string);
	constructor(v: Vector2);

	constructor(arg1: number | string | Vector2, arg2?: number | string) {
		if (arg1 instanceof Vector2) {
			const v: Vector2 = arg1;
			this.x = v.x;
			this.y = v.y;
		}
		else if (typeof arg2 !== "undefined") {

			const x: number | string = arg1;
			const y: number | string = arg2;

			if (typeof x === "string" && typeof y === "string") {
				this.x = Number(x);
				this.y = Number(y);
			}
			else if (typeof x === "number" && typeof y === "number") {
				this.x = x;
				this.y = y;
			}
			else {
				throw new Error("Vector2 construct error: Unknown error");
			}
		}
		else {
			throw new Error("Vector2 construct error: Unknown error");
		}
	}

	minus(): Vector2 {
		return new Vector2(-this.x, -this.y);
	}

	add(opp: Vector2): Vector2 {
		return new Vector2(this.x + opp.x, this.y + opp.y);
	}

	sub(opp: Vector2): Vector2 {
		return this.add(opp.minus());
	}

	abs(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
}