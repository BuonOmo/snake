import Snake from './snake.js'
import Scene from './scene.js'

const canvas = document.getElementById("game")
const scoreContainer = document.getElementById("score")
const bestScoreContainer = document.getElementById("best")
const restartButton = document.getElementById("restart")

let bestScore = Number(localStorage.getItem("editmetohavethebestscoreever"))

bestScoreContainer.innerText = bestScore.toString()

const updateScore = (snakeSize) => {
	const score = snakeSize - 10
	if (score > bestScore) {
		bestScore = score
		bestScoreContainer.innerText = score.toString()
		localStorage.setItem('editmetohavethebestscoreever', score.toString())
	}
	scoreContainer.innerText = score.toString()
}

const loadGame = () => {
	restartButton.setAttribute('hidden', 'hidden')
	scoreContainer.innerText = "0"
	canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
	game.scene = null
	game.snake = new Snake({ size: 10, onSizeUpdate: updateScore, onDie: showRestartButton })
	game.scene = new Scene(canvas, game.snake)
	game.scene.start()
}

const showRestartButton = () => {
	restartButton.removeAttribute('hidden')
}

const game = {}

loadGame()

window.addEventListener('keydown', (event) => {
	if (event.key.startsWith("Arrow")) {
		if (game.snake) {
			game.snake.nextDirection = event.key.slice(5)
		}
	}
}, false)

restartButton.addEventListener('click', loadGame)
