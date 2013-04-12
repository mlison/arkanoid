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
	this.speed = options.speed;
	// controls the animation
	this.isRunning = false;

	/*
	 *	Public .init() initiates the game
	 */
	this.init = function () {
		ball.init();
		bat.init();
		lives.draw();
		bricks.draw();
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
		container: document.querySelectorAll(".lives")[0],
		count: options.lives,
		draw: function() {
			for (var i = 0; i < this.count; i++) {
				var life = document.createElement('span');
					life.innerHTML = "<3";
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
	 *  .left(), .right(), .top(), .bottom() are ball boundries	
	 *  .padding	offset from the edge used to soften edges of the playground
	 */
	var ball = {
		init: function () {
			this.x = canvas.width / 4,
			this.y = canvas.height / 4 * 3,
			this.dx = 1,
			this.dy = 1,
			this.size = 8;
		},

		draw: function () {
			ctx.fillStyle = "#FF0000";
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, true); 
			ctx.closePath();
			ctx.fill();
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

			ctx.fillStyle = "#993300";
			ctx.beginPath();
			ctx.rect(this.pos, canvas.height - 24, this.width, this.height); 
			ctx.closePath();
			ctx.fill();
		}
	};

	/*
	 *	Private brick object
	 *	.height		height of the bat
	 *	.perRow		how many bricks in one row
	 *	.array		map of how bricks are distributed
	 *	.draw()		loops through all the bricks and draws them on canvas
	 */
	var bricks = {
		perRow: 6,
		height: 20,
		array: [1, 1, 1, 1, 1, 1, 
				1, 1, 1, 0, 1, 1,
				1, 1, 1, 1, 1, 1],
		draw: function () {
			for (var i in bricks.array) {
				var row = bricks.array.slice(i*bricks.perRow, (i+1)*bricks.perRow);
				for (var j in row) {
					if (row[j] === 1) {
						ctx.fillStyle = "#000090";
						ctx.beginPath();
						ctx.rect((canvas.width/bricks.perRow)*j, i*bricks.height, (canvas.width/bricks.perRow)-1, bricks.height-1); 
						ctx.closePath();
						ctx.fill();
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
			}
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
			if(event.keyCode == 37)
				bat.isMovingLeft = true;
			if(event.keyCode == 39)
				bat.isMovingRight = true;
		};
		
		// stop bat movement
		document.onkeyup = function (event) {
			bat.isMovingLeft = false;
			bat.isMovingRight = false;
		};

		// reset the game
		document.onkeypress = function (event) {
			if(event.keyCode == 32 && !game.isRunning) {
				game.reset();
			}
		};
	}

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

var arkanoid = new Game({
	canvas: document.querySelector('#game'),
	lives: 4,
	speed: 5
});

arkanoid.init();