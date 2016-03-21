var CanvasGrid = Object.create(HTMLElement.prototype);

CanvasGrid.createdCallback = function () {
    var _this = this;
    _this.props = {
        'height': [['containerProperties', 'proposedHeight']], 'width': [['containerProperties', 'proposedWidth']], 'rows': [['gridProperties', 'rows']], 'cols': [['gridProperties', 'cols']], 'gridlinescolor': [['gridProperties', 'background', 'color'], ['cellProperties', 'border', 'left', 'color'], ['cellProperties', 'border', 'top', 'color'], ['cellProperties', 'border', 'right', 'color'], ['cellProperties', 'border', 'bottom', 'color']],
        'colstartindex': [['dynamicProperties', 'colStartIndex']], 'rowstartindex': [['dynamicProperties', 'rowStartIndex']], 'rowheight': [['cellProperties', 'height']], 'colwidth': [['cellProperties', 'width']], 'backgroundcolor': [['cellProperties', 'background', 'color']],
        'freezerowindex': [['dynamicProperties', 'freezeRowIndex']], 'freezecolindex': [['dynamicProperties', 'freezeColIndex']]
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
    _this.mainContainer.style.border = '1px solid #0F0F0F';
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

    //Canvas element for Cell
    _this.cell = document.createElement('canvas');
    _this.cell.style.position = 'relative';
    _this.cell.style.left = 0;
    _this.cell.style.top = 0;
    _this.cellCtx = _this.cell.getContext('2d');

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
    _this.eventLayer.addEventListener('wheel', function (e) {
        //console.log(e.wheelDeltaX, e.wheelDeltaY);

        var deltaX = -e.wheelDeltaX;
        var deltaY = -e.wheelDeltaY;

        var xDir = deltaX <= 0 ? -1 : 1;
        var yDir = deltaY <= 0 ? -1 : 1;


        var deltaRows = 0, deltaCols = 0;
        if (deltaX != 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
            deltaCols = Math.ceil(deltaX * xDir / _this.state.cellProperties.width);
        }
        else if (deltaY != 0) {
            deltaRows = Math.ceil(deltaY * yDir / _this.state.cellProperties.height);
        }

        updateStartRowCol(_this, deltaRows * yDir, deltaCols * xDir);
    });

    //touch events
    var touchStart = null;
    var touchEnd = null;
    var touchStartTime = 0;
    var touchEndTime = 1000;
    var touchSpeed = 10;
    d3.select(_this.eventLayer).on('touchstart', function (e) {
        d3.event.preventDefault();
        var coordinates = d3.touches(this);
        touchStart = coordinates[0];
        touchStartTime = new Date().getTime();
    });

    d3.select(_this.eventLayer).on('touchmove', function (e) {
        d3.event.preventDefault();
        var coordinates = d3.touches(this);
        touchEnd = coordinates[0];

        var deltaX = touchStart[0] - touchEnd[0];
        var deltaY = touchStart[1] - touchEnd[1];

        var xDir = deltaX <= 0 ? -1 : 1;
        var yDir = deltaY <= 0 ? -1 : 1;


        var deltaRows = 0, deltaCols = 0;
        if (deltaX != 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
            deltaCols = Math.ceil(deltaX * xDir / _this.state.cellProperties.width);
        }
        else if (deltaY != 0) {
            deltaRows = Math.ceil(deltaY * yDir / _this.state.cellProperties.height);
        }

        touchEndTime = new Date().getTime();
        updateStartRowCol(_this, deltaRows * yDir, deltaCols * xDir);

        if (deltaRows >= 3 || deltaCols >= 2) {
            var timeDiff = touchEndTime - touchStartTime;
            if (timeDiff < 100) {
                repeat = 2;
            }
            else if (timeDiff < 50) {
                repeat = 4;
            }
            else if (timeDiff < 25) {
                repeat = 6;
            }
            //d3.select("#events").append("div").text("multiplyFactor:" + multiplyFactor);
            var counter = 1;
            while (counter <= repeat) {
                setTimeout(function () {
                    updateStartRowCol(_this, deltaRows * yDir * repeat, deltaCols * xDir * repeat);
                }, Math.pow(2, counter) * 10);
                counter++;
            }
        }
        touchStart = touchEnd;
        touchStartTime = new Date().getTime();
    });

    d3.select(_this.eventLayer).on('touchend', function (e) {
        d3.event.preventDefault();
    });

    //Key events
    var keyDownLock = false;
    _this.eventLayer.addEventListener('keydown', function (e) {
        if (keyDownLock === true)
            return;

        keyDownLock = true;
        var deltaRows = 0;
        var deltaCols = 0;
        //down
        if (e.keyCode === 40) {
            deltaRows = 1;
            //updateStartRowCol(_this, 1, 0);
        }
            //up
        else if (e.keyCode === 38) {
            deltaRows = -1;
            //updateStartRowCol(_this, -1, 0);
        }
            //right
        else if (e.keyCode === 39) {
            deltaCols = 1;
            //updateStartRowCol(_this, 0, 1);
        }
            //left
        else if (e.keyCode === 37) {
            deltaCols = -1;
            //updateStartRowCol(_this, 0, -1);
        }
            //page down
        else if (e.keyCode === 34) {
            deltaRows = _this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex;
            //updateStartRowCol(_this, , 0);
        }
            //page up
        else if (e.keyCode === 33) {
            deltaRows = -(_this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex);
            //updateStartRowCol(_this, -(_this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex), 0);
        }
            //end
        else if (e.keyCode === 35) {
            deltaCols = -_this.state.dynamicProperties.colStartIndex;
            //updateStartRowCol(_this, 0, -_this.state.dynamicProperties.colStartIndex);
        }
            //home
        else if (e.keyCode === 36) {
            deltaCols = -_this.state.dynamicProperties.colStartIndex;
            //updateStartRowCol(_this, 0, -_this.state.dynamicProperties.colStartIndex);
        }
        else {
            console.log(e.keyCode);
        }
        updateStartRowCol(_this, deltaRows, deltaCols);
        setTimeout(function () {
            keyDownLock = false;
        }, 0)
    });

    var updateStartRowColLock = false;
    function updateStartRowCol(_this, deltaRows, deltaCols) {
        if (updateStartRowColLock === true)
            return;
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
                if (newPos + deltaRows < _this.state.dynamicProperties.freezeRowIndex) {
                    deltaRows = _this.state.dynamicProperties.freezeRowIndex - newPos;
                }
            }
            if (_this.state.dynamicProperties.rowStartIndex != newPos + deltaRows) {
                _this.state.dynamicProperties.rowStartIndex = newPos + deltaRows;
                needUpdate = true;
            }
        }
        if (deltaCols != 0) {
            var newPos = _this.state.dynamicProperties.colStartIndex;
            if (deltaCols > 0) {
                if (deltaCols + _this.state.dynamicProperties.colEndIndex > ((+_this.state.gridProperties.cols) - 1)) {
                    deltaCols = ((+_this.state.gridProperties.cols) - 1) - _this.state.dynamicProperties.colEndIndex;
                }
            }
            else if (deltaCols < 0) {
                if (newPos + deltaCols < _this.state.dynamicProperties.freezeColIndex) {
                    deltaCols = _this.state.dynamicProperties.freezeColIndex - newPos;
                }
            }
            if (_this.state.dynamicProperties.colStartIndex != newPos + deltaCols) {
                _this.state.dynamicProperties.colStartIndex = newPos + deltaCols;
                needUpdate = true;
            }
        }
        if (needUpdate === true)
            CanvasGrid.render(_this);
    }
};

