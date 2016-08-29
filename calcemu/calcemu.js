var calcemu = (function () {
    "use strict";

    var labelLists = '% MC MR M- M+ \u221a 7 8 9 \u00f7 C 4 5 6 \u00d7 AC 1 2 3 - _ 0 . = +'.split(' ');
    var idLists = '% mc mr m- m+ sqrt 7 8 9 / C 4 5 6 * AC 1 2 3 - _ 0 . = +'.split(' ');
    var keyLists = '% mc mr m- m+ sqrt 7 8 9 / C 4 5 6 * AC 1 2 3 - _ 0 . = +'.split(' ');

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
                var labelText = document.createTextNode(label);
                buttonElement.appendChild(labelText);
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
            } else {
                //window.alert(buttonId);
            }
            that.dumpState();
        };
        this.inputValue = '';
        this.memoryValue = 0.0;
        this.resultValue = 0.0;
        this.operandValue = 0.0;
        this.operator = null;
    }

    Calculator.prototype = {
        "pressNumber": function (buttonId) {
            this.inputValue += buttonId;
            this.calcPad.displayText = this.inputValue;
        },
        "pressDot": function (buttonId) {
            if (this.inputValue.indexOf('.') < 0) {
                this.inputValue += '.';
                this.calcPad.displayText = this.inputValue;
            }
        },
        "pressOperator": function (buttonId) {
            this.applyOperator();
            this.operator = buttonId;
            this.inputValue = '';
        },
        "pressEnter": function (buttonId) {
            this.applyOperator();
        },
        "applyOperator": function () {
            var x = parseFloat(this.resultValue);
            var y = parseFloat(this.inputValue);
            switch (this.operator) {
                case '+': x += y; break;
                case '-': x -= y; break;
                case '*': x *= y; break;
                case '/': x /= y; break;
                default: x = y; break;
            }
            this.resultValue = x.toString();
            this.calcPad.displayText = x.toString();
            this.inputValue = '';
        },
        "dumpState": function () {
            console.log('inputValue: ' + this.inputValue);
            console.log('resultValue: ' + this.resultValue);
            console.log('operator: ' + this.operator);
        }
    };

    return {
        'Calculator': Calculator
    };
})();