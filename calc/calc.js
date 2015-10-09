(function (global, undefined) {
    "use strict";
    
    var NUMBER_CHARS = "0123456789.";
    
    /**
     * Represents the state of the input.
     */
    var InputModel = function () {
        this._currentText = "";
        this._onUpdate = null;
    };
    
    InputModel.prototype = {
        appendChar: function (ch) {
            if (NUMBER_CHARS.indexOf(ch) != -1) {
                this._appendCharNumber(ch);
            }
        },
        
        _appendCharNumber: function (ch) {
            var currentText = this._currentText;
            if (currentText == "0") currentText = "";
            if (ch == ".") {
                if (currentText.indexOf(".") != -1) return;
                if (currentText == "") currentText = "0";
            }
            currentText += ch;
            this._currentText = currentText;
            if (this._onUpdate) this._onUpdate(this._currentText);
        },
        
        reset: function () {
            this._currentText = "";
        }
    };

    var KEYPAD_DATA = [
        "MC", "MR", "M+", "M-", "1/x",  
        "%", "\u221a", "\u00f7", "\u00d7", "-", 
        "\u00b1", "7",  "8",  "9",  "_+", 
        "\u25B6",  "4",  "5",  "6",  ,
        "C",  "1",  "2",  "3",  "_=",
        "AC", " 0",  , ".",  ,  ,
    ];

    /**
     * Represents a display of the calculator.
     * @Constructor
     */
    var Display = function (element) {
        this.element = element;
        this._displayTextNode = document.createTextNode("");
        this.element.appendChild(this._displayTextNode);
        this.setText("0");
    };

    Display.prototype = {
        postKeyEvent: function (key) {
        },

        setText: function (text) {
            this._displayTextNode.textContent = text;
        }
    };

    /**
     * Represents a keypad of the calculator.
     * @Constructor
     */
    var Keypad = function (element) {
        this.element = element;
        var tableElem = document.createElement("table");
        this.element.appendChild(tableElem);
        for (var i = 0; i < 5; i++) {
            var colElem = document.createElement("col");
            tableElem.appendChild(colElem);
        }
        for (var i = 0; i < 6; i++) {
            var rowElem = document.createElement("tr");
            tableElem.appendChild(rowElem);
            for (var j = 0; j < 5; j++) {
                var keyData = KEYPAD_DATA[i * 5 + j];
                if (keyData != undefined) {
                    var cellElem = document.createElement("td");
                    if (keyData[0] == " ") {
                        cellElem.colSpan = 2;
                        keyData = keyData.substr(1);
                    }
                    if (keyData[0] == "_") {
                        cellElem.rowSpan = 2;
                        keyData = keyData.substr(1);
                    }
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
    };

    Keypad.prototype = {
        click: function (callback) {
            this._onclick = callback;
        }
    };

    global.calc = {
        InputModel: InputModel,
        Display: Display,
        Keypad: Keypad,        
    };

}(this));