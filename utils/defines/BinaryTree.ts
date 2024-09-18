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
}