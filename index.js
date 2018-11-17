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

const getStars = async () => {
	const response = await fetch('https://api.github.com/repos/buonomo/snake')
	const data = await response.json()
	document.getElementById('stars').innerText = ` (${data.stargazers_count})`
}

getStars()

const SDP_STORAGE = 'SDP_STORAGE'

// Events sent by dataChannel if online
const ALLOW_RESTART_EVENT = 'ALLOW_RESTART_EVENT'
const CHANGE_DIRECTION_EVENT = 'CHANGE_DIRECTION_EVENT'
const REDRAW_EVENT = 'REDRAW_EVENT'
const RELOAD_GAME_EVENT = 'RELOAD_GAME_EVENT'
const RESET_BOARD_EVENT = 'RESET_BOARD_EVENT'
const RESTART_GAME_EVENT = 'RESTART_GAME_EVENT'
const UPDATE_SCORE_EVENT = 'UPDATE_SCORE_EVERT'

const params = new URLSearchParams(location.search)
let joinDescription = params.get('join')

// clean url
history.pushState(null, "", location.href.split("?")[0])

const host = !joinDescription
const client = !host
let online = false
let dataChannel = null
let currentGame = false
let gameLoaded = false

const log = (type) => (message, data = null) => {
	const time = new Date()
	const formattedTime = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`
	const fullMessage = `${formattedTime} - ${message}`
	const args = [fullMessage]
	if (data) args.push(data)
	switch (type) {
		case 'warn':
			console.warn(...args)
			break
		case 'debug':
			console.debug(...args)
			break
		case 'error':
			console.error(...args)
			break
		default:
			console.log(...args)
	}
}

const error = log('error')
const debug = log('debug')

debug(host ? 'Host mode' : 'Client mode')


const controls = window.controls = {
	ArrowUp: 'Up',
	ArrowLeft: 'Left',
	ArrowDown: 'Down',
	ArrowRight: 'Right'
}

const game = {}

// https://gist.github.com/zziuni/3741933
const stunUrls = [
	'stun.l.google.com:19302',
	'stun1.l.google.com:19302',
	'stun2.l.google.com:19302',
	'stun3.l.google.com:19302',
	'stun4.l.google.com:19302',
	// 'stun01.sipphone.com',
	// 'stun.ekiga.net',
	// 'stun.fwdnet.net',
	// 'stun.ideasip.com',
	// 'stun.iptel.org',
	// 'stun.rixtelecom.se',
	// 'stun.schlund.de',
	// 'stunserver.org',
	// 'stun.softjoys.com',
	// 'stun.voiparound.com',
	// 'stun.voipbuster.com',
	// 'stun.voipstunt.com',
	// 'stun.voxgratia.org',
	// 'stun.xten.com'
]

const peerConnection = new RTCPeerConnection({
	iceServers: stunUrls.map(url => ({ urls: [`stun:${url}`] }))
})

peerConnection.oniceconnectionstatechange = () => {
	debug(`[connection] ICE connection state changed to ${peerConnection.iceConnectionState}`)
	if (['failed', 'disconnected'].includes(peerConnection.iceConnectionState)) {
		playOnlineButton.innerText = 'disconnected'
		online = false
		endGame()
		loadGame()
	}
}

function goOnline() {
	online = true
	playOnlineButton.innerText = 'connected'
	// force stop current game
	endGame()

	loadGame()
	if (client) game.scene.becomePassive()
}

function createConnection() {
	let description

	peerConnection.onicecandidate = (event) => {
		if (event.candidate) return
		description = peerConnection.localDescription
		playOnlineButton.removeAttribute('hidden')

		playOnlineButton.onclick = async () => {
			const path = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
			await navigator.clipboard.writeText(`${path}?join=${btoa(JSON.stringify(description))}`)
			playOnlineButton.innerText = 'invitation copied to clipboard'
			playOnlineButton.disabled = true
			setTimeout(() => {
				responseField.removeAttribute('hidden')
			}, 2000)
		}
	}

	const createOfferSDP = async () => {
		dataChannel = peerConnection.createDataChannel("chat")
		const description = await peerConnection.createOffer()
		peerConnection.setLocalDescription(description)

		dataChannel.onopen = goOnline
		dataChannel.onmessage = ({data}) => {
			if (data == null) return

			data = JSON.parse(data)
			debug(`[channel] new message of type '${data.type}'`, data)
			switch (data.type) {
				case RESTART_GAME_EVENT:
					startGame()
					break
				case RELOAD_GAME_EVENT:
					loadGame()
				  startGame()
					break
				case CHANGE_DIRECTION_EVENT:
					if (Object.values(controls).includes(data.direction)) game.snakes[1].nextDirection = data.direction
					break
				default:
					error(`[channel] message unhandled, type was '${data.type}'.`, data)
			}
		}
	}

	responseField.addEventListener('focus', async () => {
		try {
			const data = await navigator.clipboard.readText()
			responseField.innerText = data
			startConnection(data)
			responseField.setAttribute('hidden', 'hidden')
		} catch (e) {
			responseField.placeholder = 'please paste data manually'
		}
	})

	responseField.addEventListener('paste', (e) => {
		const clipboardData = e.clipboardData || window.clipboardData
		const pastedData = clipboardData.getData('Text')
		startConnection(pastedData)
		responseField.setAttribute('hidden', 'hidden')
	})

	function startConnection(data) {
		const remoteDescription = new RTCSessionDescription(JSON.parse(atob(data)))
		peerConnection.setRemoteDescription(remoteDescription)
	}
	createOfferSDP()
}

function joinConnection(jsonDescription) {
	const sdpConstraints = { optional: [{RtpDataChannels: true}]  }
	let description
	peerConnection.ondatachannel = function(e) {
		dataChannel = e.channel
		dataChannel.onopen = goOnline

		dataChannel.onmessage = ({data}) => {
			if (data == null) return

			data = JSON.parse(data)

			debug(`[channel] new message of type '${data.type}'`, data)
			switch (data.type) {
				case ALLOW_RESTART_EVENT:
					allowRestart()
					break
				case REDRAW_EVENT:
					game.scene.redraw(data.deleted, data.added)
					break
				case RESET_BOARD_EVENT:
					game.scene.clear()
					break
				case RESTART_GAME_EVENT:
					startGame()
					break
				case RELOAD_GAME_EVENT:
					loadGame()
					dataChannel.send(JSON.stringify({
						type: RESTART_GAME_EVENT
					}))
					break
				case UPDATE_SCORE_EVENT:
					updateScore(data.snakeSize)
					break
				default:
					error(`[channel] Message unhandled, type was '${data.type}'.`, data)
			}
		}
	}

	peerConnection.onicecandidate = function(e) {
		if (e.candidate) return
		playOnlineButton.removeAttribute('hidden')
		playOnlineButton.innerText = 'click here to copy response'
		playOnlineButton.onclick = async () => {
			await navigator.clipboard.writeText(btoa(JSON.stringify(description)))
			playOnlineButton.innerText = 'response copied to clipboard'
			playOnlineButton.disabled = true
		}
	}

	function createAnswerSDP() {
		const offerDesc = new RTCSessionDescription(jsonDescription)
		peerConnection.setRemoteDescription(offerDesc)
		peerConnection.createAnswer(function (answerDesc) {
			  description = answerDesc
				peerConnection.setLocalDescription(answerDesc)
			}, function () {error("Couldn't create offer")},
			sdpConstraints)
	}

	createAnswerSDP()
}

function handleSceneUpdate(deleted, added) {
	if (online && host) {
		dataChannel.send(JSON.stringify({
			type: REDRAW_EVENT,
			deleted,
			added
		}))
	}
}

const updateScore = (snakeSize) => {
	if (online && host) {
		dataChannel.send(JSON.stringify({
			type: UPDATE_SCORE_EVENT,
			snakeSize
		}))
	}
	const score = snakeSize - 10
	if (score > bestScore) {
		bestScore = score
		bestScoreContainer.innerText = score.toString()
		localStorage.setItem('editmetohavethebestscoreever', score.toString())
	}
	scoreContainer.innerText = score.toString()
}


const loadGame = () => {
	if (gameLoaded) return false

	gameLoaded = true
	scoreContainer.innerText = '0'
	game.scene && game.scene.clear()

	if (online && client) return true

	game.scene = null
	if (online) {
		game.snakes = [
			new Snake(HOST_SNAKE_CONFIG),
			new Snake(CLIENT_SNAKE_CONFIG)
		]
		dataChannel.send(JSON.stringify({
			type: RESET_BOARD_EVENT
		}))
	} else {
		game.snakes = [
			new Snake(host ? HOST_SNAKE_CONFIG : CLIENT_SNAKE_CONFIG)
		]
	}

	game.scene = new Scene(canvas, game.snakes, { onRedraw: handleSceneUpdate })
}

const startGame = () => {
	if (currentGame) return

	restartButton.setAttribute('hidden', 'hidden')
	currentGame = true
	if (!online) game.scene.start()
	if (online && host) {
		game.scene.start()
		dataChannel.send(JSON.stringify({
			type: RESTART_GAME_EVENT
		}))
	}
}

const endGame = () => {
	game.scene.stop()
	currentGame = false
	gameLoaded = false
	restartButton.removeAttribute('hidden')

}

const allowRestart = () => {
	if (!currentGame) return

	if (online && host) {
		dataChannel.send(JSON.stringify({
			type: ALLOW_RESTART_EVENT
		}))
	}

	endGame()
}

const HOST_SNAKE_CONFIG = { size: 10, headY: 1, onSizeUpdate: updateScore, color: 'steelblue', onDie: allowRestart }
const CLIENT_SNAKE_CONFIG = { size: 10, headY: 38, onSizeUpdate: updateScore, onDie: allowRestart, color: 'brown' }

const setEventListeners = () => {
	window.addEventListener('keydown', (event) => {
		if (online && client) {
			if (currentGame && controls[event.key] !== undefined) {
				dataChannel.send(JSON.stringify({
					type: CHANGE_DIRECTION_EVENT,
					direction: controls[event.key]
				}))
			} else if (event.key === ' ') {
				dataChannel.send(JSON.stringify({
					type: RELOAD_GAME_EVENT
				}))
				loadGame()
			}
		} else if (currentGame && controls[event.key] !== undefined) {
			if (game.snakes[0]) {
				game.snakes[0].nextDirection = controls[event.key]
			}
		} else if (event.key === ' ') {
			loadGame()
			startGame()
		}
	}, false)

	restartButton.addEventListener('click', () => {
		loadGame()
		if (online && client) {
			dataChannel.send(JSON.stringify({
				type: RELOAD_GAME_EVENT
			}))
		} else {
			startGame()
		}
	})
}

setEventListeners()

if (host) {
	createConnection()
} else {
	joinConnection(JSON.parse(atob(joinDescription)))
}

console.log('🔧 Update `controls` to change keyboard mapping (do not use space)')
loadGame()

