import SceneObject from './scene-object.js'

export default class Fruit extends SceneObject {
	constructor(position, value = Math.ceil(3 * Math.random())) {
		super([position])
		this.value = value
		this.isEatable = true
	}
}