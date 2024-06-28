import { createNoise2D } from 'simplex-noise'
import { MathUtils } from 'three'

export default class AIController {
	constructor(paddle, target) {
		this.paddle = paddle
		this.target = target

		this.noise2D = createNoise2D() //initialize
		this.time = 0
	}

	update(dt) {
		let x = this.target.mesh.position.x

		this.time += dt
		
		const dx = this.noise2D(this.time * 0.5, 1) * 5.5

		let desiredX  = MathUtils.lerp(this.paddle.mesh.position.x, x + dx, 0.4)

		this.paddle.setX(desiredX )
	}
}
