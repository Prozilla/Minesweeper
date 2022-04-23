const header = document.querySelector("header");
const grid = document.querySelector("#grid");
const flagCounter = document.querySelector("#flag-counter p");
const timer = document.querySelector("#timer p");
const difficultyDropdown = document.querySelector("#difficulty select");

let size;
let tileScale;
let tileCount;
let revealedTileCount;
let bombCount;
let bombs;
let flagCount;
let correctFlagsCount;
let timerInterval;
let gameOver;
let checkedTiles;
let holdCompleted = false;
let holdTimeout;
let generatedBombs = false;

const tileRevealDelay = 100;
const flagHoldDuration = 250;

//#region TILES

function generateBombs(xPos, yPos) {
	generatedBombs = true;

	for (let i = 0; i < bombCount; i++) {
		let x;
		let y;

		do {
			x = Math.floor(Math.random() * size);
			y = Math.floor(Math.random() * size);
		} while(hasBomb(x, y) || (x >= xPos - 1 && x <= xPos + 1) || (y >= yPos - 1 && y <= yPos + 1));

		bombs.push({x: x, y: y});
	}
}

function getTileNumber(xPos, yPos) {
	let bombsNearTile = 0;

	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			const x = xPos + i - 1;
			const y = yPos + j - 1;
			
			if (hasBomb(x, y))
				bombsNearTile++;
		}
	}

	return bombsNearTile;
}

function getTileCoordinate(tile) {
	const x = parseInt(tile.getAttribute("data-x"));
	const y = parseInt(tile.getAttribute("data-y"));

	return {x, y};
}

function revealTileInArea(tile, x, y, depth) {
	if (!tile.classList.contains("flag"))
		revealTile(tile);

	checkedTiles.push(tile);

	if (getTileNumber(x, y) == 0)
		revealArea(x, y, depth + 1);
}

function revealArea(xPos, yPos, depth) {
	if (getTileNumber(xPos, yPos) == 0) {
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				const x = xPos + i - 1;
				const y = yPos + j - 1;

				const tile = grid.children[x + size * y];
				if (x >= 0 && x < size && y >= 0 && y < size && !checkedTiles.includes(tile)) {
					let delay = tileRevealDelay * size / 10;
					delay = delay - ((delay / 20) / (size / 10) * (depth * depth))  - (Math.random() * delay / 10);

					if (delay <= 0) {
						revealTileInArea(tile, x, y, depth);
					} else {
						setTimeout(() => {
							revealTileInArea(tile, x, y, depth);
						}, delay);
					}
				}
				
			}
		}
	}
}

function initTileParticles(tile, colors, min, max) {
	const rect = tile.getBoundingClientRect();
	for (let i = 0; i < randomRangeInt(min, max); i++) {
		const color = colors[Math.floor(Math.random() * colors.length)];
		initParticle(color, {x: randomRange(rect.left, rect.right), y: randomRange(rect.top, rect.bottom)}, 1);
	}
}

function toggleFlag(tile, add) {
	const {x, y} = getTileCoordinate(tile);

	if (add && flagCount > 0) {
		tile.classList.add("flag");
		flagCount--;

		// Particles
		initTileParticles(tile, ["red"], 1, 2);

		if (hasBomb(x, y)) {
			correctFlagsCount++;

			if (correctFlagsCount == bombCount)
				endGame(true);
		}
	} else if (!add) {
		tile.classList.remove("flag");
		flagCount++;

		if (hasBomb(x, y))
			correctFlagsCount--;
	}

	flagCounter.textContent = flagCount;
}

function revealTile(tile, isRightClick, area) {
	if (gameOver || tile.classList.contains("dug"))
		return;

	const {x, y} = getTileCoordinate(tile);

	if (!generatedBombs)
		generateBombs(x, y);

	if (tile.classList.contains("flag"))
		return toggleFlag(tile, false);

	if (isRightClick) {
		toggleFlag(tile, true);
	} else {
		tile.classList.add("dug");
		revealedTileCount++;

		// Particles
		initTileParticles(tile, ["sand-a", "sand-b"], 0, 2);

		if (hasBomb(x, y)) {
			tile.classList.add("bomb");
			endGame(false);
		} else {
			const bombsNearTile = getTileNumber(x, y);

			if (bombsNearTile > 0) {
				tile.textContent = bombsNearTile;
			} else if (area) {
				checkedTiles = [];
				revealArea(x, y, 0);
			}
		}
	}
}

function revealGrid() {
	for (let i = 0; i < grid.children.length; i++) {
		revealTile(grid.children[i], false, false);
	}
}

function hasBomb(x, y) {
	return bombs.some(bomb => bomb.x == x && bomb.y == y);
}

//#endregion

//#region GAME EVENTS

function startGame(difficulty) {
	gameOver = false;
	generatedBombs = false;

	fetch("difficulties.json").then(function(result) {
		return result.json();
	}).then(function(result) {
		// GRID
		size = result[difficulty].size;
		tileCount = size * size;
		revealedTileCount = 0;

		grid.style.gridTemplateColumns = "1fr ".repeat(size);
		grid.innerHTML = null;
		
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const tile = document.createElement("div");

				tile.classList.add("tile");
				tile.setAttribute("data-x", x);
				tile.setAttribute("data-y", y);

				tile.addEventListener("mousedown", function(event) {
					mouseDown(event);
				});

				tile.addEventListener("touchstart", function(event) {
					mouseDown(event);
				});

				tile.addEventListener("mouseup", function(event) {
					mouseUp(event);
				});

				tile.addEventListener("touchend", function(event) {
					mouseUp(event);
				});

				tile.addEventListener("contextmenu", function(event) {
					event.preventDefault();
					revealTile(event.target, true)
				});

				const oddX = x % 2 != 0;
				const oddY = y % 2 != 0;

				if (oddX == oddY)
					tile.classList.add("odd");

				grid.appendChild(tile);
			}
		}

		// BOMBS
		bombCount = result[difficulty].bombs;
		bombs = [];

		// FLAGS
		flagCount = bombCount
		flagCounter.textContent = flagCount;
		correctFlagsCount = 0;

		startTimer();
		resizeGrid();
	});
}

function endGame(won) {
	// gameOver = true;
	clearInterval(timerInterval);
	console.log(won ? "won" : "lost");
}

//#endregion

//#region INPUT

function mouseDown(event) {
	event.preventDefault();

	if (event.button == 2)
		return;

	holdCompleted = false;

	holdTimeout = setTimeout(() => {
		revealTile(event.target, true);
		holdCompleted = true;
	}, flagHoldDuration);
}

function mouseUp(event) {
	event.preventDefault();

	if (event.button == 2)
		return;

	clearTimeout(holdTimeout);

	if (!holdCompleted)
		revealTile(event.target, false, true);
}

//#endregion

//#region SETUP

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

function setFontSize() {
	if (!grid.firstElementChild)
		return;

	tileScale = grid.firstElementChild.getBoundingClientRect().width;
	const fontSize = tileScale / 3;
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

//#endregion