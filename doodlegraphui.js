"use strict";

require([
    'dojo/on',
    'dojo/dom',
    'dojo/dom-attr',
    'dijit/registry',
    "dojo/parser",
    "dijit/form/Button",
    "dijit/form/Select",
    "dijit/form/SimpleTextarea",
    "dijit/form/NumberTextBox",
    'dojo/domReady!'
], function (on, dom, domAttr, registry, parser) {

    function updateData() {
	var isValid = registry.byId("steps").isValid;
        var steps = isValid ? registry.byId("steps").get("value") : 100;
	var format = registry.byId("format").get("value");
	var data = graph.getData({
	    format: format,
            steps: steps
	});
	registry.byId("dataoutput").set("value", data);
    }

    var graph = new doodlegraph.DoodleGraph({
	element: dom.byId("mydrawgraph"),
	scaleWidth: 10,
	marginWidth: 20
    });
    graph.render();
    graph.ondataupdate = function () {
	updateData();
    };

    domAttr.set(dom.byId("dataoutput"), "value", "");

    window.onresize = function () {
        graph.resize();
    };

    parser.parse();

    on(dom.byId("dataoutput"), "click", function (event) {
        dom.byId("dataoutput").select();
        event.preventDefault();
    });

    on(dom.byId("clear"), "click", function (event) {
        graph.clear();
    });

    on(registry.byId("format"), "change", function (event) {
	updateData();
    });

    on(registry.byId("steps"), "change", function (event) {
	updateData();
    });

    help();
});
