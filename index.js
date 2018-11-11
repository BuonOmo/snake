import Snake from './snake.js'
import Scene from './scene.js'

const canvas = document.getElementById("game")
const scoreContainer = document.getElementById("score")
const bestScoreContainer = document.getElementById("best")
const restartButton = document.getElementById("restart")

let bestScore = Number(localStorage.getItem("editmetohavethebestscoreever"))

bestScoreContainer.innerText = bestScore.toString()

console.log('Update `buttonPlayer1`, or `ButtonPlayer2` to change keyboard mapping (do not use space)')
window.buttonPlayer1 = {
	ArrowUp: 'Up',
	ArrowLeft: 'Left',
	ArrowDown: 'Down',
	ArrowRight: 'Right'
}
window.buttonPlayer2 = {
	w: 'Up',
	a: 'Left',
	s: 'Down',
	d: 'Right'
}

const getStars = async () => {
	const response = await fetch('https://api.github.com/repos/buonomo/snake')
	const data = await response.json()
	document.getElementById('stars').innerText = ` (${data.stargazers_count})`
}

getStars()

const updateScore = (snakeSize) => {
	const score = snakeSize - 10
	if (score > bestScore) {
		bestScore = score
		bestScoreContainer.innerText = score.toString()
		localStorage.setItem('editmetohavethebestscoreever', score.toString())
	}
	scoreContainer.innerText = score.toString()
}

let currentGame = false

const loadGame = () => {
	if (currentGame) return false

	currentGame = true
	restartButton.setAttribute('hidden', 'hidden')
	scoreContainer.innerText = '0'
	canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
	game.scene = null
	game.snakes = [
		new Snake({ size: 10, headY: 1, onSizeUpdate: updateScore, color: 'steelblue', onDie: allowRestart }),
		new Snake({ size: 10, headY: 38, onDie: allowRestart, color: 'brown' })
	]
	game.scene = new Scene(canvas, game.snakes)
	game.scene.start()
}

const allowRestart = () => {
	currentGame = false
	restartButton.removeAttribute('hidden')
}

const game = {}

loadGame()

window.addEventListener('keydown', (event) => {
	if (buttonPlayer1[event.key] !== undefined) {
		if (game.snakes[0]) {
			game.snakes[0].nextDirection = buttonPlayer1[event.key]
		}
	} else if (buttonPlayer2[event.key] !== undefined) {
		if (game.snakes[1]) {
			game.snakes[1].nextDirection = buttonPlayer2[event.key]
		}
	} else if (event.key === ' ') {
		loadGame()
	}
}, false)

restartButton.addEventListener('click', loadGame)