CanvasGrid.updateProp = function (_this, propName, propValue) {
    propName = propName.toLowerCase();
    if (propValue != null) {
        if (!isNaN(+propValue))
            propValue = +propValue;
        _this.props[propName].forEach(function (propIndex, index) {
            var s = _this.state;
            var status = _this.props[propName][index].every(function (child, childIndex) {
                if (s.hasOwnProperty(child)) {
                    if (childIndex === (_this.props[propName][index].length - 1)) {
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
        });
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


    if (_this.state.dynamicProperties.colStartIndex < _this.state.dynamicProperties.freezeColIndex)
        _this.state.dynamicProperties.colStartIndex = _this.state.dynamicProperties.freezeColIndex;
    if (_this.state.dynamicProperties.rowStartIndex < _this.state.dynamicProperties.freezeRowIndex)
        _this.state.dynamicProperties.rowStartIndex = _this.state.dynamicProperties.freezeRowIndex;

    _this.state.dynamicProperties.rowEndIndex = +_this.state.dynamicProperties.rowEndIndex;
    _this.state.dynamicProperties.colEndIndex = +_this.state.dynamicProperties.colEndIndex;

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

    var gridWidth = _this.state.containerProperties.width;
    var gridHeight = _this.state.containerProperties.height;

    if (_this.state.gridProperties.width !== gridWidth) {
        _this.state.gridProperties.width = gridWidth;
        _this.grid.width = _this.state.gridProperties.width;
        _this.cell.width = _this.state.gridProperties.width;
        _this.mainGrid.width = _this.state.gridProperties.width;
        _this.eventLayer.style.width = _this.state.gridProperties.width + 'px';
    }

    if (_this.state.gridProperties.height !== gridHeight) {
        _this.state.gridProperties.height = gridHeight;
        _this.grid.height = _this.state.gridProperties.height;
        _this.cell.height = _this.state.gridProperties.height;
        _this.mainGrid.height = _this.state.gridProperties.height;
        _this.eventLayer.style.height = _this.state.gridProperties.height + 'px';
    }

    CanvasGrid.renderGrid(_this);
};

CanvasGrid.renderGrid = function (_this) {
    var gridWidth = _this.state.containerProperties.width;
    var gridHeight = _this.state.containerProperties.height;

    var rowNumberColWidth = 0;
    var currX = 0, currY = 0;
    var startX = 0, startY = 0;
    var gridDataStartX = 0, gridDataStartY = 0;
    var endX = 0, endY = 0;

    var currRowsWithHeight = [];
    var currColumnsWithWidth = [];
    var requestedData = [];
    var redraw = false;

    var nullValues = {};
    function renderCell(currRow, currCol) {
        _this.state.dynamicProperties.rowEndIndex = currRow;
        _this.state.dynamicProperties.colEndIndex = currCol;
        var cellValue = null;
        var cellProperties = _this.state.cellProperties;
        if (nullValues.hasOwnProperty(currRow) && nullValues[currRow][currCol] != null) {
            cellValue = nullValues[currRow][currCol];
        }
        else if (_this.callbackMethods['getCellValue']) {
            cellValue = _this.callbackMethods['getCellValue'].callback(currRow, currCol);
        }
        if (cellValue == null) {
            if (!nullValues.hasOwnProperty(currRow)) {
                nullValues[currRow] = {};
            }
            nullValues[currRow][currCol] = null;
        }
        if (cellValue != null && typeof cellValue == 'object' && cellValue.hasOwnProperty('cellProperties')) {
            cellProperties = utilLibrary.extend(true, {}, _this.state.cellProperties);
            cellProperties = utilLibrary.extend(true, cellProperties, cellValue.cellProperties);
            cellValue = cellValue.text;
        }

        if (currRowsWithHeight[currRow] == undefined || currRowsWithHeight[currRow] < cellProperties.height) {
            currRowsWithHeight[currRow] = cellProperties.height;
            redraw = true;
        }

        if (currColumnsWithWidth[currCol] == undefined && _this.callbackMethods['getColumnWidth']) {
            currColumnsWithWidth[currCol] = _this.callbackMethods['getColumnWidth'].callback(currCol);
        }

        if (currColumnsWithWidth[currCol] == undefined || currColumnsWithWidth[currCol] < cellProperties.width) {
            currColumnsWithWidth[currCol] = cellProperties.width;
            redraw = true;
        }

        var updatedStats = CanvasGrid.drawCell(_this, currX, currY, currX + currColumnsWithWidth[currCol], currY + currRowsWithHeight[currRow], cellValue, cellProperties, true);
        if (updatedStats != null) {
            if (updatedStats[0] > currColumnsWithWidth[currCol]) {
                currColumnsWithWidth[currCol] = updatedStats[0];
                redraw = true;
            }
            if (updatedStats[1] > currRowsWithHeight[currRow]) {
                currRowsWithHeight[currRow] = updatedStats[1];
                redraw = true;
            }
        }

        currX += currColumnsWithWidth[currCol];
    }

    function renderRow(currRow) {
        currX = 0;
        if (currRowsWithHeight[currRow] == undefined && _this.callbackMethods['getRowHeight']) {
            currRowsWithHeight[currRow] = _this.callbackMethods['getRowHeight'].callback(currRow);
        }
        for (var currCol = 0; currCol < _this.state.dynamicProperties.freezeColIndex && currX <= gridWidth; currCol++) {
            renderCell(currRow, currCol);
        }
        if (_this.state.gridProperties.freezeX < currX) {
            _this.state.gridProperties.freezeX = currX;
        }

        for (var currCol = _this.state.dynamicProperties.colStartIndex; currCol < _this.state.gridProperties.cols && currX <= gridWidth; currCol++) {
            renderCell(currRow, currCol);
        }
        currY += currRowsWithHeight[currRow];
    }

    function renderAllRows() {
        redraw = false;
        currY = 0;
        _this.state.gridProperties.freezeX = 0;
        _this.state.gridProperties.freezeY = 0;
        for (var currRow = 0; currRow < _this.state.dynamicProperties.freezeRowIndex && currY <= gridHeight; currRow++) {
            renderRow(currRow);
        }
        if (_this.state.gridProperties.freezeY < currY) {
            _this.state.gridProperties.freezeY = currY;
        }

        for (var currRow = _this.state.dynamicProperties.rowStartIndex; currRow < _this.state.gridProperties.rows && currY <= gridHeight; currRow++) {
            renderRow(currRow);
        }
        if (redraw == false) {
            _this.mainCtx.drawImage(_this.grid, 0, 0, gridWidth, gridHeight, 0, 0, gridWidth, gridHeight);
        }
        else {
            renderAllRows();
        }
    }
    renderAllRows();
    if (Object.keys(nullValues).length > 0 && _this.callbackMethods['getData']) {
        //if (_this.state.dynamicProperties.getDataTimeoutInterval != null) {
        //    clearTimeout(_this.state.dynamicProperties.getDataTimeoutInterval);
        //}
        //_this.state.dynamicProperties.getDataTimeoutInterval = setTimeout(function () {
        //    drawGridData(_this, null, '?');
        //}, 10);
        _this.callbackMethods['getData'].counter++;
        setTimeout(function () {
            _this.callbackMethods['getData'].callback(_this.callbackMethods['getData'].counter, nullValues, function (counter, data) {
                if (_this.callbackMethods['getData'].counter === counter) {
                    if (_this.state.dynamicProperties.getDataTimeoutInterval != null) {
                        clearTimeout(_this.state.dynamicProperties.getDataTimeoutInterval);
                    }
                    nullValues = data;
                    renderAllRows();
                    localData = null;
                }
            });
        }, 10);
    }

    //if (_this.callbackMethods['getData']) {

    //}
    //else {
    //    drawGridData(_this, null, '-');
    //}


    _this.eventLayer.focus();
    return;
    //Clear entire canvas
    //_this.ctx.clearRect(0, 0, _this.grid.width, _this.grid.height);

    //var gridWidth = _this.state.containerProperties.width;// - 30;
    //var gridHeight = _this.state.containerProperties.height;// - 30;
    //_this.state.dynamicProperties.rowEndIndex = _this.state.dynamicProperties.rowStartIndex + Math.ceil((gridHeight - (_this.state.gridProperties.showColumnName == true ? 1 : 0) * _this.state.cellProperties.height) / _this.state.cellProperties.height) - 1;
    //if (_this.state.dynamicProperties.rowEndIndex > (_this.state.gridProperties.rows - 1))
    //    _this.state.dynamicProperties.rowEndIndex = (_this.state.gridProperties.rows - 1);

    //var currCol = _this.state.dynamicProperties.colStartIndex;
    //var currRow = _this.state.dynamicProperties.rowStartIndex;
    //var currX = 0, currY = 0;
    //var startX = 0, startY = 0;
    //var gridDataStartX = 0, gridDataStartY = 0;
    //var endX = 0, endY = 0;
    //var currWidth = _this.state.cellProperties.width;
    //var currHeight = _this.state.cellProperties.height;

    //if (_this.state.gridProperties.showRowNumber == true) {
    //    currRow--;
    //    var maxNumberText = CanvasGrid.measureText(_this, ' ' + (_this.state.dynamicProperties.rowEndIndex + 1) + ' ', _this.state.cellProperties.textStyle);
    //    currWidth = Math.ceil(maxNumberText.width);
    //    gridDataStartX = currWidth;
    //    // draw row number
    //    while (currY <= _this.grid.height && currRow <= _this.state.dynamicProperties.rowEndIndex) {
    //        if (currRow >= _this.state.dynamicProperties.rowStartIndex) {
    //            startX = 0;
    //            endX = startX + currWidth;
    //            startY = currY;
    //            endY = currY + currHeight;
    //            CanvasGrid.drawCell(_this, startX, startY, endX, endY, '' + (currRow + 1), _this.state.headerProperties, true);
    //        }
    //        else if (_this.state.gridProperties.showColumnName == true) {
    //            startX = 0;
    //            endX = startX + currWidth;
    //            startY = currY;
    //            endY = currY + currHeight;
    //            CanvasGrid.drawCell(_this, startX, startY, endX, endY, '', _this.state.headerProperties, true);
    //        }
    //        else {
    //            currY -= currHeight;
    //        }
    //        // update Y position and row index
    //        currY += currHeight;
    //        currRow++;
    //    }
    //}

    //_this.state.dynamicProperties.colEndIndex = _this.state.dynamicProperties.colStartIndex + Math.ceil((gridWidth - gridDataStartX) / _this.state.cellProperties.width) - 1;
    //if (_this.state.dynamicProperties.colEndIndex > (_this.state.gridProperties.cols - 1))
    //    _this.state.dynamicProperties.colEndIndex = (_this.state.gridProperties.cols - 1);

    //if (_this.state.gridProperties.showColumnName == true) {
    //    currWidth = _this.state.cellProperties.width;
    //    currHeight = _this.state.cellProperties.height;
    //    gridDataStartY = currHeight;
    //    currX = gridDataStartX;
    //    // draw col number
    //    while (currX <= _this.grid.width && currCol <= _this.state.dynamicProperties.colEndIndex) {
    //        startY = 0;
    //        endY = currHeight;
    //        startX = currX;
    //        endX = currX + currWidth;
    //        CanvasGrid.drawCell(_this, startX, startY, endX, endY, 'C' + (currCol + 1), _this.state.headerProperties, true);
    //        // update X position and column index
    //        currX += currWidth;
    //        currCol++;
    //    }
    //}

    //if (_this.callbackMethods['getData']) {
    //    if (_this.state.dynamicProperties.getDataTimeoutInterval != null) {
    //        clearTimeout(_this.state.dynamicProperties.getDataTimeoutInterval);
    //    }
    //    _this.state.dynamicProperties.getDataTimeoutInterval = setTimeout(function () {
    //        drawGridData(_this, null, '?');
    //    }, 10);
    //    _this.callbackMethods['getData'].counter++;
    //    _this.callbackMethods['getData'].callback(_this.callbackMethods['getData'].counter, _this.state.dynamicProperties.rowStartIndex, _this.state.dynamicProperties.colStartIndex, _this.state.dynamicProperties.rowEndIndex, _this.state.dynamicProperties.colEndIndex, function (counter, data) {
    //        if (_this.callbackMethods['getData'].counter === counter) {
    //            if (_this.state.dynamicProperties.getDataTimeoutInterval != null) {
    //                clearTimeout(_this.state.dynamicProperties.getDataTimeoutInterval);
    //            }
    //            drawGridData(_this, data, ' ');
    //        }
    //    });
    //}
    //else {
    //    drawGridData(_this, null, '-');
    //}

    //function drawGridData(_this, gridData, defaultText) {
    //    if (_this.state.dynamicProperties.gridDataRenderTimeoutInterval != null) {
    //        clearInterval(_this.state.dynamicProperties.gridDataRenderTimeoutInterval);
    //    }
    //    _this.state.dynamicProperties.gridDataRenderTimeoutInterval = setTimeout(function () {
    //        drawGridDataMain(_this, gridData, defaultText);
    //    }, 1);
    //}
    //function drawGridDataMain(_this, gridData, defaultText) {
    //    if (gridData == null) {
    //        gridData = new Array(_this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex + 1);
    //    }

    //    currWidth = _this.state.cellProperties.width;
    //    currHeight = _this.state.cellProperties.height;
    //    currY = gridDataStartY;
    //    currRow = 0;
    //    while (currY <= _this.grid.height && currRow < gridData.length) {
    //        startY = currY;
    //        endY = currY + currHeight;
    //        var rowData = gridData[currRow];
    //        if (rowData == null) {
    //            rowData = new Array(_this.state.dynamicProperties.colEndIndex - _this.state.dynamicProperties.colStartIndex + 1)
    //        }

    //        currX = gridDataStartX;
    //        currCol = 0;
    //        while (currX <= _this.grid.width && currCol < rowData.length) {
    //            startX = currX;
    //            endX = currX + currWidth;

    //            CanvasGrid.drawCell(_this, startX, startY, endX, endY, rowData[currCol] == null ? defaultText : rowData[currCol], _this.state.cellProperties, true);
    //            // update Y position and row index
    //            currX += currWidth;
    //            currCol++;
    //        }
    //        // update Y position and row index
    //        currY += currHeight;
    //        currRow++;
    //    }
    //    gridData = null;
    //    _this.mainCtx.drawImage(_this.grid, 0, 0, 2000, 1000, 0, 0, 2000, 1000);
    //}
    //console.log(_this.state.dynamicProperties.rowStartIndex, _this.state.dynamicProperties.rowEndIndex);
    //_this.eventLayer.focus();
    //var event = new CustomEvent('get-data', { 'startCol': elem.dataset.time });
};

CanvasGrid.drawCell = function (_this, x0, y0, x1, y1, cellValue, cellProperties) {

    // clear cell
    _this.cellCtx.beginPath();
    _this.cellCtx.rect(x0, y0, (x1 - x0), (y1 - y0));
    _this.cellCtx.fillStyle = cellProperties.background.color;
    _this.cellCtx.fill();

    // border left
    //var p = _this.cellCtx.getImageData(x0, y0 + 1, 1, 1).data;
    //var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
    _this.cellCtx.beginPath();
    _this.cellCtx.moveTo(Math.floor(x0) + 0.5, Math.floor(y1) + 0.5);
    _this.cellCtx.lineTo(Math.floor(x0) + 0.5, Math.floor(y0) + 0.5);
    if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('left')) {
        _this.cellCtx.strokeStyle = cellProperties.border.left.color;
        _this.cellCtx.lineWidth = cellProperties.border.left.width;
    }
    else {
        _this.cellCtx.strokeStyle = _this.state.gridProperties.background.color;
        _this.cellCtx.lineWidth = 0.5;
    }
    _this.cellCtx.lineCap = 'round';
    _this.cellCtx.stroke();

    // border top
    _this.cellCtx.beginPath();
    _this.cellCtx.moveTo(Math.floor(x0) + 0.5, Math.floor(y0) + 0.5);
    _this.cellCtx.lineTo(Math.floor(x1) + 0.5, Math.floor(y0) + 0.5);
    if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('top')) {
        _this.cellCtx.strokeStyle = cellProperties.border.top.color;
        _this.cellCtx.lineWidth = cellProperties.border.top.width;
    }
    else {
        _this.cellCtx.strokeStyle = _this.state.gridProperties.background.color;
        _this.cellCtx.lineWidth = 0.5;
    }
    _this.cellCtx.lineCap = 'round';
    _this.cellCtx.stroke();

    // border right
    _this.cellCtx.beginPath();
    _this.cellCtx.moveTo(Math.floor(x1) + 0.5, Math.floor(y0) + 0.5);
    _this.cellCtx.lineTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
    if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('right')) {
        _this.cellCtx.strokeStyle = cellProperties.border.right.color;
        _this.cellCtx.lineWidth = cellProperties.border.right.width;
    }
    else {
        _this.cellCtx.strokeStyle = _this.state.gridProperties.background.color;
        _this.cellCtx.lineWidth = 0.5;
    }
    _this.cellCtx.lineCap = 'round';
    _this.cellCtx.stroke();

    // border bottom
    _this.cellCtx.beginPath();
    _this.cellCtx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
    _this.cellCtx.lineTo(Math.floor(x0) + 0.5, Math.floor(y1) + 0.5);
    if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('bottom')) {
        _this.cellCtx.strokeStyle = cellProperties.border.bottom.color;
        _this.cellCtx.lineWidth = cellProperties.border.bottom.width;
    }
    else {
        _this.cellCtx.strokeStyle = _this.state.gridProperties.background.color;
        _this.cellCtx.lineWidth = 0.5;
    }
    _this.cellCtx.lineCap = 'round';
    _this.cellCtx.stroke();

    var matrix = null;
    if (cellValue == null) {
        cellValue = '?';
    }
    if (cellValue != null && (typeof cellValue != 'string' || cellValue.trim() != '')) {
        matrix = CanvasGrid.drawText(_this, x0, y0, x1, y1, cellValue, cellProperties.textStyle);
        x1 = matrix[0] + x0;
        y1 = matrix[1] + y0;
    }
    _this.ctx.drawImage(_this.cell, x0, y0, (x1 - x0), (y1 - y0), x0, y0, (x1 - x0), (y1 - y0));
    return matrix;
}

CanvasGrid.measureText = function (_this, text, textStyle) {
    _this.cellCtx.textAlign = textStyle.textAlign;
    _this.cellCtx.textBaseline = textStyle.textBaseline;
    var fontText = '';
    fontText += textStyle.size + 'pt ';
    fontText += textStyle.family + ' ';
    if (textStyle.bold)
        fontText += 'bold ';
    if (textStyle.italics)
        fontText += 'italic ';

    _this.cellCtx.font = fontText;

    return _this.cellCtx.measureText(text);
}

CanvasGrid.drawText = function (_this, x0, y0, x1, y1, cellValue, textStyle) {
    _this.cellCtx.textAlign = textStyle.textAlign;
    _this.cellCtx.textBaseline = textStyle.textBaseline;
    var fontText = '';
    fontText += textStyle.size + 'pt ';
    fontText += textStyle.family + ' ';
    if (textStyle.bold)
        fontText += 'bold ';
    if (textStyle.italics)
        fontText += 'italic ';

    _this.cellCtx.font = fontText;

    var text = cellValue;


    var offsetX = 0;
    var offsetY = 0;

    _this.cellCtx.fillStyle = textStyle.color;

    //if (x0===1125) debugger;
    if (textStyle.wrap === 0) {
        if (_this.cellCtx.textAlign == 'left') {
            offsetX = 5;
        }
        else if (_this.cellCtx.textAlign == 'right') {
            offsetX = (x1 - x0) - 5;
        }
        else if (_this.cellCtx.textAlign == 'center') {
            offsetX = ((x1 - x0) / 2);
        }

        if (_this.cellCtx.textBaseline == 'bottom') {
            offsetY = (y1 - y0) - 1;
        }
        else if (_this.cellCtx.textBaseline == 'top') {
            offsetY = 1;
        }
        else if (_this.cellCtx.textBaseline == 'middle') {
            offsetY = ((y1 - y0) / 2);
        }
        _this.cellCtx.fillText(text, x0 + offsetX, y0 + offsetY);
    }
    else if (textStyle.wrap === 2) {
        var measure = _this.cellCtx.measureText(text);
        var currWidth = measure.width + 10;
        if (currWidth > _this.state.gridProperties.width - _this.state.gridProperties.freezeX) {
            currWidth = _this.state.gridProperties.width - _this.state.gridProperties.freezeX;
        }
        var maxWidth = (x1 - x0);
        if (maxWidth < currWidth) {
            maxWidth = currWidth;
            x1 = (maxWidth + x0);
        }
        if (_this.cellCtx.textAlign == 'left') {
            offsetX = 5;
        }
        else if (_this.cellCtx.textAlign == 'right') {
            offsetX = (x1 - x0) - 5;
        }
        else if (_this.cellCtx.textAlign == 'center') {
            offsetX = ((x1 - x0) / 2);
        }

        if (_this.cellCtx.textBaseline == 'bottom') {
            offsetY = (y1 - y0) - 1;
        }
        else if (_this.cellCtx.textBaseline == 'top') {
            offsetY = 1;
        }
        else if (_this.cellCtx.textBaseline == 'middle') {
            offsetY = ((y1 - y0) / 2);
        }
        _this.cellCtx.fillText(text, x0 + offsetX, y0 + offsetY);
    }
    else {
        var finalLines = [];
        var words = text.split(' ');
        var currText = '';
        var maxWidth = (x1 - x0) - 10;;
        var maxHeight = textStyle.size + parseInt(textStyle.size / 2.5);

        words.forEach(function (word) {
            var measure = _this.cellCtx.measureText(currText + word);
            var currWidth = measure.width;
            var currHeight = measure.height;
            if (currHeight > maxHeight)
                maxHeight = currHeight;
            if (maxWidth < currWidth) {
                for (var c = 0; c < word.length; c++) {
                    var char = word[c];
                    measure = _this.cellCtx.measureText(currText + char);
                    currWidth = measure.width;
                    currHeight = measure.height;
                    if (currHeight > maxHeight)
                        maxHeight = currHeight;
                    if (maxWidth < currWidth) {
                        finalLines.push(currText);
                        currText = '';
                    }
                    currText += char;
                }
                word = '';
            }
            currText += word + ' ';
        });
        finalLines.push(currText);
        currText = '';

        var finalMaxHeight = maxHeight * finalLines.length;
        if (finalMaxHeight > _this.state.gridProperties.height - _this.state.gridProperties.freezeY) {
            finalMaxHeight = _this.state.gridProperties.height - _this.state.gridProperties.freezeY;
        }
        if ((y1 - y0) < (finalMaxHeight))
            y1 = finalMaxHeight + y0;

        if (_this.cellCtx.textAlign == 'left') {
            offsetX = 5;
        }
        else if (_this.cellCtx.textAlign == 'right') {
            offsetX = (x1 - x0) - 5;
        }
        else if (_this.cellCtx.textAlign == 'center') {
            offsetX = ((x1 - x0) / 2);
        }

        if (_this.cellCtx.textBaseline == 'bottom') {
            offsetY = ((y1 - y0) - 1) - ((finalLines.length - 1) * maxHeight);
        }
        else if (_this.cellCtx.textBaseline == 'top') {
            offsetY = 1;
        }
        else if (_this.cellCtx.textBaseline == 'middle') {
            offsetY = ((y1 - y0) / 2) - ((finalLines.length - 1) / 2 * maxHeight);
        }
        finalLines.forEach(function (singleLine, index) {
            _this.cellCtx.fillText(singleLine, x0 + offsetX, y0 + offsetY + (index * maxHeight));
        });
    }
    return [x1 - x0, y1 - y0];
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
        color: 'black',
        wrap: 0 // 0-> no wrap, 1-> wrap text, 2-> auto fit
    };


    var gridProperties = {
        height: 0,
        width: 0,
        rows: 1,
        cols: 1,
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

    //var headerProperties = {
    //    height: 18,
    //    width: 100,
    //    background: utilLibrary.extend(true, utilLibrary.extend(true, {}, defaultBackground), { color: '#EFEFEF' }),
    //    border: utilLibrary.extend(true, {}, defaultBorder),
    //    textStyle: utilLibrary.extend(true, utilLibrary.extend(true, {}, defaultTextStyle), { textAlign: 'center' })
    //}

    var dynamicProperties = {
        //lastRowStartIndex: -1,
        //lastRolStartIndex: -1,
        //lastCowEndIndex: -1,
        //lastColEndIndex: -1,
        //lastFreezeRowIndex: -1,
        //lastFreezeColIndex: -1,
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