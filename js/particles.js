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

const particles = [];
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

function initParticle(colorName, position, amount) {
	for (let i = 0; i < amount; i++) {
		particles.push({
			color: colors.filter(color => { return color.name == colorName })[0].color,
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
			}
		});
	}
}

render = () => {
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.filter = "brightness(95%)";

	particles.forEach((particle, index) => {
		const width = (particle.dimensions.x * particle.scale.x);
		const height = (particle.dimensions.y * particle.scale.y);

		// Move canvas to position and rotate
		context.translate(particle.position.x, particle.position.y);
		context.rotate(particle.rotation);

		// Apply forces to velocity
		particle.velocity.y = Math.min(particle.velocity.y + gravity, terminalVelocity);
		
		// Set position
		particle.position.x += particle.velocity.x;
		particle.position.y += particle.velocity.y;
		
		// Delete confetti when out of frame
		if (particle.position.y >= canvas.height) 
			particles.splice(index, 1);

		// Loop particle x position
		if (particle.position.x > canvas.width) 
			particle.position.x = 0;
		if (particle.position.x < 0) 
			particle.position.x = canvas.width;

		// Spin particle by scaling y
		context.fillStyle = particle.color;
		
		// Draw particle
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