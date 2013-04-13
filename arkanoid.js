function Game(options) {
	"use strict";
	
	var game = this;

	// game canvas
	var canvas = options.canvas;
	// canvas context
	var ctx = canvas.getContext("2d");
	// status element
	var status = document.querySelectorAll(".status")[0];
	// speed of the game (ball)
	game.speed = options.speed;
	// controls the animation
	game.isRunning = false;
	game.isWon = false;

	/*
	 *	Public .init() initiates the game
	 */
	this.init = function () {
		images.init();
		ball.init();
		bat.init();
		bricks.init();
		lives.init();
		addKeyHandlers();
		game.isRunning = true;
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
	 *	Private lives object
	 *	.container		element where lives live
	 *	.count			keeps track of how many lives are left
	 *	.draw()			draws available lives to container
	 *	.die()			removes a life
	 */
	var lives = {
		init: function () {
			this.count = options.lives;
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
	 *	Private ball object
	 *	.init()		initializes basic properties of the ball (position, direction and size)
	 *	.draw()		draws ball on canvas at its current x:y position
	 *	.size		radius of "ball" icon, although its technically a square
	 *	.icon		reference to the bird image
	 *  .left(), .right(), .top(), .bottom() are ball boundries	
	 *  .padding	offset from the edge used to soften edges of the playground
	 */
	var ball = {
		init: function () {
			this.x = canvas.width / 2,
			this.y = canvas.height / 2,
			this.dx = 0.05,
			this.dy = 1,
			this.size = 10;
		},
		draw: function () {
			ctx.drawImage(images.bird, this.x-this.size, this.y-this.size);
		},
		padding: 5,
		left: function () { return this.x - this.size / 2 - this.padding; },
		right: function () { return this.x + this.size / 2 + this.padding; },
		bottom: function () { return this.y + this.size + 12 / 2 + this.padding; },
		top: function () { return this.y - this.size / 2 - this.padding; }
	};

	/*
	 *	Private bat object
	 *	.init()		initializes basic properties of the bat
	 *	.draw()		draws a bat on canvas at its current position
	 */
	var bat = {
		init: function () {
			this.width = 80,
			this.height = 12,
			this.isMovingLeft = false,
			this.isMovingRight = false,
			this.pos = (canvas.width / 2) - (this.width / 2);
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
	 *	Private brick object
	 *	.height		
	 *  .width
	 *	.perRow		how many bricks in one row
	 *	.levelMap	map of how bricks are distributed
	 *	.draw()		loops through all the bricks and draws them on canvas
	 */
	var bricks = {
		init: function () {
			this.currentMap = this.levelMap.clone(),
			this.remaining = 0;
			this.draw();
		},
		height: function () { return 20; },
		width: function () { return canvas.width / this.currentMap[0].length; },
		remaining: 0,
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
						ctx.drawImage(images[this.currentMap[row][brick]], this.width() * brick, row * bricks.height());
						this.remaining += 1;
					}
				}
			}
		}
	};

	/*
	 *	animate() checks the position of the ball and recalculates its location according to its surroundings
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
				lives.die();
				game.isRunning = false;
				status.innerHTML = "Press spacebar to continue.";

				if (lives.count === 0) {
					status.innerHTML = "Game over. Press spacebar to start new game.";
				}
			}
		}

		// brick colision
		var row = Math.floor(ball.y / bricks.height());
		var brick = Math.floor(ball.x / bricks.width());
		if (ball.y < bricks.currentMap.length * bricks.height() && bricks.currentMap[row][brick] > 0) {
			if (bricks.currentMap[row][brick] < 3)
				bricks.currentMap[row][brick] = 0;
			else
				bricks.currentMap[row][brick] -= 1;
			ball.dy = -ball.dy;
		}
		
		ball.y += ball.dy * game.speed;
		ball.x += ball.dx * game.speed;
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
	}


	/*
	 *	Key handlers that control the game
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

		// reset the game
		document.onkeypress = function (event) {
			var key = event.charCode ? event.charCode : event.keyCode;
			if (key == 32 && !game.isRunning) {
				if (lives.count === 0 || game.isWon)
					game.init();
				else
					game.reset();

				status.innerHTML = "";
			}
		};



		document.onmousemove = function (event) {
			if (event.pageX > canvas.offsetLeft && event.pageX < canvas.offsetLeft + canvas.width) {
				bat.pos = event.pageX - (canvas.offsetLeft + bat.width / 2);
			}
		};
	}

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
	 *	Helper function that finds the right animation frame request
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