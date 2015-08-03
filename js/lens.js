var lens = (function (lens) {
	"use strict";
	
	/**
	 * @constructor
	 */
	var LensSim = function (element) {
		this.element = element;
		this._canvas = document.createElement("canvas");
		var canvas = this._canvas; 
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		element.appendChild(canvas);
		this._canvasWidth = canvas.clientWidth;
		this._canvasHeight = canvas.clientHeight;
		canvas.width = this._canvasWidth;
		canvas.height = this._canvasHeight;
		canvas.addEventListener("mousedown", this._onMouseDown.bind(this));
		canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
		canvas.addEventListener("mouseup", this._onMouseUp.bind(this));
		this._context = this._canvas.getContext("2d");
		this._originX = this._canvasWidth / 2;
		this._originY = this._canvasHeight / 2;
		this._scale = 1000;
		this.lensData = {
			center: 0.1,
			radius: 0.1 * 1.08,
			height: 0.03
		};
		this._lightX = 0.3;
		this._lightY = 0.01;
		this._calcRays();
	};
	
	LensSim.prototype = {
		
		_addRay: function (x, y, rad) {
			var ray = [ x, y ];
			var v, rad2;
			var n = 0.5;
			
			// Solve the point where the ray enters the lens.
			v = ((this.lensData.center + x) * Math.sin(rad) + y * Math.cos(rad)) / this.lensData.radius;
			rad2 = Math.asin(v) - rad;
			x = this.lensData.radius * Math.cos(rad2) - this.lensData.center;
			y = this.lensData.radius * Math.sin(rad2);
			if (y > this.lensData.height || y < -this.lensData.height) return;
			rad = Math.asin(Math.sin(rad + rad2)) * n - rad2;
			ray = ray.concat([ x, y ]);
			
			// Solve the point where the ray leave the lens.
			v = ((x - this.lensData.center) * Math.sin(rad) + y * Math.cos(rad)) / this.lensData.radius;
			rad2 = Math.asin(v) + rad;
			x = -this.lensData.radius * Math.cos(rad2) + this.lensData.center;
			y = this.lensData.radius * Math.sin(rad2);
			if (y > this.lensData.height) return;
			rad = Math.asin(Math.sin(rad - rad2)) / n + rad2; 
			ray = ray.concat([ x, y ]);

			// The 1m away.
			x = x - 1 * Math.cos(rad);
			y = y + 1 * Math.sin(rad);
			ray = ray.concat([ x, y ]);
			this._rays.push(ray);
		},
		
		_calcRays: function () {
			this._rays = [];
			for (var i = -20; i <= 20; i++) {
				this._addRay(this._lightX, this._lightY, (40 * i / 20) * Math.PI / 180);
			}
		},
		
		_drawLens: function (ctx) {
			ctx.beginPath();
			var rad = Math.asin(this.lensData.height / this.lensData.center);
			ctx.arc(this._originX - this.lensData.center * this._scale,
					this._originY,
					this.lensData.radius * this._scale,
					2 * Math.PI - rad,
					rad);
			ctx.arc(this._originX + this.lensData.center * this._scale,
					this._originY,
					this.lensData.radius * this._scale,
					1 * Math.PI - rad,
					1 * Math.PI + rad);
			ctx.closePath();
			ctx.globalAlpha = 0.5;
			ctx.lineWidth = 1;
			ctx.fillStyle = "#ccccff";
			ctx.fill();
			ctx.globalAlpha = 1;
			ctx.strokeStyle = "blue";
			ctx.stroke();
		},
		
		_drawRay: function (ctx, ray) {
			ctx.beginPath();
			ctx.moveTo(this._originX + ray[0] * this._scale,
					   this._originY - ray[1] * this._scale);
			for (var i = 1; i < ray.length / 2; i++) {
				ctx.lineTo(this._originX + ray[i * 2] * this._scale,
						   this._originY - ray[i * 2 + 1] * this._scale);
			}
			ctx.globalAlpha = 1;
			ctx.lineWidth = 0.5;
			ctx.strokeStyle = "red";
			ctx.stroke();
		},
		
		_drawLight: function (ctx) {
			ctx.beginPath();
			ctx.arc(this._originX + this._lightX * this._scale,
					this._originY - this._lightY * this._scale,
					5,
					0,
					2 * Math.PI);
			ctx.fillStyle = "black";
			ctx.fill();
		},
		
		_onMouseDown: function (event) {
			var x = event.pageX / this._scale;
			var y = event.pageY / this._scale;
			this._deltaX = this._lightX - x;
			this._deltaY = this._lightY + y;
			this._dragTarget = "light";
		},

		_onMouseMove: function (event) {
			var x = event.pageX / this._scale;
			var y = event.pageY / this._scale;
			if (this._dragTarget == "light") {
				this._lightX = this._deltaX + x;
				this._lightY = this._deltaY - y;
				this.update();
			}
		},
		
		_onMouseUp: function (event) {
			this._onMouseMove(event);
			this._dragTarget = "";
		},
		
		update: function () {
			var ctx = this._context;
			this._calcRays();
			ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
			this._drawLens(ctx);
			for (var i = 0; i < this._rays.length; i++) {
				this._drawRay(ctx, this._rays[i]);
			}
			this._drawLight(ctx);
		}
	};
	
	lens.LensSim = LensSim;
	
	return lens;
}(lens || {}));