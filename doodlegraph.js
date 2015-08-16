(function (doodlegraph, undefined) {
    "use strict";

    var SVGNS = "http://www.w3.org/2000/svg";

    var DoodleGraph = function (config) {
	this.config = config;
	this.element = config.element;
    };

    DoodleGraph.prototype = {
	render: function () {
	    this.canvas = document.createElement("div");
	    this.canvas.setAttribute("class", "doodlegraph-canvas");
	    this.element.appendChild(this.canvas);

	    this.renderSVG();
	    this.bindUI();
	},

	renderSVG: function () {
	    var width = this.canvas.offsetWidth;
	    var height = this.canvas.offsetHeight;
	    var scaleWidth = this.config.scaleWidth;
	    var marginWidth = this.config.marginWidth;
	    var canvasWidth = Math.min(width, height);
	    var centerX = width / 2;
	    var centerY = height / 2;
	    var scaleRatio = canvasWidth / 2 - marginWidth - scaleWidth;

	    this.svg = document.createElementNS(SVGNS, "svg");
	    this.canvas.appendChild(this.svg);
	    for (var i = 0; i < 4; i++) {
		var grid = document.createElementNS(SVGNS, "path");
		grid.setAttribute("class", "doodlegraph-scale");
		grid.setAttribute("transform", "translate("+ centerX + "," + centerY +")" + "rotate(" + (i*90) + ")");
		var dValue = "";
		for (var j = 0; j < 19; j++) {
		    if (j != 9) {
			var pos = (j - 9) / 10;
			dValue += "M" + (scaleRatio * pos) + "," + (-scaleRatio) + " l0," + (-scaleWidth);
		    }
		}
		grid.setAttribute("d", dValue);
		this.svg.appendChild(grid);
	    }
	    var scale = document.createElementNS(SVGNS, "rect");
	    scale.setAttribute("x", centerX - scaleRatio);
	    scale.setAttribute("y", centerY - scaleRatio);
	    scale.setAttribute("width", scaleRatio * 2);
	    scale.setAttribute("height", scaleRatio * 2);
	    scale.setAttribute("class", "doodlegraph-scale");
	    this.svg.appendChild(scale);
	    
	    var axis = document.createElementNS(SVGNS, "path");
	    axis.setAttribute("class", "doodlegraph-scale");
	    axis.setAttribute("d", "M" + (centerX - scaleRatio - scaleWidth - marginWidth / 2) + "," + centerY + " L" + (centerX + scaleRatio + scaleWidth + marginWidth / 2) + "," + centerY + " M" + centerX + "," + (centerY - scaleRatio - scaleWidth - marginWidth / 2) + " L" + centerX + "," + (centerY + scaleRatio + scaleWidth + marginWidth / 2));
	    this.svg.appendChild(axis);
	    this._path = document.createElementNS(SVGNS, "path");
	    this._path.setAttribute("class", "doodlegraph-path");
	    this.svg.appendChild(this._path);

	    this._centerX = centerX;
	    this._centerY = centerY;
	    this._scaleRatio = scaleRatio;
	},

	bindUI: function () {
	    this.canvas.addEventListener("mousedown", this._onMouseDown.bind(this));
	    window.addEventListener("mousemove", this._onMouseMove.bind(this));
	    window.addEventListener("mouseup", this._onMouseUp.bind(this));
	},

	resize: function () {
	    this.canvas.removeChild(this.svg);
	    this.renderSVG();

	    this.pathDValue = "M" + this._makeSVGPoint(0);
	    for (var i = 2; i < this._points.length; i += 2) {
		this.pathDValue += " L" + this._makeSVGPoint(i);
	    }
	    this._path.setAttribute("d", this.pathDValue);
	},

	_appendMousePosition: function (event) {
	    var rect = this.canvas.getBoundingClientRect();
	    this._points.push(
		(event.clientX - rect.left - this._centerX) / this._scaleRatio,
		(event.clientY - rect.top - this._centerY) / this._scaleRatio
	    );
	},

	_makeSVGPoint: function (index) {
	    var x = this._points[index] * this._scaleRatio + this._centerX;
	    var y = this._points[index + 1] * this._scaleRatio + this._centerY;
	    return x + "," + y;
	},

	_onMouseDown: function (event) {
	    if (!this._drawing) {
		this._drawing = true;
		this._points = [];
		this._appendMousePosition(event);
		this._lastIndex = 0;
		this.pathDValue = "M" + (this._points[0] * this._scaleRatio + this._centerX) + "," + (this._points[1] * this._scaleRatio + this._centerY);
		event.preventDefault();
	    }
	},

	_onMouseMove: function (event) {
	    if (this._drawing) {
		this._appendMousePosition(event);
		this.pathDValue += " L" + this._makeSVGPoint(this._points.length - 2);
		this._path.setAttribute("d", this.pathDValue);
		event.preventDefault();
	    }
	},

	_onMouseUp: function (event) {
	    if (this._drawing) {
		this._drawing = false;
		event.preventDefault();
		if (this.ondataupdate) {
		    this.ondataupdate();
		}
	    }
	},

	clear: function () {
	    this.pathDValue = "";
	    this._points = [];
	    this._path.setAttribute("d", "");
	    if (this.ondataupdate) {
		this.ondataupdate();
	    }
	},

	getData: function (dataConfig) {
	    if (this._points.length == 0)
		return "";
	    var num = dataConfig.steps;
	    var data = new Array(num);
	    for (var i = 0; i < data.length; i++) {
		data[i] = 0;
	    }
	    for (var i = 2; i < this._points.length; i += 2) {
		var x1 = this._points[i - 2];
		var y1 = this._points[i - 1];
		var x2 = this._points[i];
		var y2 = this._points[i + 1];
		if (x1 > x2) {
		    var t = x1;
		    x1 = x2;
		    x2 = t;
		    t = y1;
		    y1 = y2;
		    y2 = t;
		}
		var j = Math.max(0, Math.ceil((x1 + 1.0) * (num - 1) / 2.0));
		var jend = Math.min((x2 + 1.0) * (num - 1) / 2.0, num);
		for (; j < jend; j++) {
		    var x = j * 2.0 / (num - 1) - 1.0;
		    var y = (x * (y2 - y1) + y1 * x2 - y2 * x1) / (x2 - x1);
		    data[j] = -y;
		}
	    }

	    switch (dataConfig.format) {
	    case "matlab":
		data = "[" + data.map(function (value) {
		    return value.toFixed(3);
		}).join(" ") + "]";
		break;
	    case "r":
		data = "c(" + data.map(function (value) {
		    return value.toFixed(3);
		}).join(", ") + ")";
		break;
	    case "javascript":
		data = "[ " + data.map(function (value) {
		    return value.toFixed(3);
		}).join(", ") + " ]";
		break;
	    case "c":
		data = "{ " + data.map(function (value) {
		    return value.toFixed(3);
		}).join(", ") + " }";
		break;
	    default:
		throw "unknown format: " + dataConfig.format;
	    }

	    return data;
	}
    };

    doodlegraph.DoodleGraph = DoodleGraph;

})(window.doodlegraph = window.doodlegraph || {});
