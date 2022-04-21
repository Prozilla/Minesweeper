const root = document.querySelector(":root");
const header = document.querySelector("header");
const grid = document.querySelector("#grid");
const flagCounter = document.querySelector("#flag-counter p");
const timer = document.querySelector("#timer p");
const difficultyDropdown = document.querySelector("#difficulty select");

let size;
let bombCount;
let bombs;
let timerInterval;
let gameOver;

function getTileNumber(xPos, yPos) {
	let bombsNearTile = 0;

	for (let x = 0; x < 3; x++) {
		for (let y = 0; y < 3; y++) {
			if (hasBomb(xPos + x - 1, yPos + y - 1))
				bombsNearTile++;
		}
	}

	return bombsNearTile;
}

function processTileClick(tile, isRightClick) {
	if (gameOver || tile.classList.contains("dug"))
		return;

	const x = parseInt(tile.getAttribute("data-x"));
	const y = parseInt(tile.getAttribute("data-y"));

	if (tile.classList.contains("flag"))
		return tile.classList.remove("flag");

	if (isRightClick) {
		tile.classList.add("flag");
	} else {
		tile.classList.add("dug");

		if (hasBomb(x, y)) {
			tile.classList.add("bomb");
			endGame();
		} else {
			const bombsNearTile = getTileNumber(x, y);

			if (bombsNearTile > 0)
				tile.textContent = bombsNearTile;
		}
	}
}

function hasBomb(x, y) {
	return bombs.some(bomb => bomb.x == x && bomb.y == y);
}

function startTimer() {
	const start = Date.now();

	clearInterval(timerInterval);
	timerInterval = setInterval(() => {
		const delta = Date.now() - start;
		const seconds = Math.floor(delta / 1000);
		const time = seconds < 10 ? "00" + seconds : seconds < 100 ? "0" + seconds : seconds < 1000 ? seconds : 999; 

		timer.textContent = time;
	}, 100);
}

function startGame(difficulty) {
	size = (parseInt(difficulty) + 1) * 9;
	bombCount = size;
	bombs = [];
	gameOver = false;

	// GRID
	grid.style.gridTemplateColumns = "1fr ".repeat(size);
	grid.innerHTML = null;
	
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const tile = document.createElement("div");

			tile.classList.add("tile");
			tile.setAttribute("data-x", x);
			tile.setAttribute("data-y", y);

			tile.addEventListener("click", function(event) {
				processTileClick(event.target, false);
			});

			tile.addEventListener("contextmenu", function(event) {
				event.preventDefault();
				processTileClick(event.target, true);
			})

			const oddX = x % 2 != 0;
			const oddY = y % 2 != 0;

			if (oddX == oddY)
				tile.classList.add("odd");

			grid.appendChild(tile);
		}
	}

	// BOMBS
	flagCounter.textContent = bombCount;

	for (let i = 0; i < bombCount; i++) {
		let x;
		let y;

		do {
			x = Math.floor(Math.random() * size);
			y = Math.floor(Math.random() * size);
		} while(hasBomb(x, y))

		bombs.push({x: x, y: y});
	}

	startTimer();
}

function endGame() {
	gameOver = true;
	clearInterval(timerInterval);
}

function setFontSize() {
	const fontSize = grid.firstElementChild.getBoundingClientRect().width / 3;
	grid.style.setProperty("--icon-size", fontSize + "px");
}

function resizeGrid() {
	const headerHeight = header.getBoundingClientRect().height;
	const margin = parseInt(getComputedStyle(root).getPropertyValue("--grid-margin").slice(0, -2));

	const horizontalSpace = window.innerWidth - margin * 2;
	const verticalSpace = window.innerHeight - headerHeight - margin;

	let width = horizontalSpace;
	let height = verticalSpace;

	if (horizontalSpace > verticalSpace)
	{
		width = verticalSpace;
	} else {
		height = horizontalSpace;
	}

	grid.style.width = width + "px";
	grid.style.height = height + "px";

	setFontSize();
}

function setUp() {
	startGame(difficultyDropdown.value);

	resizeGrid();
	window.addEventListener("resize", function(event) {
		resizeGrid();
	});
}

setUp();