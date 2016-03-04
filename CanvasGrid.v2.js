var CanvasGrid = Object.create(HTMLElement.prototype);

CanvasGrid.createdCallback = function () {
    var _this = this;
    _this.props = {
        'height': ['containerProperties', 'proposedHeight'], 'width': ['containerProperties', 'proposedWidth'], 'rows': ['gridProperties', 'rows'], 'cols': ['gridProperties', 'cols'], 'gridlinescolor': ['gridProperties', 'background', 'color'],
        'colstartindex': ['dynamicProperties', 'colStartIndex'], 'rowstartindex': ['dynamicProperties', 'rowStartIndex'], 'rowheight': ['cellProperties', 'height'], 'colwidth': ['cellProperties', 'width']
    };
    _this.state = CanvasGrid.getInitialState();
    _this.callbackMethods = {};

    var propNames = Object.keys(_this.props);
    propNames.forEach(function (propName) {
        var propValue = _this.getAttribute(propName);
        CanvasGrid.updateProp(_this, propName, propValue)
    });

    //main container
    _this.mainContainer = document.createElement('div');
    _this.mainContainer.style.background = 'yellow';
    _this.mainContainer.style.position = 'relative';
    _this.appendChild(_this.mainContainer);


    //Canvas element
    _this.mainGrid = document.createElement('canvas');
    _this.mainGrid.style.position = 'absolute';
    _this.mainGrid.style.left = 0;
    _this.mainGrid.style.top = 0;
    _this.mainCtx = _this.mainGrid.getContext('2d');
    _this.mainContainer.appendChild(_this.mainGrid);

    //Canvas element
    _this.grid = document.createElement('canvas');
    _this.grid.style.position = 'relative';
    _this.grid.style.left = 0;
    _this.grid.style.top = 0;
    _this.ctx = _this.grid.getContext('2d');

    //extra layer to handle events
    _this.eventLayer = document.createElement('div');
    _this.eventLayer.style.background = 'transparent';
    _this.eventLayer.style.position = 'absolute';
    _this.eventLayer.style.left = 0;
    _this.eventLayer.style.top = 0;
    _this.eventLayer.setAttribute('tabindex', "0");
    _this.mainContainer.appendChild(_this.eventLayer);

    _this.appendChild(_this.mainContainer);

    //bind events
    CanvasGrid.bindEvents(_this);

    //finally render canvas
    CanvasGrid.render(_this);
};

CanvasGrid.bindEvents = function (_this) {
    //scroll events

    //mouse events
    _this.eventLayer.addEventListener('wheel', function (e) {
        //console.log(e.wheelDeltaX, e.wheelDeltaY);
        var deltaRows = 0, deltaCols = 0;
        if (e.wheelDeltaY != 0) {
            deltaRows = Math.floor(e.wheelDeltaY / _this.state.cellProperties.height);
        }
        if (e.wheelDeltaX != 0) {
            deltaCols = Math.floor(e.wheelDeltaX / _this.state.cellProperties.width);
        }
        updateStartRowCol(_this, deltaRows, deltaCols);
    });
    _this.eventLayer.addEventListener('touchmove', function (e) {

    });
    
    //Key events
    _this.eventLayer.addEventListener('keydown', function (e) {
        if (e.keyCode === 40) {
            updateStartRowCol(_this, 1, 0);
        }
        else if (e.keyCode === 38) {
            updateStartRowCol(_this, -1, 0);
        }
        else if (e.keyCode === 39) {
            updateStartRowCol(_this, 0, 1);
        }
        else if (e.keyCode === 37) {
            updateStartRowCol(_this, 0, -1);
        }
        else if (e.keyCode === 34) {
            updateStartRowCol(_this, _this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex, 0);
        }
        else {
            console.log(e.keyCode);
        }
    });

    function updateStartRowCol(_this, deltaRows, deltaCols) {
        //console.log(_this.state.dynamicProperties.rowStartIndex, _this.state.dynamicProperties.rowEndIndex, deltaRows);
        var needUpdate = false;
        if (deltaRows != 0) {
            var newPos = _this.state.dynamicProperties.rowStartIndex;
            if (deltaRows > 0) {
                if (deltaRows + _this.state.dynamicProperties.rowEndIndex > ((+_this.state.gridProperties.rows) - 1)) {
                    deltaRows = ((+_this.state.gridProperties.rows) - 1) - _this.state.dynamicProperties.rowEndIndex;
                }
            }
            else if (deltaRows < 0) {
                if (newPos + deltaRows < 0) {
                    deltaRows = 0 - newPos;
                }
            }
            _this.state.dynamicProperties.rowStartIndex = newPos + deltaRows;
            needUpdate = true;
        }
        if (deltaCols != 0) {
            var newPos = _this.state.dynamicProperties.colStartIndex;
            if (deltaCols > 0) {
                if (deltaCols + _this.state.dynamicProperties.colEndIndex > ((+_this.state.gridProperties.cols) - 1)) {
                    deltaCols = ((+_this.state.gridProperties.cols) - 1) - _this.state.dynamicProperties.colEndIndex;
                }
            }
            else if (deltaCols < 0) {
                if (newPos + deltaCols < 0) {
                    deltaCols = 0 - newPos;
                }
            }
            _this.state.dynamicProperties.colStartIndex = newPos + deltaCols;
            needUpdate = true;
        }
        if (needUpdate === true) {
            CanvasGrid.render(_this);
        }
    }
};

