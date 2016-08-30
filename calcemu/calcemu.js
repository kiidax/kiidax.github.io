var calcemu = (function () {
    "use strict";

    var labelLists = '% MC MR M- M+ \u221a 7 8 9 \u00f7 C 4 5 6 \u00d7 AC 1 2 3 - _ 0 . = +'.split(' ');
    var idLists = '% mc mr m- m+ sqrt 7 8 9 / c 4 5 6 * ac 1 2 3 - _ 0 . = +'.split(' ');
    var keyLists = '% f m s a r 7 8 9 / c 4 5 6 * c 1 2 3 - _ 0 . = +'.split(' ');
    var classLists = 'o m m m m o n n n o c n n n o c n n n o _ n n o o'.split(' ').map(function (x) {
        switch (x) {
            case 'o': return 'operator';
            case 'n': return 'number';
            case 'c': return 'controller';
            case 'm': return 'memory';
        }
    });

    function CalcPad(element) {
        var that = this;
        this.element = element;
        var tableElement = document.createElement('table');
        tableElement.className = 'calcemu-calcpad';
        tableElement.addEventListener('keydown', function (event) {
            that.onButtonClick(event.key);
        });
        this.element.appendChild(tableElement);

        this._displayText = null;
        this.displayElement = document.createElement('td');
        this.displayElement.className = 'calcemu-display'
        this.displayElement.colSpan = 5;
        tableElement.appendChild(this.displayElement);

        var titleContainerElement = document.createElement('tr');
        tableElement.appendChild(titleContainerElement);
        var titleElement = document.createElement('td');
        titleElement.colSpan = 5;
        titleElement.innerHTML = '<div class="calcemu-logo">Calculator Emulator</div>';
        titleContainerElement.appendChild(titleElement);

        for (var i = 0; i < 5; i++) {
            var rowElement = document.createElement('tr');
            tableElement.appendChild(rowElement);
            for (var j = 0; j < 5; j++) {
                var cellElement = document.createElement('td');
                rowElement.appendChild(cellElement);
                var buttonElement = document.createElement('button');
                cellElement.appendChild(buttonElement);
                var index = i * 5 + j;
                var label = labelLists[index];
                var className = classLists[index];
                var labelText = document.createTextNode(label);
                buttonElement.appendChild(labelText);
                buttonElement.className = className;
                buttonElement.buttonId = idLists[index];
                buttonElement.addEventListener('click', function () {
                    that.onButtonClick(this.buttonId);
                });
            }
        }

        this.displayText = "0";
    }

    CalcPad.prototype = {
        set displayText(value) {
            this._displayText = value;
            this.displayElement.innerHTML = value;
        }
    }

    function Calculator(element) {
        var that = this;
        this.calcPad = new CalcPad(element);
        this.calcPad.onButtonClick = function (buttonId) {
            if ('0123456789'.indexOf(buttonId) >= 0) {
                that.pressNumber(buttonId);
            } else if (buttonId == '.') {
                that.pressDot(buttonId);
            } else if ('+-*/'.indexOf(buttonId) >= 0) {
                that.pressOperator(buttonId);
            } else if (buttonId == '=') {
                that.pressEnter(buttonId);
            } else if (buttonId == 'mc') {
                that.memoryClear();
            } else if (buttonId == 'ac') {
                that.clear(true);
            } else if (buttonId == 'c') {
                that.clear(false);
            } else {
                //window.alert(buttonId);
            }
            that.dumpState();
        };
        this.memoryClear();
        this.clear(true);
    }

    Calculator.prototype = {
        "pressNumber": function (buttonId) {
            this.inputText += buttonId;
            this.calcPad.displayText = this.inputText;
        },
        "pressDot": function (buttonId) {
            if (this.inputText.indexOf('.') < 0) {
                this.inputText += '.';
                this.calcPad.displayText = this.inputText;
            }
        },
        "pressOperator": function (buttonId) {
            if (this.inputText.length > 0) {
                this.operandValue = parseFloat(this.inputText);
                this.applyOperator();
            } else {
                this.operandValue = this.resultValue;
            }
            this.operator = buttonId;
        },
        "pressEnter": function (buttonId) {
            if (this.inputText.length > 0) {
                this.operandValue = parseFloat(this.inputText);
            }
            this.applyOperator();
        },
    };

    Calculator.prototype.applyOperator = function () {
        var x = this.resultValue;
        var y = this.operandValue;
        switch (this.operator) {
            case '+': x += y; break;
            case '-': x -= y; break;
            case '*': x *= y; break;
            case '/': x /= y; break;
            default: x = y; break;
        }
        this.resultValue = x;
        this.calcPad.displayText = x.toString();
        this.inputText = '';
    };
    
    Calculator.prototype.dumpState = function () {
        console.log('inputText: ' + this.inputText);
        console.log('resultValue: ' + this.resultValue);
        console.log('operator: ' + this.operator);
    };

    Calculator.prototype.memoryClear = function () {
        this.memoryValue = 0.0;
    };

    Calculator.prototype.clear = function (all) {
        this.inputText = '';
        this.resultValue = 0.0;
        this.operandValue = 0.0;
        this.operator = null;
        this.calcPad.displayText = '0';
    };

    return {
        'Calculator': Calculator
    };
})();