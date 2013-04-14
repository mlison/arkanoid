function Game(options) {
	"use strict";
	
	var game = this,
		canvas = (options.canvas) ? options.canvas : document.querySelector('#game'),
		status = (options.status) ? options.status : document.querySelectorAll(".status")[0],
		ctx = canvas.getContext("2d"),
		speed = (options.speed) ? options.speed : 5;

	game.isRunning = false;
	game.isWon = false;



	/*
	 *	Public .init() initiates the game with 'saved' game data if available, or start a new game
	 */
	this.init = function () {
		var done = false,
			gamestate = null;

		images.init();

		if (window.localStorage) {
			gamestate = JSON.parse(window.localStorage.getItem('gamestate'));
			// if gamestate is present from previous session use stored values to initiate the game
			if (gamestate !== null && !gamestate.isWon && gamestate.lives > 0) {
				if (gamestate.isRunning) {
					// if the game was running use stored values
					ball.init(gamestate.ball.x, gamestate.ball.y, gamestate.ball.dx, gamestate.ball.dy);
					bat.init(gamestate.bat.pos);
				} else {
					// otherwise reset ball and bat
					ball.init();
					bat.init();		
				}
				bricks.init(gamestate.bricks.currentMap.clone(), gamestate.bricks.remaining);
				lives.init(gamestate.lives);
				done = true;
			}
		}

		// otherwise just start the game with default values
		if (!done) {
			ball.init();
			bat.init();
			bricks.init();
			lives.init();
		}

		addKeyHandlers();
		game.isRunning = true;
		game.isWon = false;

		tick();
	};

	/*
	 *	Public .reset() will restart the ball and bat from their default position
	 */
	this.reset = function () {
		ball.init();
		bat.init();
		game.isRunning = true;
		status.innerHTML = "";
		reqAnimationFrame(tick);
	};



	/*
	 *	Private lives object, implements life tracking from init() till die()
	 *	.init			initializes lives object
	 *	.container		element where lives live
	 *	.count			keeps track of how many lives are left
	 *	.draw()			draws available lives to .container
	 *	.die()			removes a life
	 */
	var lives = {
		init: function (count) {
			this.count = (count) ? count : options.lives;
			this.container.innerHTML = "";
			this.draw();
		},
		container: document.querySelectorAll(".lives")[0],
		draw: function() {
			for (var i = 0; i < this.count; i++) {
				var life = document.createElement('span');
				this.container.appendChild(life);
			}
		},
		die: function() {
			this.count -= 1;
			this.container.removeChild(this.container.querySelectorAll("span")[0]);
		}
	};

	/*
	 *	Private ball object, implements ball and keeps track of where it is and where its going
	 *	.init()		initializes basic properties of the ball (position, direction and size)
	 *	.draw()		draws ball on canvas at its current x:y position
	 *	.size		radius of "ball" icon, although its technically a square
	 *  .left(), .right(), .top(), .bottom() are ball boundries
	 *  .padding	offset from the edge used to soften edges of the playground
	 */
	var ball = {
		init: function (x, y, dx, dy) {
			this.x = (x) ? x : canvas.width / 2,
			this.y = (y) ? y : canvas.height / 2,
			this.dx = (dx) ? dx : 0.025,
			this.dy = (dy) ? dy : 1,
			this.size = 10;
		},
		draw: function () {
			ctx.drawImage(images.bird, this.x-this.size, this.y-this.size);
		},
		padding: 5,
		left:	function () { return this.x - this.size / 2 - this.padding; },
		right:	function () { return this.x + this.size / 2 + this.padding; },
		bottom:	function () { return this.y + this.size + 12 / 2 + this.padding; },
		top:	function () { return this.y - this.size / 2 - this.padding; }
	};

	/*
	 *	Private bat object, implements the bat and keeps track of where it is and whether it is moving
	 *	.init()		initializes basic properties of the bat
	 *	.draw()		draws a bat on canvas at its current position
	 *	.pos		current bat position
	 *	.isMovingLeft, .isMovingRight	is updated by keydown/keyup to make the movement smooth
	 */
	var bat = {
		init: function (pos) {
			this.width = 80,
			this.height = 12,
			this.isMovingLeft = false,
			this.isMovingRight = false,
			this.pos = (pos) ? pos : (canvas.width / 2) - (this.width / 2);
		},
		draw: function () {
			if (this.isMovingLeft && this.pos > 0) 
				this.pos -= 8;
			if (this.isMovingRight && this.pos < canvas.width - this.width) 
				this.pos += 8;

			ctx.drawImage(images.stone, this.pos, canvas.height - 24);
		}
	};

	/*
	 *	Private brick object, implements and paints the bricks
	 *	.levelMap		map of how bricks are distributed initially
	 *	.currentMap		map of how bricks are distributed in current game
	 *	.draw()			loops through all the bricks and draws them on canvas
	 *	.remaining		how many bricks are left, updated on every redraw
	 */
	var bricks = {
		init: function (map, remaining) {
			this.currentMap = (map) ? map : this.levelMap.clone(),
			this.remaining = (remaining) ? remaining : 0;
			this.height = 20;
			this.width = 83;
			this.draw();
		},
		levelMap: [
			[1,1,1,1,1,1,1,1,1,1],
			[1,1,1,1,1,1,1,1,1,1],
			[0,0,0,3,1,1,3,0,0,0],
			[0,0,0,0,3,3,0,0,0,0]
		],
		draw: function () {
			this.remaining = 0;
			for (var row in this.currentMap) {
				for (var brick in this.currentMap[row]) {
					if (this.currentMap[row][brick] > 0) {
						// brick textures are picked up from image object by their ID (which happens to be numeric for easier handling)
						ctx.drawImage(images[this.currentMap[row][brick]], this.width * brick, row * bricks.height);
						this.remaining += 1;
					}
				}
			}
		}
	};

	/*
	 *	animate() checks the position of the ball and recalculates its location according to its surroundings,
	 *	the function also implements colision checks with bricks and bat miss
	 */
	function animate() {
		// bounce off left or right wall
		ball.dx = (ball.right() > canvas.width || ball.left() < 0) ? -ball.dx : ball.dx;
		// bounce off top
		ball.dy = (ball.top() < 0) ? -ball.dy : ball.dy;
		
		// bounce off the bat or die
		if (ball.bottom() > canvas.height - bat.height) {
			if (bat.pos - ball.size/2 < ball.x && ball.x < bat.pos + bat.width + ball.size/2) {
				// changing x-direction controls the angle at which the ball bounces off the bat
				ball.dx = 5 * ( (ball.x - (bat.pos+bat.width/2) ) / bat.width);
				ball.dy = -ball.dy;
			} else {
				// remove a life and stop the game
				lives.die();
				game.isRunning = false;
				status.innerHTML = "Press spacebar to continue.";

				if (lives.count === 0)
					status.innerHTML = "Game over. Press spacebar to start new game.";
			}
		}

		// brick colision
		var row = Math.floor(ball.y / bricks.height);
		var brick = Math.floor(ball.x / bricks.width);
		if (ball.y < bricks.currentMap.length * bricks.height && bricks.currentMap[row][brick] > 0) {
			// kill the brick
			if (bricks.currentMap[row][brick] < 3){
				bricks.currentMap[row][brick] = 0;
			} else {
				bricks.currentMap[row][brick] -= 1;
			}
			// and bounce off it
			ball.dy = -ball.dy;
		}
		
		// finally change the ball coordinates based upon its direction and speed
		ball.y += ball.dy * speed;
		ball.x += ball.dx * speed;
    }

    /*
	 *	tick() defines what happens within one "frame" of the game
	 */
    function tick() {
		animate();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		bricks.draw();
		
		if (bricks.remaining === 0) {
			game.isRunning = false;
			game.isWon = true;
			status.innerHTML = "You win. Press spacebar for new game.";
		}

		if (game.isRunning) {
			bat.draw();
			ball.draw();
			reqAnimationFrame(tick);
		}

		// save current game state to local storage
		if (window.localStorage) {
			window.localStorage.setItem('gamestate', JSON.stringify({
				lives: lives.count,
				bricks: bricks,
				ball: ball,
				bat: bat,
				isWon: game.isWon,
				isRunning: game.isRunning
			}));
		}
	}


	/*
	 *	Key handlers, implement game controls
	 */
	function addKeyHandlers() {
		// start bat movement
		document.onkeydown = function (event) {
			var key = event.charCode ? event.charCode : event.keyCode;
			if(key == 37)
				bat.isMovingLeft = true;
			if(key == 39)
				bat.isMovingRight = true;
		};
		
		// stop bat movement
		document.onkeyup = function () {
			bat.isMovingLeft = false;
			bat.isMovingRight = false;
		};

		// use mouse to control the bat if cursor is within canvas
		document.onmousemove = function (event) {
			if (event.pageX > canvas.offsetParent.offsetLeft && event.pageX < canvas.offsetParent.offsetLeft + canvas.width &&
				event.pageY > canvas.offsetTop && event.pageY < canvas.offsetTop + canvas.height)
				bat.pos = event.pageX - canvas.offsetParent.offsetLeft - bat.width / 2;
		};

		// reset the game
		document.onkeypress = function (event) {
			var key = event.charCode ? event.charCode : event.keyCode;
			if (key == 32 && !game.isRunning) {
				if (lives.count === 0 || game.isWon) {
					game.init();
				}
				else {
					game.reset();
				}

				status.innerHTML = "";
			}
		};

		// start a new game
		document.querySelector("#new").onclick = function () {
			if (window.localStorage)
				window.localStorage.clear();
			game.init();
		};
	}

	/*
	 *	Private image object that holds game textures
	 *	TODO: implement image.onload
	 */
	var images = {
		add: function (id, src) {
			var img = new Image();
			img.src = src;
			this[id] = img;
		},
		init: function () {
			this.add('1', 'images/plank.png');
			this.add('2', 'images/pig-damaged.png');
			this.add('3', 'images/pig-happy.png');
			this.add('bird', 'images/bird.png');
			this.add('stone', 'images/stone.png');
		}
	};

	/*
	 *	Helper function, finds the right animation frame request
	 */
	function reqAnimationFrame(func) {
		if (typeof window.msRequestAnimationFrame === 'function') 
			return window.msRequestAnimationFrame(func);

		if (typeof window.mozRequestAnimationFrame === 'function') 
			return window.mozRequestAnimationFrame(func);

		if (typeof window.webkitRequestAnimationFrame === 'function') 
			return window.webkitRequestAnimationFrame(func);

		return false;
	}
}

// Returns clone of provided array (to avoid pass by reference)
Array.prototype.clone = function() {
    var arr = this.slice(0);
    for( var i = 0; i < this.length; i++ )
        if( this[i].clone )
            arr[i] = this[i].clone();
    return arr;
};



var arkanoid = new Game({
	canvas: document.querySelector('#game'),
	lives: 5,
	speed: 5
});

arkanoid.init();