CanvasGrid.updateProp = function (_this, propName, propValue) {
    propName = propName.toLowerCase();
    if (propValue != null) {
        if (!isNaN(+propValue))
            propValue = +propValue;
        var s = _this.state;
        var status = _this.props[propName].every(function (child, childIndex) {
            if (s.hasOwnProperty(child)) {
                if (childIndex === (_this.props[propName].length - 1)) {
                    s[child] = propValue;
                }
                else {
                    s = s[child];
                }
                return true;
            }
            return false;
        });
        if (status === false) {
            console.error("Invalid Property : " + propName);
        }
    }
    if (_this.state.dynamicProperties.renderTimeoutInterval != null) {
        clearInterval(_this.state.dynamicProperties.renderTimeoutInterval);
    }
    _this.state.dynamicProperties.renderTimeoutInterval = setTimeout(function () {
        CanvasGrid.render(_this);
    }, 1);
}


CanvasGrid.attributeChangedCallback = function (attrName, oldVal, newVal) {
    var _this = this;
    //console.log(attrName, oldVal, newVal, this.state);
    CanvasGrid.updateProp(_this, attrName, newVal);
}

CanvasGrid.render = function (_this) {
    _this.state.dynamicProperties.rowStartIndex = +_this.state.dynamicProperties.rowStartIndex;
    _this.state.dynamicProperties.colStartIndex = +_this.state.dynamicProperties.colStartIndex;

    if (_this.state.containerProperties.proposedHeight !== _this.state.containerProperties.height) {
        _this.mainContainer.style.height = _this.state.containerProperties.proposedHeight;
        _this.state.containerProperties.height = _this.mainContainer.offsetHeight;
        _this.state.containerProperties.proposedHeight = _this.state.containerProperties.height;
    }
    if (_this.state.containerProperties.proposedWidth !== _this.state.containerProperties.width) {
        _this.mainContainer.style.width = _this.state.containerProperties.proposedWidth;
        _this.state.containerProperties.width = _this.mainContainer.offsetWidth;
        _this.state.containerProperties.proposedWidth = _this.state.containerProperties.width;
    }

    //var totalWidth = (_this.state.gridProperties.cols + (_this.state.gridProperties.showRowNumber == true ? 1 : 0)) * _this.state.cellProperties.width;
    //var totalHeight = (_this.state.gridProperties.rows + (_this.state.gridProperties.showColumnName == true ? 1 : 0)) * _this.state.cellProperties.height;

    var gridWidth = _this.state.containerProperties.width;// - 30;
    //if (gridWidth > totalWidth)
    //    gridWidth = totalWidth;

    var gridHeight = _this.state.containerProperties.height;// - 30;
    //if (gridHeight > totalHeight)
    //    gridHeight = totalHeight;

    if (_this.state.gridProperties.width !== gridWidth) {
        _this.state.gridProperties.width = gridWidth;
        _this.grid.width = _this.state.gridProperties.width;
        _this.mainGrid.width = _this.state.gridProperties.width;
        _this.eventLayer.style.width = _this.state.gridProperties.width + 'px';
    }

    if (_this.state.gridProperties.height !== gridHeight) {
        _this.state.gridProperties.height = gridHeight;
        _this.grid.height = _this.state.gridProperties.height;
        _this.mainGrid.height = _this.state.gridProperties.height;
        _this.eventLayer.style.height = _this.state.gridProperties.height + 'px';
    }

    CanvasGrid.renderGrid(_this);
};

