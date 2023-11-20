class Component {

	constructor(width, height, color, x, y, type) {
		this.type = type;
		this.width = width;
		this.height = height;
		this.color = color;
		this.speed_x = type === 'asteroid' ? generateRandomSpeed(x, 1, 5) : 6;
		this.speed_y = type === 'asteroid' ? -generateRandomSpeed(y, 1, 5) : 6;
		this.x = x;
		this.y = y;
	}

	update(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.fillStyle = this.color;

		ctx.fillRect(
			this.width / -2,
			this.height / -2,
			this.width,
			this.height
		);

		ctx.restore();
	}

	newPos(gameArea, event) {
		const canvasWidth = gameArea.context.canvas.width;
		const canvasHeight = gameArea.context.canvas.height;

		if (this.type === 'asteroid') {
			if (this.x - this.width / 2 < 0) this.speed_x = Math.abs(this.speed_x);
			else if (this.x + this.width / 2 >= canvasWidth)
				this.speed_x = -this.speed_x;

			if (this.y - this.height / 2 < 0) this.speed_y = -this.speed_y;
			else if (this.y + this.height / 2 >= canvasHeight)
				this.speed_y = Math.abs(this.speed_y);

		} else if (this.type === 'player' && event) {
			const playerSpeed = 6;

			// check which key was pressed (use arrow keys or wasd keys to move)
			switch (event.keyCode) {
				// move left
				case 37:
				case 65:
					this.speed_x = -playerSpeed;
					this.speed_y = 0;
					break;
				// move up
				case 38:
				case 87:
					this.speed_x = 0;
					this.speed_y = playerSpeed;
					break;
				// move right
				case 39:
				case 68:
					this.speed_x = playerSpeed;
					this.speed_y = 0;
					break;
				// move down
				case 40:
				case 83:
					this.speed_x = 0;
					this.speed_y = -playerSpeed;
					break;
			}

			if (this.x - this.width / 2 + this.speed_x < 0 && this.speed_x < 0) {
				this.x = this.width / 2;
				return;
			} else if (this.x + this.width / 2 + this.speed_x >= canvasWidth && this.speed_x > 0) {
				this.x = canvasWidth - this.width / 2;
				return;
			} else if (this.y - this.height / 2 - this.speed_y < 0 && this.speed_y > 0) {
				this.y = this.height / 2;
				return;
			} else if (this.y + this.height / 2 - this.speed_y >= canvasHeight && this.speed_y < 0) {
				this.y = canvasHeight - this.height / 2;
				return;
			}
			
			

		} else {
			return;
		}

		this.x += this.speed_x;
		this.y -= this.speed_y;
	}

}

class GameArea {

	constructor(widht, height) {
		this.canvas = document.getElementById('gameCanvas');
		this.timeDisplay = document.getElementById('timerDisplay');
		this.canvas.width = widht;
		this.canvas.height = height;
		this.context = this.canvas.getContext('2d');
		this.gameRunning = false;
		this.startTime = null;
		this.finalTime = null;
	}

	/**
	 * Setup and start the new game on this game area. 
	 */
	start() {
		window.addEventListener('keydown', updatePlayerPosition);

		this.frameNo = 0;
		this.gameRunning = true;
		this.refreshInterval = setInterval(updateGameArea, 20);

		this.startTime = Date.now();
		// this reference is lost in setInterval, so binding to this reference is necesssary
		this.timer = setInterval(this.updateTimeDisplay.bind(this), 1);
	}

	/**
	 * Stop the current game and clear the intervals.
	 */
	stop() {
		this.gameRunning = false;

		// clear running intervals to free up computer resources
		clearInterval(this.refreshInterval);
		clearInterval(this.timer);
	}

	/**
	 * Clear the canvas context.
	 */
	clear() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	/**
	 * Update and display the current time using 00:00:000 (minutes:seconds:miliseconds) format.
	 */
	updateTimeDisplay() {
		const currentTime = new Date(Date.now() - this.startTime);

		// get minutes, seconds and miliseconds
		const minutes = currentTime.getMinutes();
		const seconds = currentTime.getSeconds();
		const miliseconds = currentTime.getMilliseconds();

		// store final time
		this.finalTime = {
			minutes: minutes,
			seconds: seconds,
			miliseconds: miliseconds,
			placeholder: false,
		};

		this.timeDisplay.innerHTML = `Current time: ${formatTime(minutes, seconds, miliseconds)}`;
	}

}

// basic setup
const gameArea = new GameArea(900, 600);
const bestTimeDisplay = document.getElementById('bestTime');
let gamePieces = [];
let player;

// check if browser supports Web Storage API and initialize 'bestTime' item if
// Web Stirage API is supported
if (typeof Storage !== 'undefined') {
	if (!localStorage.getItem('bestTime')) {
		localStorage.setItem(
			'bestTime',
			JSON.stringify({
				minutes: 0,
				seconds: 20,
				miliseconds: 0,
				placeholder: true,
			})
		);
	}

	const bestTime = JSON.parse(localStorage.getItem('bestTime'));
	const formattedTime = formatTime(
		bestTime.minutes,
		bestTime.seconds,
		bestTime.miliseconds
	);

	bestTimeDisplay.innerHTML =
		'Best time: ' +
		(bestTime.placeholder
			? formattedTime + ' (placeholder)'
			: formattedTime);
} else {
	alert('Your browser does not support local storage. Your records won\'t be stored.');
}

