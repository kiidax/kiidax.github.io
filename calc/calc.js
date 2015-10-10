var calc = function (calc, undefined) {
    "use strict";
    
    /*
     A=   --- N+ ---> A+ (A<-N)
     A=   --- N= ---> A= (A<-N)
     A=   --- +  ---> A+ (A<-A)
     A=   --- =  ---> A= (A<-A)
     A+   --- N+ ---> A+ (A<-A+N)
     A+   --- N= ---> A+B= (A<-A+N,B<-N)
     A+   --- +  ---> A+
     A+   --- =  ---> A+B= (A<-A+A,B<-A)
     A+B= --- N+ ---> A+ (A<-N)
     A+B= --- N= ---> A+B= (A<-N+B)
     A+B= --- +  ---> A+ (A<-A)
     A+B= --- =  ---> A+B= (A<-A+B)
     */
    
    var NUMBER_CHARS = "0123456789.";
    var BINARY_CHARS = "+-*/";
    
    /**
     * Represents the state of the input.
     */
    var Calculator = function (display) {
        this._accumulator = 0;
        this._operand = null;
        this._operator = null;
        this._currentInput = null;
        this._display = display;
    };
    
    Calculator.prototype = {
        appendChar: function (ch) {
            if (ch === "\u001b") { // AC
                this.reset();
            } else if (ch === "\u007f") { // C
                this.resetInput();
            } else if (ch === "\u0008") { // ->
                this.eraseBackword();
            } else if (NUMBER_CHARS.indexOf(ch) != -1) {
                this._appendCharNumber(ch);
            } else if (BINARY_CHARS.indexOf(ch) != -1) {
                this._appendCharBinary(ch);
            } else if (ch === "=") {
                this._appendCharEquals();
            } else {
                return false;
            }
            return true;
        },
        
        /**
         * Resets all the states.
         */
        reset: function () {
            this.resetInput();
            this._accumulator = 0;
            this._operand = null;
            this._operator = null;
            this._display.setOperator("");
        },
        
        /**
         * Resets the current input to 0.
         */
        resetInput: function () {
            this._currentInput = "0";
            this._display.setText("0");
        },
        
        /**
         * Erases the last character from the input.
         */
        eraseBackword: function () {
            var currentInput = this._currentInput;
            if (currentInput !== null) {
                currentInput = currentInput.substr(0, currentInput.length - 1);
                if (currentInput === "") currentInput = "0";
                this._currentInput = currentInput;
                this._display.setText(currentInput);
            }
        },
        
        _appendCharNumber: function (ch) {
            var currentInput = this._currentInput;
            if (currentInput === null) currentInput = "0";
            if (ch == ".") {
                if (currentInput.indexOf(".") != -1) return;
            } else {
                if (currentInput === "0") currentInput = "";
            }
            currentInput += ch;
            this._currentInput = currentInput;
            this._display.setText(currentInput);
        },
        
        _appendCharBinary: function (ch) {
            if (this._operand !== null) {
                // This happens after "=".
                this._operator = null;
                this._operand = null;
            }
            this._prepareOperand();
            this._applyOperator();
            this._currentInput = null;
            this._operator = ch;
            this._operand = null;
            this._display.setOperator(ch);
        },
        
        _appendCharEquals: function () {
            this._prepareOperand();
            this._applyOperator();
            this._currentInput = null;
            this._display.setOperator("");
        },

        _prepareOperand: function () {
            if (this._currentInput !== null) {
                this._operand = parseFloat(this._currentInput);
            } else if (this._operand === null) {
                this._operand = this._accumulator;
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
            }
        })
    };

    Keypad.prototype = {
        click: function (callback) {
            this._onclick = callback;
        }
    };

    calc.Calculator = Calculator;
    calc.Display = Display;
    calc.Keypad = Keypad;
    
    return calc;
}(calc || {});