CanvasGrid.renderGrid = function (_this) {
    //Clear entire canvas
    _this.ctx.clearRect(0, 0, _this.grid.width, _this.grid.height);

    var gridWidth = _this.state.containerProperties.width;// - 30;
    var gridHeight = _this.state.containerProperties.height;// - 30;
    _this.state.dynamicProperties.rowEndIndex = _this.state.dynamicProperties.rowStartIndex + Math.ceil((gridHeight - (_this.state.gridProperties.showColumnName == true ? 1 : 0) * _this.state.cellProperties.height) / _this.state.cellProperties.height) - 1;
    if (_this.state.dynamicProperties.rowEndIndex > (_this.state.gridProperties.rows - 1))
        _this.state.dynamicProperties.rowEndIndex = (_this.state.gridProperties.rows - 1);

    var currCol = _this.state.dynamicProperties.colStartIndex;
    var currRow = _this.state.dynamicProperties.rowStartIndex;
    var currX = 0, currY = 0;
    var startX = 0, startY = 0;
    var gridDataStartX = 0, gridDataStartY = 0;
    var endX = 0, endY = 0;
    var currWidth = _this.state.cellProperties.width;
    var currHeight = _this.state.cellProperties.height;

    if (_this.state.gridProperties.showRowNumber == true) {
        currRow--;
        var maxNumberText = CanvasGrid.measureText(_this, ' ' + (_this.state.dynamicProperties.rowEndIndex + 1) + ' ', _this.state.cellProperties.textStyle);
        currWidth = Math.ceil(maxNumberText.width);
        gridDataStartX = currWidth;
        // draw row number
        while (currY <= _this.grid.height && currRow <= _this.state.dynamicProperties.rowEndIndex) {
            if (currRow >= _this.state.dynamicProperties.rowStartIndex) {
                startX = 0;
                endX = startX + currWidth;
                startY = currY;
                endY = currY + currHeight;
                CanvasGrid.drawCell(_this, startX, startY, endX, endY, '' + (currRow + 1), _this.state.cellProperties, true);
            }
            else if (_this.state.gridProperties.showColumnName == true) {
                startX = 0;
                endX = startX + currWidth;
                startY = currY;
                endY = currY + currHeight;
                CanvasGrid.drawCell(_this, startX, startY, endX, endY, '', _this.state.cellProperties, true);
            }
            else {
                currY -= currHeight;
            }
            // update Y position and row index
            currY += currHeight;
            currRow++;
        }
    }

    _this.state.dynamicProperties.colEndIndex = _this.state.dynamicProperties.colStartIndex + Math.ceil((gridWidth - gridDataStartX) / _this.state.cellProperties.width) - 1;
    if (_this.state.dynamicProperties.colEndIndex > (_this.state.gridProperties.cols - 1))
        _this.state.dynamicProperties.colEndIndex = (_this.state.gridProperties.cols - 1);

    if (_this.state.gridProperties.showColumnName == true) {
        currWidth = _this.state.cellProperties.width;
        currHeight = _this.state.cellProperties.height;
        gridDataStartY = currHeight;
        currX = gridDataStartX;
        // draw col number
        while (currX <= _this.grid.width && currCol <= _this.state.dynamicProperties.colEndIndex) {
            startY = 0;
            endY = currHeight;
            startX = currX;
            endX = currX + currWidth;
            CanvasGrid.drawCell(_this, startX, startY, endX, endY, 'C' + (currCol + 1), _this.state.cellProperties, true);
            // update X position and column index
            currX += currWidth;
            currCol++;
        }
    }

    if (_this.callbackMethods['getData']) {
        if (_this.state.dynamicProperties.getDataTimeoutInterval != null) {
            clearTimeout(_this.state.dynamicProperties.getDataTimeoutInterval);
        }
        _this.state.dynamicProperties.getDataTimeoutInterval = setTimeout(function () {
            drawGridData(_this);
        }, 10);
        _this.callbackMethods['getData'].counter++;
        _this.callbackMethods['getData'].callback(_this.callbackMethods['getData'].counter, _this.state.dynamicProperties.rowStartIndex, _this.state.dynamicProperties.colStartIndex, _this.state.dynamicProperties.rowEndIndex, _this.state.dynamicProperties.colEndIndex, function (counter, data) {
            if (_this.callbackMethods['getData'].counter === counter) {
                if (_this.state.dynamicProperties.getDataTimeoutInterval != null) {
                    clearTimeout(_this.state.dynamicProperties.getDataTimeoutInterval);
                }
                drawGridData(_this, data);
            }
        });
    }
    else {
        drawGridData(_this);
    }

    function drawGridData(_this, gridData) {
        if (_this.state.dynamicProperties.gridDataRenderTimeoutInterval != null) {
            clearInterval(_this.state.dynamicProperties.gridDataRenderTimeoutInterval);
        }
        _this.state.dynamicProperties.gridDataRenderTimeoutInterval = setTimeout(function () {
            drawGridDataMain(_this, gridData);
        }, 1);
    }
    function drawGridDataMain(_this, gridData) {
        if (gridData == null) {
            gridData = new Array(_this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex + 1);
        }

        currWidth = _this.state.cellProperties.width;
        currHeight = _this.state.cellProperties.height;
        currY = gridDataStartY;
        currRow = 0;
        while (currY <= _this.grid.height && currRow < gridData.length) {
            startY = currY;
            endY = currY + currHeight;
            var rowData = gridData[currRow];
            if (rowData == null) {
                rowData = new Array(_this.state.dynamicProperties.colEndIndex - _this.state.dynamicProperties.colStartIndex + 1)
            }

            currX = gridDataStartX;
            currCol = 0;
            while (currX <= _this.grid.width && currCol < rowData.length) {
                startX = currX;
                endX = currX + currWidth;

                CanvasGrid.drawCell(_this, startX, startY, endX, endY, rowData[currCol] == null ? '-' : rowData[currCol], _this.state.cellProperties, true);
                // update Y position and row index
                currX += currWidth;
                currCol++;
            }
            // update Y position and row index
            currY += currHeight;
            currRow++;
        }
        gridData = null;
        _this.mainCtx.drawImage(_this.grid, 0, 0, 2000, 1000, 0, 0, 2000, 1000);
    }
    //console.log(_this.state.dynamicProperties.rowStartIndex, _this.state.dynamicProperties.rowEndIndex);
    _this.eventLayer.focus();
    //var event = new CustomEvent('get-data', { 'startCol': elem.dataset.time });
};

