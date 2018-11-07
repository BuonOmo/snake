let index = 0

export default class SceneObject {
	constructor(positions, color = 'black') {
		this.positions = positions
		this.color = color
		this.id = index++
	}

	get hash() {
		return String(this.id)
	}

	checkSelfCollisions(currentPosition) {
		return this.positions.reduce((sum, position) => {
			return SceneObject.isSamePosition(position, currentPosition) ? sum + 1 : sum
		}, 0) > 1
	}

	checkCollisions(currentPosition) {
		return this.positions.some((position) => SceneObject.isSamePosition(position, currentPosition))
	}

	static isSamePosition(a, b) {
		return a[0] === b[0] && a[1] === b[1]
	}
}