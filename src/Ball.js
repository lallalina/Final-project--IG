import {
	EventDispatcher,
	Mesh,
	MeshStandardMaterial,
	Raycaster,
	SphereGeometry,
	Vector3,
} from 'three'

export default class Ball extends EventDispatcher {
	speed = 15
	//initial direction of ball movement
	velocity = new Vector3(1, 0, 0.5)

	constructor(scene, boundaries, paddles) {
		super()

		this.scene = scene
		this.paddles = paddles
		this.boundaries = boundaries
		this.radius = 0.5
		this.geometry = new SphereGeometry(this.radius)
		this.material = new MeshStandardMaterial({ color: 0xffaa00 })
		this.mesh = new Mesh(this.geometry, this.material)
		this.mesh.castShadow = true
		this.mesh.receiveShadow = true

		//speed is scaled by the initial speed
		this.velocity.multiplyScalar(this.speed)

		this.scene.add(this.mesh)

		this.raycaster = new Raycaster()
		this.raycaster.near = 0 //min distance start intersecated
		this.raycaster.far = this.boundaries.y * 2.5 //lenght

		this.isPaused = false;
	}

	resetVelocity() {
		this.speed = 15
		this.velocity.z *= -1
		this.velocity.normalize().multiplyScalar(this.speed)
	}

	update(dt) {
		if (this.isPaused) {
			return;
		}

		const s = this.velocity.clone().multiplyScalar(dt)
		const tPos = this.mesh.position.clone().add(s)

		const dx = this.boundaries.x - this.radius - Math.abs(this.mesh.position.x)
		const dz = this.boundaries.y - this.radius - Math.abs(this.mesh.position.z)

		//Collision with boundaries
		if (dx <= 0) {
			tPos.x =
			//Max
				(this.boundaries.x - this.radius + dx) * Math.sign(this.mesh.position.x)

			this.velocity.x *= -1

			hitSound.play();

		}

		//Goal detection
		if (dz < 0) {
			const z = this.mesh.position.z
			const message = z > 0 ? 'pc' : 'player'
			this.dispatchEvent({ type: 'ongoal', message: message })

			tPos.set(0, 0, 0)

			this.resetVelocity()
		}

		// collision Paddle
		const paddle = this.paddles.find((paddle) => {
			//paddle of diretion of the ball
			return Math.sign(paddle.mesh.position.z) === Math.sign(this.velocity.z)
		})

		const dir = this.velocity.clone().normalize()
		//detect collisions in the direction of movement
		this.raycaster.set(this.mesh.position, dir)
		const [intersection] = this.raycaster.intersectObjects(paddle.mesh.children)

		if (intersection) {
			//Ball and paddel near ?
			if (intersection.distance < s.length()) {

				tPos.copy(intersection.point)
				//distance after intersaction
				const d = s.length() - intersection.distance

				const normal = intersection.normal
				normal.y = 0
				normal.normalize()
				this.velocity.reflect(normal)

				//movement after intersaction
				const dS = this.velocity.clone().normalize().multiplyScalar(d)
				tPos.add(dS)

				this.speed *= 1.05
				this.velocity.normalize().multiplyScalar(this.speed)

				hitSound.play();
			}
		}
		this.mesh.position.copy(tPos)
	}
}
