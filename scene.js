import Snake from './snake.js'
import Fruit from './fruit.js'
import SceneObject from './scene-object.js'

/**
 * @type {Node}
 */
let canvas

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
	constructor(_canvas, snakes = [new Snake], { frameReload = 50, blockSize = 10, onRedraw = () => {} } = {}) {
		canvas = _canvas
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
		this.onRedraw = onRedraw
		const toDraw = []
		snakes.forEach((snake) => toDraw.push(...this.addObject(snake)))
		toDraw.push(...this.addObject(new Fruit(this.availableRandomPosition())))
		this.redraw(null, toDraw)
	}

	start() {
		refreshInterval = window.setInterval(() => {
			const toClear = []
			const toDraw = []

			this.snakes.forEach((snake) => {
				const [oldPosition, newPosition] = snake.move()

				oldPosition && toClear.push({
					position: oldPosition,
				})
				newPosition && toDraw.push({
					position: newPosition,
					color: snake.color
				})
			})

			let fruitEaten = false
			const noDead = this.snakes.every((snake) => {
				const collisions = this.checkCollisions(snake, snake.head).some((object) => {
					if(object.isEatable) {
						snake.eat(object)
						toClear.push(...this.removeObject(object))
						fruitEaten = true
						return false
					}
					return true
				})
				if (collisions || this.snakeHeadMeetsWall(snake)) {
					snake.die()
					this.stop()
					return false
				}
				return true
			})

			if (!noDead) return

			if (fruitEaten) {
				toDraw.push(...this.addObject(new Fruit(this.availableRandomPosition())))
			}

			this.redraw(toClear, toDraw)
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

	becomePassive() {
		this.passive = true
		stop()
	}

	availableRandomPosition() {
		let x, y, o
		do {
			x = Math.floor(Math.random() * this.width)
			y = Math.floor(Math.random() * this.height)
			o = new Object([[x, y]])
		} while(this.checkCollisions(o, [x, y]).length > 0)
		return [x, y]
	}

	clear() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	redraw(toClear, toDraw) {
		this.onRedraw(toClear, toDraw)
		toClear && toClear.forEach(({ position }) => {
			this._clearRect(position)
		})
		toDraw && toDraw.forEach(({ position, color}) => {
			this._drawRect(position, color)
		})
	}

	removeObject(object) {
		objects = objects.filter((o) => o !== object)
		return object.positions.map((position) => ({ position }))
	}

	addObject(object) {
		objects.push(object)
		return object.positions.map((position) => ({ position, color: object.color }))
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