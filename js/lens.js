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
		this._originX = this._canvasWidth / 4;
		this._originY = this._canvasHeight / 2;
		this._scale = 4000;
		this._refractiveIndex = 1.49;
		this._centerThickness = 11.0 / 1000; // 11 mm
		this._lensRadius = 22.0 / 1000; // 22 mm
		this._center = this._lensRadius - this._centerThickness / 2; 
		this._lensHeight = 25.4 / 1000 / 2; // dia. 25.4 mm (1 inch)
		this._lightX = 0.10;
		this._lightY = 0.01;
		this._lightCollimated = false;
		this._rayExtendEnabled = false;
		this._calcRays();
	};
	
	LensSim.prototype = {
			
		get lensRadius() {
			return this._lensRadius;
		},
		
		set lensRadius(v) {
			this._lensRadius = v;
			this._center = this._lensRadius - this._centerThickness / 2; 
			this.update();
		},
		
		get centerThickness() {
			return this._centerThickness;
		},
		
		set centerThickness(v) {
			this._centerThickness = v;
			this._center = this._lensRadius - this._centerThickness / 2; 
			this.update();
		},
		
		get lightCollimated() {
			return this._lightCollimated;
		},
		
		set lightCollimated(v) {
			this._lightCollimated = !!v;
			this.update();
		},
		
		get refractiveIndex() {
			return this._refractiveIndex;
		},
		
		set refractiveIndex(v) {
			this._refractiveIndex = v;
			this.update();
		},
		
		update: function () {
			var ctx = this._context;
			this._calcRays();
			ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
			this._drawLens(ctx);
			for (var i = 0; i < this._rays.length; i++) {
				this._drawRay(ctx, this._rays[i]);
			}
			if (this._rayExtendEnabled) {
				for (var i = 0; i < this._rays.length; i++) {
					this._drawRayExtend(ctx, this._rays[i]);
				}
			}
			this._drawFocalPoint(ctx);
			this._drawLight(ctx);
		},
		
		_addRay: function (x, y, rad) {
			var ray = [ x, y ];
			var v, rad2;
			var n = this._refractiveIndex;
			
			// Solve the point where the ray enters the lens.
			v = ((this._center + x) * Math.sin(rad) + y * Math.cos(rad)) / this._lensRadius;
			rad2 = Math.asin(v) - rad;
			x = this._lensRadius * Math.cos(rad2) - this._center;
			y = this._lensRadius * Math.sin(rad2);
			if (y > this._lensHeight || y < -this._lensHeight) return;
			rad = Math.asin(Math.sin(rad + rad2)) / n - rad2;
			ray = ray.concat([ x, y ]);
			
			// Solve the point where the ray leave the lens.
			v = ((x - this._center) * Math.sin(rad) + y * Math.cos(rad)) / this._lensRadius;
			rad2 = Math.asin(v) + rad;
			x = -this._lensRadius * Math.cos(rad2) + this._center;
			y = this._lensRadius * Math.sin(rad2);
			if (y > this._lensHeight) return;
			rad = Math.asin(Math.sin(rad - rad2)) * n + rad2; 
			ray = ray.concat([ x, y ]);

			// The 1m away.
			x = x - 1 * Math.cos(rad);
			y = y + 1 * Math.sin(rad);
			ray = ray.concat([ x, y ]);
			this._rays.push(ray);
		},
		
		_calcRays: function () {
			this._rays = [];
			if (this._lightCollimated) {
				var rad = -Math.atan(this._lightY / this._lightX);
				for (var i = -20; i <= 20; i++) {
					var d = 0.05 * i / 20;
					this._addRay(this._lightX + d * Math.sin(rad), this._lightY + d * Math.cos(rad), rad);
				}
			} else {
				for (var i = -40; i <= 40; i++) {
					this._addRay(this._lightX, this._lightY, (80 * i / 40) * Math.PI / 180);
				}
			}
		},
		
		_drawLens: function (ctx) {
			ctx.beginPath();
			var rad = Math.asin(this._lensHeight / this._lensRadius);
			ctx.arc(this._originX - this._center * this._scale,
					this._originY,
					this._lensRadius * this._scale,
					2 * Math.PI - rad,
					rad);
			ctx.arc(this._originX + this._center * this._scale,
					this._originY,
					this._lensRadius * this._scale,
					1 * Math.PI - rad,
					1 * Math.PI + rad);
			ctx.closePath();
			ctx.globalAlpha = 0.5;
			ctx.lineWidth = 1;
			ctx.fillStyle = "#ccccff";
			ctx.fill();
			ctx.globalAlpha = 1.0;
			ctx.strokeStyle = "blue";
			ctx.stroke();
		},
		
		_drawFocalPoint: function (ctx) {
			var n = this._refractiveIndex;
			var R = this._lensRadius;
			var d = this._centerThickness;
			// Lensmaker's equation
			var f = 1 / ((n - 1) * (2 / R - ((n - 1) * d) / (n * R * R)));
			ctx.beginPath();
			ctx.arc(this._originX - f * this._scale,
					this._originY, 3, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.arc(this._originX + f * this._scale,
					this._originY, 3, 0, 2 * Math.PI);
			ctx.globalAlpha = 1.0;
			ctx.fillStyle = "blue";
			ctx.fill();
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
		
		_drawRayExtend: function (ctx, ray) {
			ctx.beginPath();
			if (ray.length < 4) return;
			var i = ray.length - 4;
			var x = ray[i];
			var y = ray[i + 1];
			ctx.moveTo(this._originX + x * this._scale,
					   this._originY - y * this._scale);
			x = 2 * x - ray[i + 2];
			y = 2 * y - ray[i + 3];
			ctx.lineTo(this._originX + x * this._scale,
					   this._originY - y * this._scale);
			ctx.globalAlpha = 1;
			ctx.lineWidth = 0.5;
			ctx.strokeStyle = "blue";
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
		}
	};
	
	lens.LensSim = LensSim;
	
	return lens;
}(lens || {}));