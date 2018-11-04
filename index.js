import Snake from './snake.js'
import Scene from './scene.js'

const canvas = document.getElementById("game")

const snake = new Snake()
const scene = new Scene(canvas, snake)

scene.start()

window.addEventListener('keydown', (event) => {
	if (event.key.startsWith("Arrow")) {
		snake.nextDirection = event.key.slice(5)
	}
}, false)