CanvasGrid.drawCell = function (_this, x0, y0, x1, y1, text, cellProperties, clear) {
    // clear cell before 
    if (clear !== false) {
        _this.ctx.beginPath();
        _this.ctx.rect(x0, y0, (x1 - x0), (y1 - y0));
        _this.ctx.fillStyle = cellProperties.background.color;
        _this.ctx.strokeStyle = _this.state.gridProperties.background.color;
        _this.ctx.lineWidth = 0.5;
        _this.ctx.stroke();
        _this.ctx.fill();
    }
    if (text.trim() !== '') {
        CanvasGrid.drawText(_this, x0, y0, x1, y1, text, cellProperties.textStyle);
    }
}

CanvasGrid.measureText = function (_this, text, textStyle) {
    _this.ctx.textAlign = textStyle.textAlign;
    _this.ctx.textBaseline = textStyle.textBaseline;
    var fontText = '';
    fontText += textStyle.size + 'pt ';
    fontText += textStyle.family + ' ';
    if (textStyle.bold)
        fontText += 'bold ';
    if (textStyle.italics)
        fontText += 'italic ';

    _this.ctx.font = fontText;

    //console.log(text, _this.ctx.measureText(text).width);
    return _this.ctx.measureText(text);
}

CanvasGrid.drawText = function (_this, x0, y0, x1, y1, text, textStyle) {
    _this.ctx.textAlign = textStyle.textAlign;
    _this.ctx.textBaseline = textStyle.textBaseline;
    var fontText = '';
    fontText += textStyle.size + 'pt ';
    fontText += textStyle.family + ' ';
    if (textStyle.bold)
        fontText += 'bold ';
    if (textStyle.italics)
        fontText += 'italic ';

    _this.ctx.font = fontText;

    var offsetX = 0;
    if (_this.ctx.textAlign == 'left') {
        offsetX = 5;
    }
    else if (_this.ctx.textAlign == 'right') {
        offsetX = (x1 - x0) - 5;
    }
    else if (_this.ctx.textAlign == 'center') {
        offsetX = ((x1 - x0) / 2);
    }

    var offsetY = 0;
    if (_this.ctx.textBaseline == 'bottom') {
        offsetY = (y1 - y0) - 1;
    }
    else if (_this.ctx.textBaseline == 'top') {
        offsetY = 1;
    }
    else if (_this.ctx.textBaseline == 'middle') {
        offsetY = ((y1 - y0) / 2);
    }

    _this.ctx.fillStyle = textStyle.color;
    _this.ctx.fillText(text, x0 + offsetX, y0 + offsetY);

    //var lineHeight = dataObj.formatting.font.size + parseInt(dataObj.formatting.font.size / 2.5);
    //var lines = wrapText(context, text, (x1 - x0) - 10, lineHeight);
    //var cellHeight = (lineHeight * lines.length) + 2;
    //if (cellHeight <= (y1 - y0)) {
    //    for (var l = 0; l < lines.length; l++) {
    //        if (context.textBaseline == 'top')
    //            context.fillText(lines[l], x0 + offsetX, y0 + offsetY + (l * lineHeight));
    //        else if (context.textBaseline == 'bottom')
    //            context.fillText(lines[l], x0 + offsetX, y0 + offsetY + (l - (lines.length - 1)) * lineHeight);
    //        else {
    //            context.fillText(lines[l], x0 + offsetX, y0 + offsetY + (l - (lines.length - 1)) * lineHeight + ((lines.length - 1) * lineHeight) / 2);
    //        }
    //    }
    //    return false;
    //} else {
    //    vScroll.find('div').css('height', parseFloat(vScroll.find('div').css('height')) + ((cellHeight - ((y1 - y0) - data[i].height)) - data[i].height));
    //    data[i].height += (cellHeight - ((y1 - y0) - data[i].height)) - data[i].height;
    //    return true;
    //    //return false;
    //}
}

