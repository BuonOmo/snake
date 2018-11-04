import SceneObject from './scene-object.js'

export default class Fruit extends SceneObject {
	constructor(position, { isCritical = Math.random() > 0.9,
		                      color = isCritical ? 'cornflowerblue' : 'black',
		                      value = isCritical ? 20 : 5 } = {}) {
		super([position], color)
		this.value = value
		this.isEatable = true
	}
}