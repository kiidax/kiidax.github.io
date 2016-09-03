var calcemu = (function () {
    "use strict";

    var labelLists = '% MC MR M- M+ \u221a 7 8 9 \u00f7 C 4 5 6 \u00d7 AC 1 2 3 - _ 0 . = +'.split(' ');
    var idLists = '% mc mr m- m+ sqrt 7 8 9 / c 4 5 6 * ac 1 2 3 - _ 0 . = +'.split(' ');
    var keyLists = '% _ ^ < > ! 7 8 9 / c 4 5 6 * c 1 2 3 - _ 0 . = +'.split(' ');
    var keyAliasLists = '% f m s a r 7 8 9 / c 4 5 6 * Escape 1 2 3 - # 0 . Enter +'.split(' ');
    var classLists = 'o m m m m o n n n o c n n n o c n n n o _ n n o o'.split(' ').map(function (x) {
        return {
            'o': 'operator',
            'n': 'number',
            'c': 'controller',
            'm': 'memory',
            '_': 'none'
        }[x];
    });
    var operatorLabels = { '+': '+', '-': '-', '*': '\u00d7', '/': '\u00f7'};

    function CalcPad(element, columns) {
        var that = this;
        this.element = element;
        this.columns = columns;
        var tableElement = document.createElement('table');
        this.tableElement = tableElement;
        tableElement.tabIndex = 0;
        tableElement.className = 'calcemu-calcpad';
        tableElement.addEventListener('keydown', function (event) {
            for (var i = 0; i < keyAliasLists.length; i++) {
                if (keyAliasLists[i] == event.key) {
                    that.onButtonClick(idLists[i]);
                    return;
                }
            }
            for (var i = 0; i < keyLists.length; i++) {
                if (keyLists[i] == event.key) {
                    that.onButtonClick(idLists[i]);
                    return;
                }
            }
        });
        this.element.appendChild(tableElement);

        this._displayText = null;
        this._memory = null;
        this._operator = null;

        var displayContainerElement = document.createElement('tr');
        tableElement.appendChild(displayContainerElement);

        var displayElement = document.createElement('td');
        displayElement.className = 'calcemu-display'
        displayElement.colSpan = 5;
        displayContainerElement.appendChild(displayElement);

        this.memoryElement = document.createElement('span');
        this.memoryElement.innerHTML = 'M';
        displayElement.appendChild(this.memoryElement);

        this.operatorElement = document.createElement('span');
        displayElement.appendChild(this.operatorElement);

        this.numberElement = document.createElement('input');
        this.numberElement.size = 1;
        displayElement.appendChild(this.numberElement);

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
            this.numberElement.value = value;
        },
        set memory(value) {
            this._memory = value;
            if (value) {
                this.memoryElement.style.visibility = 'visible';
            } else {
                this.memoryElement.style.visibility = 'hidden';
            }
        },
        set operator(value) {
            this._operator = value;
            if (value) {
                this.operatorElement.innerHTML = operatorLabels[value];
            } else {
                this.operatorElement.innerHTML = '';
            }
        },
        focus: function () {
            this.tableElement.focus();
        }
    }

    function Calculator(element, columns) {
        var that = this;
        this.columns = columns || 10;
        this.calcPad = new CalcPad(element, this.columns);
        this.calcPad.onButtonClick = function (buttonId) {
            if ('0123456789'.indexOf(buttonId) >= 0) {
                that.pressNumber(buttonId);
            } else if (buttonId == '.') {
                that.pressDot(buttonId);
            } else if ('+-*/'.indexOf(buttonId) >= 0) {
                that.pressOperator(buttonId);
            } else if (buttonId == '=') {
                that.pressEnter();
            } else if (buttonId == '%') {
                that.pressPercent();
            } else if (buttonId == 'sqrt') {
                that.pressSqrt();
            } else if (buttonId == 'mc') {
                that.memoryClear();
            } else if (buttonId == 'mr') {
                that.recallMemory();
            } else if (buttonId == 'm+') {
                that.applyMemoryOperator('+');
            } else if (buttonId == 'm-') {
                that.applyMemoryOperator('-');
            } else if (buttonId == 'ac') {
                that.clear(true);
            } else if (buttonId == 'c') {
                that.clear(false);
            } else {
                console.log('key: ' + buttonId);
                return;
            }
            console.log('state: ' + that);
        };
        this.memoryClear();
        this.clear(true);
    }

    Calculator.prototype = {
        pressNumber: function (buttonId) {
            if (this.inputText.indexOf('.') >= 0) {
                if (this.inputText.length >= this.columns + 1)
                    return;
            } else {
                if (this.inputText.length >= this.columns)
                    return;
            }
            this.inputText += buttonId;
            this.calcPad.displayText = this.inputText;
        },
        pressDot: function (buttonId) {
            if (this.inputText.indexOf('.') < 0) {
                this.inputText += '.';
                this.calcPad.displayText = this.inputText;
            }
        },
        pressOperator: function (buttonId) {
            if (this.inputText.length > 0) {
                if (this.isInputForResult) {
                    this.resultValue = parseFloat(this.inputText);
                    this.operator = null;
                } else {
                    this.operandValue = parseFloat(this.inputText);
                }
                this.applyOperator();
                this.operator = buttonId;
                this.calcPad.operator = buttonId;
                this.isInputForResult = false;
            } else {
                this.operator = buttonId;
                if (this.isInputForResult) {
                    this.isInputForResult = false;
                } else {
                    // The case like 123++. Set the operand so that
                    // 456= results 456+123.
                    this.operandValue = this.resultValue;
                    this.isInputForResult = true;
                    this.operator = buttonId;
                }
            }
        },
        pressEnter: function () {
            if (this.inputText.length > 0) {
                if (this.isInputForResult) {
                    this.resultValue = parseFloat(this.inputText);
                } else {
                    this.operandValue = parseFloat(this.inputText);
                }
            }
            this.applyOperator();
            this.isInputForResult = true;
            this.calcPad.operator = null;
        },
        pressPercent: function () {
            if (this.inputText.length > 0) {
                if (this.isInputForResult) {
                    this.resultValue = parseFloat(this.inputText);
                } else {
                    this.operandValue = parseFloat(this.inputText);
                }
            }
            this.applyPercent();
            this.isInputForResult = true;
            this.calcPad.operator = null;
        },
        pressSqrt: function () {
            if (this.isInputForResult) {
                this.resultValue = parseFloat(this.inputText);
                var x = Math.sqrt(this.resultValue);
                x = normalizeNumber(x, this.columns);            
                this.resultValue = x;
                this.calcPad.displayText = x;
            } else {
                this.operandValue = parseFloat(this.inputText);
                var x = Math.sqrt(this.operandValue);
                x = normalizeNumber(x, this.columns);            
                this.operandValue = x;
                this.calcPad.displayText = x;                
            }
            this.inputText = '';
        },
        focus: function () {
            this.calcPad.focus();
        },
        memoryClear: function () {
            this.memoryValue = null;
            this.calcPad.memory = false;
        },
        clear: function (all) {
            if (all) {
                this.isInputForResult = true;
                this.resultValue = 0.0;
                this.operandValue = 0.0;
                this.operator = null;
                this.calcPad.operator = null;
            }
            this.inputText = '';
            this.calcPad.displayText = '0';
        },
        recallMemory: function () {
            if (this.memoryValue !== null) {
                var value = this.memoryValue.toString();
                this.inputText = value;
                this.calcPad.displayText = value;
            }
        },
        applyMemoryOperator: function (operator) {
            this.pressEnter();
            if (this.memoryValue === null) {
                this.memoryValue = 0.0;
            }
            if (operator == '+') {
                this.memoryValue += this.resultValue;
            } else if (operator == '-') {
                this.memoryValue -= this.resultValue;
            }
            this.calcPad.memory = true;
        },
        applyOperator: function () {
            this.inputText = '';

            var x = this.resultValue;
            var y = this.operandValue;
            switch (this.operator) {
                case '+': x += y; break;
                case '-': x -= y; break;
                case '*': x *= y; break;
                case '/': x /= y; break;
            }
            x = normalizeNumber(x, this.columns);
            if (x !== null) {
                console.log('result=' + x);
                this.resultValue = x;
                this.calcPad.displayText = x.toString();
            } else {
                this.calcPad.displayText = 'E';
            }
        },        
        applyPercent: function () {
            this.inputText = '';

            var x = this.resultValue;
            var y = this.operandValue;
            switch (this.operator) {
                case '+': x *= (100.0 + y) / 100.0; break;
                case '-': x -= (100.0 - y) / 100.0; break;
                case '*': x *= y / 100.0; break;
                case '/': x /= y / 100.0; break;
            }
            x = normalizeNumber(x, this.columns);
            if (x !== null) {
                console.log('result=' + x);
                // 24800*3%+= results 25544.
                this.operandValue = x;
                this.calcPad.displayText = x.toString();
            } else {
                this.calcPad.displayText = 'E';
            }
        },
        toString: function () {
            var str = '[object Calculator(';
            str += 'inputText=' + this.inputText;
            str += ', operandValue=' + this.operandValue;
            str += ', resultValue=' + this.resultValue;
            str += ', memoryValue=' + this.memoryValue;
            str += ', operator=' + this.operator;
            str += ', isInputForResult=' + this.isInputForResult;
            str += ')]';
            return str;
        }
    };

    function normalizeNumber(x, columns) {
        x = x.toString();
        if (!/^-?[0-9.]+/.test(x)) return null;
        var pos = x.indexOf('.');
        if (pos > columns) {
            return null;
        } else if (pos >= 0) {
            x = x.substring(0, columns + 1);
        } else {
            if (x.length > columns) return null;
        }
        return parseFloat(x);
    }

    return {
        'Calculator': Calculator
    };
})();