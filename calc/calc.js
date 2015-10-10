(function (global, undefined) {
    "use strict";
    
    var NUMBER_CHARS = "0123456789.";
    var BINARY_CHARS = "+-*/";
    
    /**
     * Represents the state of the input.
     */
    var InputModel = function (display) {
        this._accumulator = 0;
        this._operand = 0;
        this._operator = null;
        this._currentText = "";
        this._display = display;
    };
    
    InputModel.prototype = {
        appendChar: function (ch) {
            if (ch == "A") {
                this._resetNumber();
            } else if (ch == "C") {
                this._resetNumber();
            } else if (NUMBER_CHARS.indexOf(ch) != -1) {
                this._appendCharNumber(ch);
            } else if (BINARY_CHARS.indexOf(ch) != -1) {
                if (this._currentText != "") {
                    this._prepareOperand();
                    this._applyOperator();
                    this._currentText = "";
                }
                this._operator = ch;
                this._display.setOperator(ch);
            } else if (ch == "=") {
                this._prepareOperand();
                this._applyOperator();
                this._currentText = "";
                this._display.setOperator("");
            } else if (ch === "\u0008") {
                this.eraseBackword();
            } else if (ch === "\u001b") {
                this.reset();
            } else {
                return false;
            }
            return true;
        },
        
        reset: function () {
            this._resetNumber();
            this._accumulator = 0;
            this._operand = 0;
            this._operator = null;
            this._display.setOperator("");
        },
        
        eraseBackword: function () {
            if (this._currentText.length > 0) {
                this._currentText = this._currentText.substr(0, this._currentText.length - 1);
                if (this._currentText === "") this._currentText = "0";
                this._display.setText(this._currentText);
            }
        },
        
        _resetNumber: function () {
            this._currentText = "";
            this._display.setText("0");
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
            this._display.setText(this._currentText);
        },
        
        _prepareOperand: function () {
            if (this._currentText != "") {
                this._operand = parseFloat(this._currentText);
            }
        },
        
        _applyOperator: function () {
            if (this._operator == null) {
                this._accumulator = this._operand;
            } else if (this._operator == "+") {
                this._accumulator += this._operand;
            } else if (this._operator == "-") {
                this._accumulator -= this._operand;
            } else if (this._operator == "*") {
                this._accumulator *= this._operand;
            } else if (this._operator == "/") {
                this._accumulator /= this._operand;
            }
            console.log(this._accumulator);
            this._display.setText(this._accumulator.toString());
        }
    };

    var KEYPAD_DATA = [
        "MMC", "mMR", ">M+", "<M-", "p1/x",  
        "%", "r\u221a", "/\u00f7", "*\u00d7", "-", 
        "n\u00b1", "7",  "8",  "9",  "_+", 
        "\u0008\u25B6",  "4",  "5",  "6",  ,
        "\u007fC",  "1",  "2",  "3",  "_=",
        "\u001bAC", " 0",  , ".",  ,  ,
    ];

    /**
     * Represents a display of the calculator.
     * @Constructor
     */
    var Display = function (element) {
        this.element = element;
        var operatorElem = document.createElement("div");
        operatorElem.className = "calc-operator";
        this.element.appendChild(operatorElem);
        this._operatorTextNode = document.createTextNode("");
        operatorElem.appendChild(this._operatorTextNode);
        this._displayTextNode = document.createTextNode("");
        this._displayTextNode.className = "calc-display";
        this.element.appendChild(this._displayTextNode);
        this.setText("0");
    };

    Display.prototype = {
        postKeyEvent: function (key) {
        },

        setText: function (text) {
            this._displayTextNode.textContent = text;
        },
        
        setOperator: function (operator) {
            this._operatorTextNode.textContent = operator;
        }
    };

    /**
     * Represents a keypad of the calculator.
     * @Constructor
     */
    var Keypad = function (element) {
        var that = this;
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
                    // Insert an DIV to avoid WebKit's height calculation issue.
                    var buttonContainerElem = document.createElement("div");
                    buttonContainerElem.style.height = "100%";
                    cellElem.appendChild(buttonContainerElem);
                    var buttonElem = document.createElement("button");
                    buttonContainerElem.appendChild(buttonElem);
                    var keyChar = keyData;
                    if (keyChar.length > 1) {
                        keyChar = keyData[0];
                        keyData = keyData.substr(1);
                    }
                    var textNode = document.createTextNode(keyData);
                    buttonElem.appendChild(textNode);
                    buttonElem.calcKeyChar = keyChar;
                    buttonElem.addEventListener("click", function (event) {
                        var ch = event.target.calcKeyChar;
                        that._onclick(ch);
                    });
                }
            }
        }
        window.addEventListener("keydown", function (event) {
            var ch = event.char;
            if (ch === undefined || ch === "") ch = String.fromCharCode(event.keyCode);
            if (ch !== "") {
                var handled = that._onclick(ch);
                if (handled) {
                    event.preventDefault();
                }
                console.log(event);
                event.preventDefault();
            }
        })
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