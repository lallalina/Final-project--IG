import './style.css'
import * as THREE from 'three'
import Ball from './src/Ball'
import Paddle from './src/Paddle'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry'
import AIController from './src/AIController'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import srcFont from 'three/examples/fonts/helvetiker_bold.typeface.json?url'
import lights from './src/lights.js'

//Base-Mode
const params = {
	planeColor: '#1E90FF', 
	fogColor: '#E0FFFF',
	fogNear: 25,
	fogFar: 150,
	paddleColor: 0x3633ff,
	ballColor: 0xe63d05,
}

//Dark-Mode
const darkModeParams = {
	planeColor: '#708090', 
	fogColor: '#3A3A3A',
	fogNear: 25,
	fogFar: 150,
	paddleColor:'#FF1493',
	ballColor: '#00FF00',
}

let isDarkMode = false 

function toggleDarkMode() {
    isDarkMode = !isDarkMode
    const modeParams = isDarkMode ? darkModeParams : params

    scene.background.set(modeParams.fogColor)
    scene.fog.color.set(modeParams.fogColor)
    plane.material.color.set(modeParams.planeColor)
    playerPaddle.material.color.set(modeParams.paddleColor)
    pcPaddle.material.color.set(modeParams.paddleColor)
    ball.material.color.set(modeParams.ballColor)

    pcScoreMesh.material.color.set(modeParams.ballColor)
    playerScoreMesh.material.color.set(modeParams.ballColor)
}

//Dark-Mode
document.addEventListener('DOMContentLoaded', function () {
	const darkModeButton = document.getElementById('darkModeButton');

		darkModeButton.addEventListener('click', function () {
	toggleDarkMode();
		});
});

//Score
const score = {
	pc: 0,
	player: 0,
}

let pcScoreMesh, playerScoreMesh, loadedFont

const TEXT_PARAMS = {
	size: 3,
	height: 0.5,
	curveSegments: 12,
	bevelEnabled: true,
	bevelThickness: 0.1,
	bevelSize: 0.05,
	bevelOffset: 0,
	bevelSegments: 5,
}
const scoreMaterial = new THREE.MeshStandardMaterial({
	color: params.ballColor,
})

const fontLoader = new FontLoader()
fontLoader.load(srcFont, function (font) {
	loadedFont = font
	const geometry = new TextGeometry('0', {
		font: font,
		...TEXT_PARAMS,
	})

	geometry.center()

	pcScoreMesh = new THREE.Mesh(geometry, scoreMaterial)
	playerScoreMesh = pcScoreMesh.clone()
	
	//pc score dimensions and positions
	pcScoreMesh.scale.setScalar(1.5)
	pcScoreMesh.position.set(0, 2, -boundaries.y - 4)
	playerScoreMesh.position.set(0, 2, boundaries.y + 4)

	pcScoreMesh.castShadow = true
	playerScoreMesh.castShadow = true

	scene.add(pcScoreMesh, playerScoreMesh)
})

function getScoreGeometry(score) {
	const geometry = new TextGeometry(`${score}`, {
		font: loadedFont,
		...TEXT_PARAMS,
	})

	geometry.center()

	return geometry
}

//Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(params.fogColor)
scene.fog = new THREE.Fog(params.fogColor, params.fogNear, params.fogFar)

scene.add(...lights)

//Plane
const boundaries = new THREE.Vector2(18, 23)
const planeGeometry = new THREE.PlaneGeometry(
	boundaries.x * 20,
	boundaries.y * 20
)
planeGeometry.rotateX(-Math.PI * 0.5)
const planeMaterial = new THREE.MeshStandardMaterial({
	color: params.planeColor,

})

const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.position.y = -1.5
plane.receiveShadow = true
scene.add(plane)

//Bound
const boundGeometry = new RoundedBoxGeometry(1, 2, boundaries.y * 2, 5, 0.5)
const boundMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd })
const leftBound = new THREE.Mesh(boundGeometry, boundMaterial)
leftBound.position.x = -boundaries.x - 0.5
const rightBound = leftBound.clone()
rightBound.position.x *= -1

leftBound.castShadow = true
rightBound.receiveShadow = true
rightBound.castShadow = true

scene.add(leftBound, rightBound)

//Elements
const playerPaddle = new Paddle(scene, boundaries, new THREE.Vector3(0, 0, 15))
const pcPaddle = new Paddle(scene, boundaries, new THREE.Vector3(0, 0, -15))
const ball = new Ball(scene, boundaries, [playerPaddle, pcPaddle])
ball.material.color.set(params.ballColor)
pcPaddle.material.color.set(params.paddleColor)