CanvasGrid.setCallbackMethod = function (eventName, cb) {
    var _this = this;
    _this.callbackMethods[eventName] = { callback: cb, counter: 0 };
}

CanvasGrid.getInitialState = function () {
    var defaultBackground = {
        color: '#FCFCFC',
        img: null
    };

    var defaultBorderSingle = {
        width: 1,
        style: 'solid',
        color: 'black'
    };

    var defaultBorder = {
        left: utilLibrary.extend(true, {}, defaultBorderSingle),
        right: utilLibrary.extend(true, {}, defaultBorderSingle),
        top: utilLibrary.extend(true, {}, defaultBorderSingle),
        bottom: utilLibrary.extend(true, {}, defaultBorderSingle)
    }

    var containerProperties = {
        proposedHeight: 500,
        proposedWidth: 500,
        height: 0,
        width: 0,
        background: utilLibrary.extend(true, {}, defaultBackground),
        border: utilLibrary.extend(true, {}, defaultBorder)
    }

    var defaultTextStyle = {
        textAlign: 'center',
        textBaseline: 'middle',
        size: 11,
        family: 'Calibri',
        bold: false,
        italics: false,
        color: 'black'
    };

    var gridProperties = {
        height: 0,
        width: 0,
        rows: 1,
        cols: 1,
        showRowNumber: true,
        showColumnName: true,
        background: utilLibrary.extend(true, {}, defaultBackground),
        border: utilLibrary.extend(true, {}, defaultBorder)
    }

    var cellProperties = {
        height: 18,
        width: 100,
        background: utilLibrary.extend(true, {}, defaultBackground),
        border: utilLibrary.extend(true, {}, defaultBorder),
        textStyle: utilLibrary.extend(true, {}, defaultTextStyle)
    }

    var dynamicProperties = {
        rowStartIndex: 0,
        colStartIndex: 0,
        rowEndIndex: 0,
        colEndIndex: 0,
        freezeRowIndex: 0,
        freezeColIndex: 0
    }

    var defaultState = {
        containerProperties: containerProperties,
        gridProperties: gridProperties,
        cellProperties: cellProperties,
        dynamicProperties: dynamicProperties
    }
    return utilLibrary.extend(true, {}, defaultState);
}

