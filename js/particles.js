const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

document.body.prepend(canvas);

const root = document.querySelector(":root");

const colors = [];
const colorNames = [
	"red",
	"yellow",
	"green",
	"blue",
	"grass-a",
	"grass-b",
	"sand-a",
	"sand-b",
];

let renderStart;
let previousRenderTimestamp;
const speedMultiplier = 0.1;
const particles = [];
const lifetime = 3000; // ms
const gravity = 0.05;
const terminalVelocity = 15;

randomRange = (min, max) => Math.random() * (max - min) + min;

randomRangeInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const velocityX = {min: -1, max: 1};
const velocityY = {min: -2, max: 0};

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function initParticle(colorName, position, amount) {
	for (let i = 0; i < amount; i++) {
		particles.push({
			color: hexToRgb(getComputedStyle(root).getPropertyValue("--" + colorName).trim()),
			dimensions: {
				x: 15 * tileScale / 65,
				y: 15 * tileScale / 65,
			},
			scale: {
				x: 1,
				y: 1,
			},
			position: {
				x: position.x,
				y: position.y
			},
			rotation: randomRange(0, 2 * Math.PI),
			velocity: {
				x: randomRange(velocityX.min, velocityX.max),
				y: randomRange(velocityY.min, velocityY.max),
			},
		});
	}
}

function initTileParticles(tile, colors, min, max) {
	const rect = tile.getBoundingClientRect();

	for (let i = 0; i < randomRangeInt(min, max); i++) {
		const color = colors[Math.floor(Math.random() * colors.length)];
		initParticle(color, {x: randomRange(rect.left, rect.right), y: randomRange(rect.top, rect.bottom)}, 1);
	}
}

function render(timestamp) {
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.filter = "contrast(75%)";

	if (!renderStart)
		renderStart = timestamp;

	const deltaTime = (timestamp - previousRenderTimestamp) * speedMultiplier;
	previousRenderTimestamp = timestamp;

	const totalTime = timestamp - renderStart;

	particles.forEach((particle, index) => {
		const width = (particle.dimensions.x * particle.scale.x);
		const height = (particle.dimensions.y * particle.scale.y);

		if (!particle.birth)
			particle.birth = totalTime;

		particle.age = totalTime - particle.birth;
		particle.opacity = 1 - particle.age / lifetime;

		// Move canvas to position and rotate
		context.translate(particle.position.x, particle.position.y);
		context.rotate(particle.rotation);

		// Apply forces to velocity
		particle.velocity.y = Math.min(particle.velocity.y + gravity * deltaTime, terminalVelocity * deltaTime);
		
		// Set position
		particle.position.x += particle.velocity.x;
		particle.position.y += particle.velocity.y;
		
		// Delete confetti when out of frame or age passed lifetime
		if (particle.position.y >= canvas.height || particle.position.x < 0 || particle.position.x >= canvas.width || particle.age > lifetime) 
			particles.splice(index, 1);
		
		// Draw particle
		context.fillStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity})`;
		context.fillRect(-width / 2, -height / 2, width, height);
		
		// Reset transform matrix
		context.setTransform(1, 0, 0, 1, 0, 0);
	});

	window.requestAnimationFrame(render);
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function setUp() {
	for (let i = 0; i < colorNames.length; i++) {
		colors.push({name: colorNames[i], color: getComputedStyle(root).getPropertyValue("--" + colorNames[i]).trim()});
	}

	resizeCanvas();
	window.addEventListener("resize", function(event) {
		resizeCanvas();
	});
	
	render();
}

setUp();