//Goal
ball.addEventListener('ongoal', (e) => {
    score[e.message] += 1;

    const geometry = getScoreGeometry(score[e.message]);
    const mesh = e.message === 'pc' ? pcScoreMesh : playerScoreMesh;
    mesh.geometry = geometry;
    mesh.geometry.getAttribute('position').needsUpdate = true;

	goalSound.play();

    // Check if the game should end
    if (score.pc === 5) {
        displayGameOver('YOU LOST!');
    } else if (score.player === 5) {
        displayGameOver('YOU WIN!');
    }	
});


function displayGameOver(message) {
    const geometry = new TextGeometry(message, {
        font: loadedFont,
        ...TEXT_PARAMS,
    });
    geometry.center();

    const gameOverMesh = new THREE.Mesh(geometry, scoreMaterial);
    gameOverMesh.position.y = 5; 
    gameOverMesh.name = 'gameOverMesh';
    scene.add(gameOverMesh);

    setTimeout(restartGame, 2000);

}

//Options
document.addEventListener('DOMContentLoaded', () => {
	const optionsButton = document.getElementById('option-button');
	const optionsDialog = document.getElementById('options');
	const closeOptionsButton = document.getElementById('closeOptions');

	optionsButton.addEventListener('click', () => {
		// function to pause the game 
		ball.isPaused = true;
		playerPaddle.isPaused = true;
		optionsDialog.showModal();
	});

	closeOptionsButton.addEventListener('click', () => {
		// function to restart the game
		ball.isPaused = false;
		playerPaddle.isPaused = false;
		optionsDialog.close();
	});
});

function restartGame() {
	score.pc = 0
    score.player = 0

    //Remove game-over
    const gameOverMesh = scene.getObjectByName('gameOverMesh');
    if (gameOverMesh) {
        scene.remove(gameOverMesh);
    }

    // Reset 0 
    const pcGeometry = getScoreGeometry(0);
    const playerGeometry = getScoreGeometry(0);
    if (pcGeometry && playerGeometry) {
        pcScoreMesh.geometry = pcGeometry;
        playerScoreMesh.geometry = playerGeometry;
    } else {
        console.error('Unable to get score geometry');
    }

    // Update view score
    pcScoreMesh.geometry.attributes.position.needsUpdate = true;
    playerScoreMesh.geometry.attributes.position.needsUpdate = true;

    // Restart rendering of the game
    requestAnimationFrame(tic);
}


const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

//Camera
const fov = 60;
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1);
camera.position.set(0, 20, 45);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Normal view position and lookAt
const normalPosition = new THREE.Vector3(0, 20, 45);
const normalLookAt = new THREE.Vector3(0, 0, 0);

// Top view position and lookAt
const topViewPosition = new THREE.Vector3(0, 40, 40);
const topViewLookAt = new THREE.Vector3(0, 0, 0);

let isTopView = false;

document.getElementById('cameraButton').addEventListener('click', () => {
    if (isTopView) {
        // Switch to normal view
        camera.position.copy(normalPosition);
        camera.lookAt(normalLookAt);
    } else {
        // Switch to top view
        camera.position.copy(topViewPosition);
        camera.lookAt(topViewLookAt);
    }
    isTopView = !isTopView;
});

//renderer
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
})
document.body.appendChild(renderer.domElement)
handleResize()

renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.shadowMap.type = THREE.VSMShadowMap


const cursor = new THREE.Vector2(0, 0)
const raycaster = new THREE.Raycaster()
const controller = new AIController(pcPaddle, ball)

//Three js Clock
const clock = new THREE.Clock()

//frame loop
function tic() {

	const deltaTime = clock.getDelta()

	//interactions with coursor
	raycaster.setFromCamera(cursor, camera)
	const [intersection] = raycaster.intersectObject(plane)

	const dt = deltaTime / 10

	//player paddle movement
	for (let i = 0; i < 10; i++) {
		if (intersection) {
			const nextX = intersection.point.x
			const prevX = playerPaddle.mesh.position.x
			playerPaddle.setX(THREE.MathUtils.lerp(prevX, nextX, 0.02))
		}

		ball.update(dt)
		controller.update(dt)

	}

	renderer.render(scene, camera)

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('mousemove', function (e) {
	cursor.x = 2 * (e.clientX / window.innerWidth) - 1
	cursor.y = -2 * (e.clientY / window.innerHeight) + 1	
})

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}
