import Snake from './snake.js'
import Scene from './scene.js'

const canvas = document.getElementById('game')
const scoreContainer = document.getElementById('score')
const bestScoreContainer = document.getElementById('best')
const restartButton = document.getElementById('restart')
const playOnlineButton = document.getElementById('online')
const responseField = document.getElementById('response')

let bestScore = Number(localStorage.getItem('editmetohavethebestscoreever'))

bestScoreContainer.innerText = bestScore.toString()

const SDP_STORAGE = 'SDP_STORAGE'

const params = new URLSearchParams(location.search)
let joinDescription = params.get('join')
let ensureDescription = params.get('ensure')


function createConnection() {
	const peerConnection = new RTCPeerConnection(null)
	let description

	peerConnection.oniceconnectionstatechange = () => {
		console.log(`ICE connection state changed to ${peerConnection.iceConnectionState}`)
	}

	peerConnection.onicecandidate = (event) => {
		if (event.candidate) return
		description = peerConnection.localDescription
		localStorage.setItem(SDP_STORAGE, JSON.stringify(peerConnection.localDescription))
		playOnlineButton.onclick = async () => {
			await navigator.clipboard.writeText(`${path}?join=${btoa(JSON.stringify(description))}`)
			playOnlineButton.innerText = 'invitation copied to clipboard'
			setTimeout(() => {
				responseField.removeAttribute('hidden')
			}, 2000)
		}
	}

	const createOfferSDP = async () => {
		const dataChannel = peerConnection.createDataChannel("chat")
		const description = await peerConnection.createOffer()
		peerConnection.setLocalDescription(description)

		dataChannel.onopen = () => {
			playOnlineButton.disabled = true
			playOnlineButton.innerText = 'connected'
		}
		dataChannel.onmessage = ({data}) => {
			if (data) console.log(data)
			else console.log('message without data')
		}
	}

	responseField.addEventListener('focus', async () => {
		try {
			const data = await navigator.clipboard.readText()
			responseField.innerText = data
			start(data)
			responseField.setAttribute('hidden', 'hidden')
		} catch (e) {
			responseField.placeholder = 'please paste data manually'
		}
	})

	responseField.addEventListener('paste', (e) => {
		const clipboardData = e.clipboardData || window.clipboardData
		const pastedData = clipboardData.getData('Text')
		start(pastedData)
		responseField.setAttribute('hidden', 'hidden')
	})

	function start(data) {
		const remoteDescription = new RTCSessionDescription(JSON.parse(atob(data)))
		peerConnection.setRemoteDescription(remoteDescription)
	}
	createOfferSDP()
}

function joinConnection() {
	const sdpConstraints = { optional: [{RtpDataChannels: true}]  }
	const peerConnection = new RTCPeerConnection(null)
	let dataChannel, description
	peerConnection.ondatachannel = function(e) {
		dataChannel = e.channel
		dataChannel.onopen = () => {
			playOnlineButton.disabled = true
			playOnlineButton.innerText = 'connected'
		}
		dataChannel.onmessage = ({data}) => {
			if (data) console.log(data)
			else console.log('message without data')
		}
	}

	peerConnection.onicecandidate = function(e) {
		if (e.candidate) return
		playOnlineButton.innerText = 'click here to copy response'
		playOnlineButton.onclick = async () => {
			await navigator.clipboard.writeText(btoa(JSON.stringify(description)))
			playOnlineButton.innerText = 'response copied to clipboard'
		}
	}

	peerConnection.oniceconnectionstatechange = () => {
		console.log(`ICE connection state changed to ${peerConnection.iceConnectionState}`)
	}

	function createAnswerSDP() {
		const offerDesc = new RTCSessionDescription(joinDescription)
		peerConnection.setRemoteDescription(offerDesc)
		peerConnection.createAnswer(function (answerDesc) {
			  description = answerDesc
				peerConnection.setLocalDescription(answerDesc)
			}, function () {console.warn("Couldn't create offer")},
			sdpConstraints)
	}

	createAnswerSDP()
}

if (!ensureDescription && !joinDescription) {
	createConnection()
} else if (joinDescription) {
	joinDescription = JSON.parse(atob(joinDescription))
	joinConnection()
} else if (ensureDescription) {
	ensureDescription = JSON.parse(atob(ensureDescription))
	ensureConnection()
}



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

const path = `${window.location.protocol}//${window.location.host}${window.location.pathname}`

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
