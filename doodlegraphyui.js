YUI().use("node", "promise", "widget", function (Y) {
    "use strict";

    var DoodleGraph = function (config) {
	DoodleGraph.superclass.constructor.apply(this, arguments);
    }

    DoodleGraph.NAME = "doodleGraph";

    DoodleGraph.ATTRS = {
	scaleWidth: {
	    value: 10
	},
	marginWidth: {
	    value: 20
	},
    };

    Y.extend(DoodleGraph, Y.Widget, {
	initializer: function (config) {
	},

	renderUI: function () {
	    var contentBox = this.get("contentBox");
	    var graph = new doodlegraph.DoodleGraph({
		element: contentBox.getDOMNode(),
		scaleWidth: 10,
		marginWidth: 20
	    });
	    graph.render();
	    graph.ondataupdate = function () {
		var data = graph.getData({
		    format: "matlab"
		});
		Y.one("#dataoutput").set("value", data);
	    };
	},

	bindUI: function () {
	}
    })

    var graph = new DoodleGraph({ srcNode: "#mydrawgraph" });
    graph.render();
});
