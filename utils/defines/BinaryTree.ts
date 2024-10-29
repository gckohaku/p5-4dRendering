export class BinaryTree<T> {
	data: T;
	left: BinaryTree<T> | null = null;
	right: BinaryTree<T> | null = null;

	constructor(data: T, isDeepCopy: boolean = false) {
		if (isDeepCopy) {
			this.data = structuredClone(data);
		}
		else {
			this.data = data;
		}
	}

	addLeft(data: T, isDeepCopy: boolean = false) {
		if (isDeepCopy) {
			this.left = new BinaryTree<T>(structuredClone(data));
		}
		else {
			this.left = new BinaryTree<T>(data);
		}
	}

	removeLeft() {
		this.left = null;
	}

	addRight(data: T, isDeepCopy: boolean = false) {
		if (isDeepCopy) {
			this.right = new BinaryTree<T>(structuredClone(data));
		}
		else {
			this.right = new BinaryTree<T>(data);
		}
	}

	removeRight() {
		this.right = null;
	}

	toString(depth: number = 0) {
		const indentSpace = "    ";
		let retStr: string = indentSpace.repeat(depth) + "[\n";

		if (this.left) {
			retStr += this.left.toString(depth + 1);
		}
		retStr += indentSpace.repeat(depth + 1) + `${JSON.stringify(this.data)}\n`;
		if (this.right) {
			retStr += this.right.toString(depth + 1);
		}

		retStr += indentSpace.repeat(depth) + "]\n";

		return retStr;
	}
}