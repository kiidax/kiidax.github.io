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
		
		// Lens 1
		this._lenses = [];
		this._lenses.push({
			x: 0.02,
			y: 0.01,
			refractiveIndex: 1.49,
			centerThickness: 11.0 / 1000, // 11 mm
			radius1: 22.0 / 1000, // 22 mm
			radius2: -22.0 / 1000, // 22 mm
			height: 25.4 / 1000 / 2 // dia. 25.4 mm (1 inch)
		});
		
		this._lightX = 0.10;
		this._lightY = 0.01;
		this._lightCollimated = false;
		this._rayExtendEnabled = false;
		this._calcRays();
	};
	
	LensSim.prototype = {
			
		get lensRadius() {
			return this._lenses[0].radius1;
		},
		
		set lensRadius(v) {
			this._lenses[0].radius1 = v;
			this._lenses[0].radius2 = -v;
			this.update();
		},
		
		get centerThickness() {
			return this._lenses[0].centerThickness;
		},
		
		set centerThickness(v) {
			this._lenses[0].centerThickness = v;
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
			return this._lenses[0].refractiveIndex;
		},
		
		set refractiveIndex(v) {
			this._lenses[0].refractiveIndex = v;
			this.update();
		},
		
		update: function () {
			var ctx = this._context;
			this._calcRays();
			ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
			for (var i = 0; i < this._lenses.length; i++) {
				this._drawLens(ctx, this._lenses[i]);
			}
			for (var i = 0; i < this._rays.length; i++) {
				this._drawRay(ctx, this._rays[i]);
			}
			if (this._rayExtendEnabled) {
				for (var i = 0; i < this._rays.length; i++) {
					this._drawRayExtend(ctx, this._rays[i]);
				}
			}
			for (var i = 0; i < this._lenses.length; i++) {
				this._drawFocalPoint(ctx, this._lenses[i]);
			}
			this._drawLight(ctx);
		},
		
		_calcNextSegment: function (n, cx, cy, radius, size, ray, path) {
			var v = ((ray.x - cx) * Math.sin(ray.rad) + (ray.y - cy) * Math.cos(ray.rad)) / radius;
			var rad2 = Math.asin(v) + ray.rad;
			ray.x = -radius * Math.cos(rad2) + cx;
			ray.y = radius * Math.sin(rad2) + cy;
			if (ray.y > cy + size || ray.y < cy - size) return false;
			ray.rad = Math.asin(Math.sin(ray.rad - rad2)) * n + rad2;
			path.push(ray.x, ray.y);
			return true;
		},
		
		_addRay: function (x, y, rad) {
			var ray = { x: x, y: y, rad: rad };
			var path = [ x, y ];
			var lens = this._lenses[0];
			var n = lens.refractiveIndex;

			// Solve the point where the ray enters the lens.
			var cx = lens.x + lens.radius2 + lens.centerThickness / 2;
			var cy = lens.y;
			if (!this._calcNextSegment(1 / n, cx, cy, lens.radius2, lens.height, ray, path)) return;

			// Solve the point where the ray leave the lens.
			cx = lens.x + lens.radius1 - lens.centerThickness / 2; 
			cy = lens.y;
			if (!this._calcNextSegment(n, cx, cy, lens.radius1, lens.height, ray, path)) return;

			// The 1m away.
			ray.x = ray.x - 1 * Math.cos(ray.rad);
			ray.y = ray.y + 1 * Math.sin(ray.rad);
			path = path.concat([ ray.x, ray.y ]);
			this._rays.push(path);
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
		
		_drawLens: function (ctx, lens) {
			ctx.beginPath();
			var rad = Math.asin(lens.height / lens.radius1);
			
			var cx = lens.x + lens.radius2 + lens.centerThickness / 2;
			var cy = lens.y;
			ctx.arc(this._originX + cx * this._scale,
					this._originY - cy * this._scale,
					-lens.radius2 * this._scale,
					2 * Math.PI - rad,
					rad);
			
			cx = lens.x + lens.radius1 - lens.centerThickness / 2;
			cy = lens.y;
			ctx.arc(this._originX + cx * this._scale,
					this._originY - cy * this._scale,
					lens.radius1 * this._scale,
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
		
		_drawFocalPoint: function (ctx, lens) {
			var n = lens.refractiveIndex;
			var R = lens.radius1;
			var d = lens.centerThickness;
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