document.registerElement('canvas-grid', {
    prototype: CanvasGrid
});

var utilLibrary = {
    extend: function () {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false,
		toString = Object.prototype.toString,
		hasOwn = Object.prototype.hasOwnProperty,
		push = Array.prototype.push,
		slice = Array.prototype.slice,
		trim = String.prototype.trim,
		indexOf = Array.prototype.indexOf,
		class2type = {
		    "[object Boolean]": "boolean",
		    "[object Number]": "number",
		    "[object String]": "string",
		    "[object Function]": "function",
		    "[object Array]": "array",
		    "[object Date]": "date",
		    "[object RegExp]": "regexp",
		    "[object Object]": "object"
		},
		jQ = {
		    isFunction: function (obj) {
		        return jQ.type(obj) === "function"
		    },
		    isArray: Array.isArray ||
			function (obj) {
			    return jQ.type(obj) === "array"
			},
		    isWindow: function (obj) {
		        return obj != null && obj == obj.window
		    },
		    isNumeric: function (obj) {
		        return !isNaN(parseFloat(obj)) && isFinite(obj)
		    },
		    type: function (obj) {
		        return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
		    },
		    isPlainObject: function (obj) {
		        if (!obj || jQ.type(obj) !== "object" || obj.nodeType) {
		            return false
		        }
		        try {
		            if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
		                return false
		            }
		        } catch (e) {
		            return false
		        }
		        var key;
		        for (key in obj) { }
		        return key === undefined || hasOwn.call(obj, key)
		    }
		};
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            i = 2;
        }
        if (typeof target !== "object" && !jQ.isFunction(target)) {
            target = {}
        }
        if (length === i) {
            target = this;
            --i;
        }
        for (i; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];
                    if (target === copy) {
                        continue
                    }
                    if (deep && copy && (jQ.isPlainObject(copy) || (copyIsArray = jQ.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && jQ.isArray(src) ? src : []
                        } else {
                            clone = src && jQ.isPlainObject(src) ? src : {};
                        }
                        // WARNING: RECURSION
                        target[name] = utilLibrary.extend(deep, clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }
        return target;
    }
}