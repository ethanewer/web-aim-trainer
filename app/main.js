import * as THREE from "three";

const SENSITIVITY = 0.000481;
const NUM_TARGETS = 8;
const TARGET_RADIUS = 0.005;
const SPEED = 0.0005;

var inGame = false;

let timeLeft = 60;
let score = 0;
let scores = [];

function updateTimer() {
	if (timeLeft > 0) {
		timeLeft--;
		setTimeout(updateTimer, 1000);
	} else {
		console.log("timer done, score:", score);
		endGame();
	}
}

function startGame() {
	inGame = true;
	document.body.requestPointerLock();
	menu.style.display = "none";
	timeLeft = 60;
	score = 0;
	updateTimer();
	animate();
}

function endGame() {
	if (!inGame) {
		return;
	}
	inGame = false;
	scores.push(score);
	scores.sort();
	document.exitPointerLock();
	menu.style.display = "flex";

	const leaderboardTable = document.getElementById("leaderboardTable");
	const leaderboardBody = leaderboardTable.getElementsByTagName("tbody")[0];
	leaderboardBody.innerHTML = "";
	for (let i = 0; i < scores.length; i++) {
		const row = leaderboardBody.insertRow(i);
		const scoreCell = row.insertCell(0);
		scoreCell.innerHTML = scores[i];
	}
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(71, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0.25);
camera.rotation.order = "YXZ";

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.BackSide });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.75);
pointLight.position.set(0, 0.25, 0.125);
scene.add(pointLight);

const targets = new Array(NUM_TARGETS);
const targetDirection = new Array(NUM_TARGETS);

const sphereGeometry = new THREE.SphereGeometry(TARGET_RADIUS, 16, 16);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });

function isValidTargetPosition(i) {
	let y1 = targets[i].position.y;
	for (let k = 0; k < NUM_TARGETS; k++) {
		if (!targets[k] || k == i) {
			continue;
		}
		let y2 = targets[k].position.y;
		if (Math.abs( y1 - y2) < 3 * TARGET_RADIUS) {
			return false;
		}
	}
	return true;
}

function respawnTarget(i) {
	if (!targets[i]) {
		return;
	}
	for (let iter = 0; iter < 100; iter++) {
		targets[i].position.x = 2 * (0.5 - TARGET_RADIUS) * (Math.random() - 0.5);
		targets[i].position.y = 2 * (0.5 - TARGET_RADIUS) * (Math.random() - 0.5);
		targets[i].position.z = TARGET_RADIUS - 0.3 - 0.2 * Math.random();
		if (isValidTargetPosition(i)) {
			break;
		}
	}
	targetDirection[i] = Math.random() < 0.5 ? -1 : 1;
}

function moveTargets() {
	for (let i = 0; i < NUM_TARGETS; i++) {
		targets[i].position.x += SPEED * targetDirection[i];
		if (Math.abs(targets[i].position.x) >= 0.5 - TARGET_RADIUS) {
			targetDirection[i] *= -1;
		}
	}
}

for (let i = 0; i < NUM_TARGETS; i++) {
	targets[i] = new THREE.Mesh(sphereGeometry, sphereMaterial);
	targetDirection[i] = Math.random() < 0.5 ? -1 : 1;
	respawnTarget(i);
	scene.add(targets[i]);
}

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

document.body.addEventListener("mousemove", (event) => {
	if (inGame && document.pointerLockElement === document.body) {
		camera.rotation.y -= event.movementX * SENSITIVITY;
		camera.rotation.x -= event.movementY * SENSITIVITY;
		camera.rotation.x = Math.min(Math.max(camera.rotation.x, -1.57), 1.57);
	}
});

let mouseClicked = false;

window.addEventListener("mousedown", () => {
	if (inGame) {
		mouseClicked = true;
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" || event.key === "Esc") endGame();
});

document.getElementById("startButton").addEventListener("click", startGame);

function animate() {
	if (inGame) {
		moveTargets();
		requestAnimationFrame(animate);
	}

	if (mouseClicked) {
		let theta = camera.rotation.y, phi = camera.rotation.x;
		for (let i = 0; i < NUM_TARGETS; i++) {
			let tx = targets[i].position.x - camera.position.x;
			let ty = targets[i].position.y - camera.position.y;
			let tz = targets[i].position.z - camera.position.z;
			let r = Math.sqrt(tx * tx + ty * ty + tz * tz);
			let cx = -r * Math.sin(theta) * Math.cos(phi);
			let cy = r * Math.sin(phi);
			let cz = -r * Math.cos(theta) * Math.cos(phi);
			let d = Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2 + (tz - cz) ** 2);
			if (d <= TARGET_RADIUS) {
				respawnTarget(i);
				score++;
			}
		}
		mouseClicked = false;
	}

	renderer.render(scene, camera);
}

animate();
