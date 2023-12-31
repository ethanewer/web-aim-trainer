import * as THREE from 'three';

var inGame = false;

let timeLeft = 10, score = 0;

function updateTimer() {
	if (timeLeft > 0) {
		timeLeft--;
		setTimeout(updateTimer, 1000);
	} else {
		console.log('timer done, score:', score);
		endGame();
	}
}

function startGame() {
	inGame = true;
	document.body.requestPointerLock();
	menu.style.display = 'none';
	timeLeft = 10;
	score = 0;
	updateTimer();
	animate();
}

function endGame() {
	if (!inGame) return;
	inGame = false;
	document.exitPointerLock();
	menu.style.display = 'flex';

	let scoreData = { name: "PlayerFromJS", score: score };
	let scoreJSON = JSON.stringify(scoreData);
	fetch('/score', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: scoreJSON
	}).then(response => response.json()).then(data => {
		document.getElementById('score').textContent = `Score: ${score}, High Score: ${data['highScore']}`;
		let leaderboard = data['leaderboard']
		const leaderboardTable = document.getElementById('leaderboardTable');
		const leaderboardBody = leaderboardTable.getElementsByTagName('tbody')[0];
		leaderboardBody.innerHTML = '';
		for (let i = 0; i < leaderboard.length; i++) {
			const row = leaderboardBody.insertRow(i);
			const rankCell = row.insertCell(0);
			const nameCell = row.insertCell(1);
			const scoreCell = row.insertCell(2);
			rankCell.innerHTML = i + 1;
			nameCell.innerHTML = leaderboard[i]['name'];
			scoreCell.innerHTML = leaderboard[i]['score'];
		}
	}).catch(error => { console.error(error); });
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(71, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0.25);
camera.rotation.order = 'YXZ';

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.BackSide });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.75);
pointLight.position.set(0, 0.25, 0.125);
scene.add(pointLight);

const NUM_TARGETS = 6;
const TARGET_RADIUS = 0.025;
const targets = new Array(NUM_TARGETS);

const sphereGeometry = new THREE.SphereGeometry(TARGET_RADIUS, 16, 16);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });

for (let i = 0; i < NUM_TARGETS; i++) {
	targets[i] = new THREE.Mesh(sphereGeometry, sphereMaterial);
	targets[i].position.x = 0.9 * Math.random() - 0.45;
	targets[i].position.y = 0.9 * Math.random() - 0.45;
	targets[i].position.z = -0.475;
	scene.add(targets[i]);
}

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

document.body.addEventListener('mousemove', (event) => {
	if (inGame && document.pointerLockElement === document.body) {
		camera.rotation.y -= event.movementX / 512;
		camera.rotation.x -= event.movementY / 512;
		camera.rotation.x = Math.min(Math.max(camera.rotation.x, -1.57), 1.57);
	}
});

let mouseClicked = false;

window.addEventListener('mousedown', () => {
	if (inGame) {

		mouseClicked = true;
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' || event.key === 'Esc') endGame();
});

document.getElementById('startButton').addEventListener('click', startGame);

function animate() {
	if (inGame) requestAnimationFrame(animate);

	if (mouseClicked) {
		let theta = camera.rotation.y, phi = camera.rotation.x;
		for (let t of targets) {
			let tx = t.position.x - camera.position.x;
			let ty = t.position.y - camera.position.y;
			let tz = t.position.z - camera.position.z;
			let r = Math.sqrt(tx * tx + ty * ty + tz * tz);
			let cx = -r * Math.sin(theta) * Math.cos(phi);
			let cy = r * Math.sin(phi);
			let cz = -r * Math.cos(theta) * Math.cos(phi);
			let d = Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2 + (tz - cz) ** 2);
			if (d <= TARGET_RADIUS) {
				t.position.x = 0.9 * Math.random() - 0.45;
				t.position.y = 0.9 * Math.random() - 0.45;
				score++;
			}
		}
		mouseClicked = false;
	}

	renderer.render(scene, camera);
}

animate();