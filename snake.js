import SceneObject from './scene-object.js'

const DIRECTION = {
	left: "Left",
	down: "Down",
	up: "Up",
	right: "Right"
}

export default class Snake extends SceneObject {
	constructor(size = 10, direction = DIRECTION.right, headX = 20, headY = 20) {
		const positions = [...new Array(size)].map((_, index) => [headX - index, headY])
		super(positions)
		this.size = size
		this.direction = direction
		this._nextDirections = []
	}

	directionOverSameAxe(direction) {
		const horizontal = [DIRECTION.left, DIRECTION.right]
		const vertical = [DIRECTION.up, DIRECTION.down]
		const lastDirection = this._nextDirections.length === 0
			? this.direction
			: this._nextDirections[this._nextDirections.length]
		return [horizontal, vertical].some((axe) => axe.includes(direction) && axe.includes(lastDirection))
	}
	set nextDirection(direction) {
		if (this.directionOverSameAxe(direction)) return

		this._nextDirections.push(direction)
	}

	get head() {
		return this.positions[0]
	}

	get tail() {
		return this.positions[this.positions.length - 1]
	}

	eat(fruit) {
		this.size += fruit.value
	}

	move() {
		if (this._nextDirections.length > 0) {
			this.direction = this._nextDirections.shift()
		}
		let [headX, headY] = this.head
		switch(this.direction) {
			case DIRECTION.up:
				headY -= 1;
				break;
			case DIRECTION.down:
				headY += 1;
				break;
			case DIRECTION.left:
				headX -= 1;
				break;
			case DIRECTION.right:
				headX += 1;
				break;
		}
		let oldPosition

		if (this.size === this.positions.length) {
			oldPosition = this.positions.pop()
		}
		this.positions.unshift([headX, headY])

		return [oldPosition, this.head]
	}
}