/**
 * Starts new game.
 */
function startNewGame() {
	if (gameArea.gameRunning) {
		alert('Game is already running!');
		return;
	}

	// gamePieces.push(new Component(30, 30, 'black', 150, 150, 'asteroid'));
	// gamePieces.push(new Component(30, 30, 'black', 740, 300, 'asteroid'));
	const numberOfAsteroids = 10;

	for (let i = 0; i < numberOfAsteroids; i++)
		gamePieces.push(generateAsteroid('gray'));

	player = createNewPlayer(30, 30, 'red');

	gameArea.start();
}

/**
 * Returns new player object with the given width, height and color in the middle of the canvas.
 * 
 * @param {Number} width player width
 * @param {Number} height player height
 * @param {String} color player color
 * @returns new player object with the given width, height and color
 */
function createNewPlayer(width, height, color) {
	const x = gameArea.canvas.width / 2;
	const y = gameArea.canvas.height / 2;

	return new Component(width, height, color, x, y, 'player');
}

/**
 * Stops the current game, resets all game parameters and stores high score to local storage.
 * It also gives the user appropriate warnings if the user tries to stop the game manualy.
 * 
 * @param {Boolean | undefined} collisionDetected boolean value that indicates if collision was detected
 */
function stopCurrentGame(collisionDetected) {
	// check if the user caused the game to stop
	if (!collisionDetected) {
		if (!gameArea.gameRunning) {
			alert('There is no game running!');
			return;
		}
	
		if (!confirm('Are you sure you want to stop the current game?')) return;
	}

	gamePieces = [];
	player = null;

	gameArea.stop();
	gameArea.clear();

	const bestTime = JSON.parse(localStorage.getItem('bestTime'));
	const endTime = gameArea.finalTime;

	const bestTimeMilis =
		bestTime.minutes * 60 * 1000 +
		bestTime.seconds * 1000 +
		bestTime.miliseconds;
	const endTimeMilis =
		endTime.minutes * 60 * 1000 +
		endTime.seconds * 1000 +
		endTime.miliseconds;

	// check for new highscore
	if (endTimeMilis > bestTimeMilis) {
		alert('Congratulations, this is your new personal highscore!');

		localStorage.setItem('bestTime', JSON.stringify(endTime));
		bestTimeDisplay.innerHTML = `Best time: ${formatTime(endTime.minutes, endTime.seconds,endTime.miliseconds)}`;
	}

}

/**
 * Updates game area.
 */
function updateGameArea() {
	gameArea.clear();

	player.newPos(gameArea);
	player.update(gameArea.context);

	gamePieces.forEach((gamePiece) => {
		gamePiece.newPos(gameArea);
		gamePiece.update(gameArea.context);
	});
}

/**
 * Updates player position on the canvas on key down event.
 * 
 * @param {Event} event key down event
 */
function updatePlayerPosition(event) {
	if (!gameArea.gameRunning) return;

	player.newPos(gameArea, event);
	player.update(gameArea.context);
}

/**
 * Returns formatted time string using 00:00:000 (minutes:seconds:miliseconds) format from
 * the given time in minutes, seconds and miliseconds.
 *
 * @param {Number} minutes number of minutes
 * @param {Number} seconds number of seconds
 * @param {Number} miliseconds number of miliseconds
 * @returns formatted time string using 00:00:000 (minutes:seconds:miliseconds) format
 */
function formatTime(minutes, seconds, miliseconds) {
	const minutesString = minutes < 10 ? '0' + minutes : minutes;
	const secondsString = seconds < 10 ? '0' + seconds : seconds;
	const milisecondsString =
		miliseconds < 10
			? '00' + miliseconds
			: miliseconds < 100
			? '0' + miliseconds
			: miliseconds;

	return `${minutesString}:${secondsString}:${milisecondsString}`;
}

function generateAsteroid(color) {
	const max_x = gameArea.canvas.width;
	const max_y = gameArea.canvas.height;

	let x;
	let y;
	const asteroidWidth = 30;
	const asteroidHeight = 30;

	// determine where to hide asteroid
	const hide = Math.random();

	if (hide < 0.25) {
		x = asteroidWidth / 2;
		y = generateRandomNumberInRange(Math.floor(0.25 * max_y), Math.floor(0.75 * max_y));
	} else if (hide >= 0.25 && hide < 0.5) {
		x = generateRandomNumberInRange(Math.floor(0.25 * max_x), Math.floor(0.75 * max_x));
		y = asteroidHeight / 2;
	} else if (hide >= 0.5 && hide < 0.75) {
		x = max_x - asteroidWidth / 2 - 1;
		y = generateRandomNumberInRange(Math.floor(0.25 * max_y), Math.floor(0.75 * max_y));
	} else {
		x = generateRandomNumberInRange(Math.floor(0.25 * max_x), Math.floor(0.75 * max_x));
		y = max_y - asteroidHeight / 2 - 1;
	}

	return new Component(asteroidWidth, asteroidHeight, color, x, y, 'asteroid');
}

/**
 * Generates and returns random speed value dependent on starting position.
 * 
 * @param {Number} axisValue x or y value
 * @param {Number} min minimum speed
 * @param {Number} max maximum speed (excluded)
 * @returns random speed value dependent on starting position
 */
function generateRandomSpeed(axisValue, min, max) {
	const speed = generateRandomNumberInRange(min, max);

	return axisValue < 0 ? speed : -speed;
}

function generateRandomNumberInRange(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}
