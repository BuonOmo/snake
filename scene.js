import Snake from './snake.js'
import Fruit from './fruit.js'
import SceneObject from './scene-object.js'

/**
 * @type {CanvasRenderingContext2D|null}
 */
let context

/**
 * @type {SceneObject[]}
 */
let objects = []

/**
 * Interval ID
 * @type {Number}
 */
let refreshInterval

export default class Scene {
	constructor(canvas, snakes = [new Snake], frameReload = 40, blockSize = 10) {
		this.blockSize = blockSize
		this.width = canvas.width / blockSize
		this.height = canvas.height / blockSize
		if (this.width !== Math.floor(this.width) || this.height !== Math.floor(this.height)) {
			throw 'Something to do here'
		}
		context = canvas.getContext('2d')
		this.snakes = snakes
		objects = []
		this.frameReload = frameReload
		snakes.forEach((snake) => this.addObject(snake))
	}

	start() {
		this.addObject(new Fruit(this.availableRandomPosition()))

		refreshInterval = window.setInterval(() => {
			const oldPositions = []
			const newPositions = []
			this.snakes.forEach((snake) => {
				const [oldPosition, newPosition] = snake.move()
				oldPositions.push(oldPosition)
				newPositions.push(newPosition)
			})

			let fruitEaten = false
			this.snakes.forEach((snake) => {
				const collisions = this.checkCollisions(snake, snake.head).some((object) => {
					if(object.isEatable) {
						snake.eat(object)
						this.removeObject(object)
						fruitEaten = true
						return false
					}
					return true
				})
				if (collisions || this.snakeHeadMeetsWall(snake)) {
					snake.die()
					this.stop()
					return
				}
			})

			oldPositions.forEach(position => {
				if (position !== undefined) this._clearRect(position)
			})
			newPositions.forEach((position, index) => {
				if (position !== undefined) this._drawRect(position, this.snakes[index].color)
			})

			if (fruitEaten) {
				this.addObject(new Fruit(this.availableRandomPosition()))
			}
		}, 	this.frameReload)
	}

	// TODO: this may be treated as a usual collision.
	snakeHeadMeetsWall(snake) {
		const [headX, headY] = snake.head
		return headX < 0 || headX >= this.width || headY < 0 || headY >= this.height;
	}

	stop() {
		window.clearInterval(refreshInterval)
	}

	availableRandomPosition() {
		let x, y, o
		do {
			x = Math.floor(Math.random() * this.width)
			y = Math.floor(Math.random() * this.height)
			o = new SceneObject([[x, y]])
		} while(this.checkCollisions(o, [x, y]).length > 0)
		return [x, y]
	}

	removeObject(object) {
		objects = objects.filter((o) => o !== object)
		object.positions.forEach((position) => this._clearRect(position))
	}

	addObject(object) {
		objects.push(object)
		object.positions.forEach((position) => this._drawRect(position, object.color))
	}

	checkCollisions(currentObject, currentPosition) {
		return objects.filter((object) => {
			if (currentObject === object) {
				return object.checkSelfCollisions(currentPosition)
			} else {
				return object.checkCollisions(currentPosition)
			}
		})
	}

	_drawRect([x, y], color) {
		context.fillStyle = color
		context.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize)
	}

	_clearRect([x, y]) {
		context.clearRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize)
	}
}