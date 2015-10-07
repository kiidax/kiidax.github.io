(function (global, undefined) {
"use strict";

var KEYPAD_DATA = [
    "MR", "M+", "M-", "/",
    "7", "8", "9", "*",
    "4", "5", "6", "-",
    "1", "2", "3", "+",
    "0", ".", "!", "=",
];

function Display(element) {
    this.element = element;
    this._displayTextNode = document.createTextNode("");
    this.element.appendChild(this._displayTextNode);
    this.setText("0");
}

Display.prototype = {
    postKeyEvent: function (key) {
    },

    setText: function (text) {
        this._displayTextNode.textContent = text;
    }
};

function Keypad(element) {
    this.element = element;
    var tableElem = document.createElement("table");
    this.element.appendChild(tableElem);
    for (var i = 0; i < 5; i++) {
        var rowElem = document.createElement("tr");
        tableElem.appendChild(rowElem);
        for (var j = 0; j < 4; j++) {
            var keyData = KEYPAD_DATA[i * 4 + j];
            var cellElem = document.createElement("td");
            rowElem.appendChild(cellElem);
            var buttonElem = document.createElement("button");
            cellElem.appendChild(buttonElem);
            var textNode = document.createTextNode(keyData);
            buttonElem.appendChild(textNode);
            buttonElem.calcKeyId = keyData;
            var that = this;
            buttonElem.addEventListener("click", function (event) {
                var keyData = event.target.calcKeyId;
                that._onclick(keyData);
            });
        }
    }
}

Keypad.prototype = {
    click: function (callback) {
        this._onclick = callback;
    }
};

global.calc = {
    Display: Display,
    Keypad: Keypad
};

}(this));