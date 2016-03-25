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
    _this.mainContainer.style.overflow = 'hidden';
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
    //_this.cell = document.createElement('canvas');
    //_this.cell.style.position = 'relative';
    //_this.cell.style.left = 0;
    //_this.cell.style.top = 0;
    //_this.cellCtx = _this.cell.getContext('2d');

    _this.state.dynamicProperties.cacheImages = {};
    ////Canvas element for caching
    //_this.cacheCell = document.createElement('canvas');
    //_this.cacheCell.style.position = 'relative';
    //_this.cacheCell.style.left = 0;
    //_this.cacheCell.style.top = 0;
    //_this.cacheCellCtx = _this.cell.getContext('2d');

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
        touchEnd = null;
    });

    d3.select(_this.eventLayer).on('touchmove', function (e) {
        d3.event.preventDefault();
        if (touchStart === null)
            return;
        var coordinates = d3.touches(this);
        touchEnd = coordinates[0];

        var deltaX = touchStart[0] - touchEnd[0];
        var deltaY = touchStart[1] - touchEnd[1];

        var xDir = deltaX <= 0 ? -1 : 1;
        var yDir = deltaY <= 0 ? -1 : 1;

        var gridWidth = _this.state.containerProperties.width;
        var gridHeight = _this.state.containerProperties.height;

        if (deltaY < 0) {
            //console.log(deltaY);
            _this.mainCtx.clearRect(0, _this.state.dynamicProperties.freezeY, gridWidth, _this.state.dynamicProperties.freezeY - deltaY);
            //if (-deltaY > gridHeight) debugger;
            var diffY = 0;
            var shiftY = 0;
            if ((gridHeight * 3 + deltaY) > ((gridHeight * 2) + _this.state.dynamicProperties.freezeY)) {
                shiftY = gridHeight * 3 + deltaY;
            }
            else {
                shiftY = ((gridHeight * 2) + _this.state.dynamicProperties.freezeY);
                diffY = ((gridHeight * 2) + _this.state.dynamicProperties.freezeY) - (gridHeight * 3 + deltaY);
            }

            _this.mainCtx.drawImage(_this.grid, 0, shiftY, gridWidth, diffY - deltaY, 0, _this.state.dynamicProperties.freezeY + diffY, gridWidth, diffY - deltaY);
            _this.mainCtx.drawImage(_this.grid, 0, _this.state.dynamicProperties.freezeY, gridWidth, gridHeight, 0, _this.state.dynamicProperties.freezeY - deltaY, gridWidth, gridHeight);

        }
        else {
            _this.mainCtx.drawImage(_this.grid, 0, _this.state.dynamicProperties.freezeY + deltaY, gridWidth, gridHeight, 0, _this.state.dynamicProperties.freezeY, gridWidth, gridHeight);
        }

        //if (deltaX < 0) {
        //    //debugger;
        //    _this.mainCtx.clearRect(_this.state.dynamicProperties.freezeX, 0, _this.state.dynamicProperties.freezeX - deltaX, gridWidth);
        //    var diffX = 0;
        //    var shiftX = 0;
        //    if ((gridWidth * 3 + deltaX) > ((gridWidth * 2) + _this.state.dynamicProperties.freezeX)) {
        //        shiftX = gridWidth * 3 + deltaX;
        //    }
        //    else {
        //        shiftX = ((gridWidth * 2) + _this.state.dynamicProperties.freezeX);
        //        diffX = ((gridWidth * 2) + _this.state.dynamicProperties.freezeX) - (gridWidth * 3 + deltaX);
        //    }
        //    _this.mainCtx.drawImage(_this.grid, shiftX, 0, diffX - deltaX, gridHeight, _this.state.dynamicProperties.freezeX + diffX, 0, diffX - deltaX, gridHeight);
        //    _this.mainCtx.drawImage(_this.grid, _this.state.dynamicProperties.freezeX, 0, gridWidth, gridHeight, _this.state.dynamicProperties.freezeX - deltaX, 0, gridWidth, gridHeight);
        //}
        //else {
        //    _this.mainCtx.drawImage(_this.grid, _this.state.dynamicProperties.freezeX + deltaX, 0, gridWidth, gridHeight, _this.state.dynamicProperties.freezeX, 0, gridWidth, gridHeight);
        //}

    });

    d3.select(_this.eventLayer).on('touchend', function (e) {
        d3.event.preventDefault();

        var gridWidth = _this.state.containerProperties.width;
        var gridHeight = _this.state.containerProperties.height;
        if (touchEnd === null) {
            return;
        }
        var deltaX = touchEnd[0] - touchStart[0];
        var deltaY = touchEnd[1] - touchStart[1];

        if (deltaY < 0) {
            var newRowIndex = _this.state.dynamicProperties.rowStartIndex;
            var newDelta = 0;
            for (rIndex = newRowIndex; rIndex < _this.state.dynamicProperties.currRowsWithHeight.length && deltaY < 0; rIndex++) {
                if (0 < deltaY * -1) {
                    newRowIndex++;
                    deltaY += _this.state.dynamicProperties.currRowsWithHeight[rIndex];
                    newDelta += _this.state.dynamicProperties.currRowsWithHeight[rIndex];
                }
                else {
                    break;
                }
            }
            if (newRowIndex != _this.state.dynamicProperties.rowStartIndex) {
                internalTimer(deltaY * 1.5, function (perc) {
                    _this.mainCtx.drawImage(_this.grid, 0, _this.state.dynamicProperties.freezeY + ((newDelta - deltaY) + (deltaY * perc)), gridWidth, gridHeight, 0, _this.state.dynamicProperties.freezeY, gridWidth, gridHeight);
                    if (perc === 1) {
                        CanvasGrid.updateProp(_this, "rowStartIndex", newRowIndex);
                    }
                });
            }
            else {
                console.log("This should never happen if we scroll only up");
                internalTimer(100, function (perc) {
                    _this.mainCtx.drawImage(_this.grid, 0, _this.state.dynamicProperties.freezeY - deltaY + (deltaY * perc), gridWidth, gridHeight, 0, _this.state.dynamicProperties.freezeY, gridWidth, gridHeight);
                });
            }
        }
        else {
            var newRowIndex = _this.state.dynamicProperties.rowStartIndex;
            var newDelta = 0;
            console.log(deltaY);
            for (rIndex = newRowIndex - 1; rIndex >= _this.state.dynamicProperties.freezeRowIndex && deltaY > 0; rIndex--) {
                if (0 > deltaY * -1) {
                    newRowIndex--;
                    deltaY -= _this.state.dynamicProperties.currRowsWithHeight[rIndex];
                    newDelta += _this.state.dynamicProperties.currRowsWithHeight[rIndex];
                }
                else {
                    break;
                }
            }
            if (newRowIndex != _this.state.dynamicProperties.rowStartIndex) {
                internalTimer(-deltaY * 1.5, function (perc) {
                    var diff = 0;
                    var shift = 0;
                    if ((gridHeight * 3 - newDelta) > ((gridHeight * 2) + _this.state.dynamicProperties.freezeY)) {
                        shift = gridHeight * 3 - newDelta;
                    }
                    else {
                        shift = ((gridHeight * 2) + _this.state.dynamicProperties.freezeY);
                        diff = ((gridHeight * 2) + _this.state.dynamicProperties.freezeY) - (gridHeight * 3 - newDelta);
                    }
                    //console.log(shift, newDelta, diff, deltaY);
                    _this.mainCtx.drawImage(_this.grid, 0, shift - deltaY + (deltaY * perc), gridWidth, newDelta, 0, _this.state.dynamicProperties.freezeY, gridWidth, newDelta);
                    _this.mainCtx.drawImage(_this.grid, 0, _this.state.dynamicProperties.freezeY, gridWidth, gridHeight, 0, _this.state.dynamicProperties.freezeY + (newDelta + deltaY) - (deltaY * perc), gridWidth, gridHeight);

                    if (perc === 1) {
                        CanvasGrid.updateProp(_this, "rowStartIndex", newRowIndex);
                    }
                });
            }
            else {
                console.log("This should never happen if we scroll only up");
                internalTimer(100, function (perc) {
                    _this.mainCtx.drawImage(_this.grid, 0, _this.state.dynamicProperties.freezeY, gridWidth, gridHeight, 0, _this.state.dynamicProperties.freezeY + deltaY - (deltaY * perc), gridWidth, gridHeight);
                });
            }
        }

        //if (deltaX < 0) {
        //    var newColIndex = _this.state.dynamicProperties.colStartIndex;
        //    var newDeltaX = 0;
        //    for (cIndex = newColIndex; cIndex < _this.state.dynamicProperties.currColumnsWithWidth.length && deltaX < 0; cIndex++) {
        //        if (0 < deltaX * -1) {
        //            newColIndex++;
        //            deltaX += _this.state.dynamicProperties.currColumnsWithWidth[cIndex];
        //            newDeltaX += _this.state.dynamicProperties.currColumnsWithWidth[cIndex];
        //        }
        //        else {
        //            break;
        //        }
        //    }
        //    if (newColIndex != _this.state.dynamicProperties.colStartIndex) {
        //        internalTimer(deltaX * 1.5, function (perc) {
        //            _this.mainCtx.drawImage(_this.grid, _this.state.dynamicProperties.freezeX + ((newDeltaX - deltaX) + (deltaX * perc)), 0, gridWidth, gridHeight, _this.state.dynamicProperties.freezeX, 0, gridWidth, gridHeight);
        //            if (perc === 1) {
        //                CanvasGrid.updateProp(_this, "colStartIndex", newColIndex);
        //            }
        //        });
        //    }
        //    else {
        //        console.log("This should never happen if we scroll only up");
        //        internalTimer(100, function (perc) {
        //            _this.mainCtx.drawImage(_this.grid, _this.state.dynamicProperties.freezeX - deltaX + (deltaX * perc), 0, gridWidth, gridHeight, _this.state.dynamicProperties.freezeX, 0, gridWidth, gridHeight);
        //        });
        //    }
        //}
        //else {
        //    var newColIndex = _this.state.dynamicProperties.colStartIndex;
        //    var newDeltaX = 0;
        //    //debugger;
        //    for (cIndex = newColIndex; cIndex > _this.state.dynamicProperties.freezeColIndex && deltaX > 0; cIndex--) {
        //        if (0 > deltaX * -1) {
        //            newColIndex--;
        //            deltaX -= _this.state.dynamicProperties.currColumnsWithWidth[cIndex];
        //            newDeltaX += _this.state.dynamicProperties.currColumnsWithWidth[cIndex];
        //        }
        //        else {
        //            break;
        //        }
        //    }
        //    if (newColIndex != _this.state.dynamicProperties.colStartIndex) {
        //        internalTimer(-deltaX * 1.5, function (perc) {
        //            var diffX = 0;
        //            var shiftX = 0;
        //            if ((gridWidth * 3 - newDeltaX) > ((gridWidth * 2) + _this.state.dynamicProperties.freezeX)) {
        //                shiftX = gridWidth * 3 - newDeltaX;
        //            }
        //            else {
        //                shiftX = ((gridWidth * 2) + _this.state.dynamicProperties.freezeX);
        //                diffX = ((gridWidth * 2) + _this.state.dynamicProperties.freezeX) - (gridWidth * 3 - newDeltaX);
        //            }
        //            console.log(shiftX, diffX, newDeltaX);
        //            _this.mainCtx.drawImage(_this.grid, shiftX + newDeltaX - (newDeltaX * perc), 0, diffX + newDeltaX, gridHeight, _this.state.dynamicProperties.freezeX + diffX, 0, diffX + newDeltaX, gridHeight);
        //            _this.mainCtx.drawImage(_this.grid, _this.state.dynamicProperties.freezeX, 0, gridWidth, gridHeight, _this.state.dynamicProperties.freezeX + newDeltaX + deltaX - (deltaX * perc), 0, gridWidth, gridHeight);

        //            if (perc === 1) {
        //                CanvasGrid.updateProp(_this, "colStartIndex", newColIndex);
        //            }
        //        });
        //    }
        //    else {
        //        console.log("This should never happen if we scroll only up");
        //        internalTimer(100, function (perc) {
        //            _this.mainCtx.drawImage(_this.grid, _this.state.dynamicProperties.freezeX, 0, gridWidth, gridHeight, _this.state.dynamicProperties.freezeX + deltaX - (deltaX * perc), 0, gridWidth, gridHeight);
        //        });
        //    }
        //}
    });

    function internalTimer(timerMilliSecond, cb) {
        d3.timer(function (x) {
            if (x > timerMilliSecond) {
                cb(1);
                return true;
            }
            else {
                cb(x / timerMilliSecond);
                return false;
            }
        }, 0, +new Date());
    }

    //Key events
    var keyDownLock = false;
    _this.eventLayer.addEventListener('keydown', function (e) {
        if (keyDownLock === true)
            return;

        var deltaRows = 0;
        var deltaCols = 0;
        //down
        if (e.keyCode === 40) {
            deltaRows = 1;
        }
            //up
        else if (e.keyCode === 38) {
            deltaRows = -1;
        }
            //right
        else if (e.keyCode === 39) {
            deltaCols = 1;
        }
            //left
        else if (e.keyCode === 37) {
            deltaCols = -1;
        }
            //page down
        else if (e.keyCode === 34) {
            deltaRows = (_this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex) + 1;
        }
            //page up
        else if (e.keyCode === 33) {
            deltaRows = -((_this.state.dynamicProperties.rowEndIndex - _this.state.dynamicProperties.rowStartIndex) + 1);
        }
            //end
        else if (e.keyCode === 35) {
            deltaCols = -_this.state.dynamicProperties.colStartIndex;
        }
            //home
        else if (e.keyCode === 36) {
            deltaCols = -_this.state.dynamicProperties.colStartIndex;
        }
        else {
            console.log(e.keyCode);
        }
        if (deltaCols != 0 || deltaRows != 0) {

            keyDownLock = true;
            setTimeout(function () {
                keyDownLock = false;
            }, 0);

            updateStartRowCol(_this, deltaRows, deltaCols);
            e.preventDefault();
        }

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
        _this.grid.width = _this.state.gridProperties.width * 3;
        //_this.cell.width = _this.state.gridProperties.width * 3;
        //_this.cacheCell.width = _this.state.cellProperties.width;
        _this.mainGrid.width = _this.state.gridProperties.width;
        _this.eventLayer.style.width = _this.state.gridProperties.width + 'px';
    }

    if (_this.state.gridProperties.height !== gridHeight) {
        _this.state.gridProperties.height = gridHeight;
        _this.grid.height = _this.state.gridProperties.height * 3;
        //_this.cell.height = _this.state.gridProperties.height * 3;
        //_this.cacheCell.height = _this.state.cellProperties.height;
        _this.mainGrid.height = _this.state.gridProperties.height;
        _this.eventLayer.style.height = _this.state.gridProperties.height + 'px';
    }

    CanvasGrid.renderGrid(_this);
};

CanvasGrid.renderGrid = function (_this) {

    var gridWidth = _this.state.containerProperties.width;
    var gridHeight = _this.state.containerProperties.height;

    _this.ctx.beginPath();
    _this.ctx.rect(0, 0, _this.state.gridProperties.width * 3, _this.state.gridProperties.height * 3);
    _this.ctx.fillStyle = _this.state.cellProperties.background.color;
    _this.ctx.fill();

    //_this.cellCtx.beginPath();
    //_this.cellCtx.rect(0, 0, _this.state.gridProperties.width * 3, _this.state.gridProperties.height * 3);
    //_this.cellCtx.fillStyle = _this.state.cellProperties.background.color;
    //_this.cellCtx.fill();

    //_this.cacheCellCtx.beginPath();
    //_this.cacheCellCtx.rect(0, 0, _this.state.cellProperties.width, _this.state.cellProperties.height);
    //_this.cacheCellCtx.fillStyle = _this.state.cellProperties.background.color;
    //_this.cacheCellCtx.fill();

    var rowNumberColWidth = 0;
    var currX = 0, currY = 0;
    var startX = 0, startY = 0;
    var gridDataStartX = 0, gridDataStartY = 0;
    var endX = 0, endY = 0;

    if (_this.state.dynamicProperties.currRowsWithHeight == undefined)
        _this.state.dynamicProperties.currRowsWithHeight = [];
    if (_this.state.dynamicProperties.currColumnsWithWidth == undefined)
        _this.state.dynamicProperties.currColumnsWithWidth = [];
    var requestedData = [];
    var redraw = false;

    var nullValues = {};
    var availableValues = {};
    function renderCell(currRow, currCol, isExtraRow, isReverseRow, isExtraCol, isReverseCol) {
        if (isExtraRow !== true) {
            _this.state.dynamicProperties.rowEndIndex = currRow - 1;
        }
        if (isExtraCol !== true) {
            _this.state.dynamicProperties.colEndIndex = currCol;
        }
        var cellValue = null;
        var cellProperties = _this.state.cellProperties;
        if (availableValues.hasOwnProperty(currRow) && availableValues[currRow][currCol] != null) {
            cellValue = availableValues[currRow][currCol];
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

        if (_this.state.dynamicProperties.currRowsWithHeight[currRow] == undefined || _this.state.dynamicProperties.currRowsWithHeight[currRow] < cellProperties.height) {
            _this.state.dynamicProperties.currRowsWithHeight[currRow] = cellProperties.height;
            redraw = true;
        }

        if (_this.state.dynamicProperties.currColumnsWithWidth[currCol] == undefined && _this.callbackMethods['getColumnWidth']) {
            _this.state.dynamicProperties.currColumnsWithWidth[currCol] = _this.callbackMethods['getColumnWidth'].callback(currCol);
        }

        if (_this.state.dynamicProperties.currColumnsWithWidth[currCol] == undefined || _this.state.dynamicProperties.currColumnsWithWidth[currCol] < cellProperties.width) {
            _this.state.dynamicProperties.currColumnsWithWidth[currCol] = cellProperties.width;
            redraw = true;
        }

        var updatedStats = CanvasGrid.drawCell(_this, currX, currY, currX + _this.state.dynamicProperties.currColumnsWithWidth[currCol], currY + _this.state.dynamicProperties.currRowsWithHeight[currRow], cellValue, cellProperties, true);
        if (updatedStats != null) {
            if (updatedStats[0] > _this.state.dynamicProperties.currColumnsWithWidth[currCol]) {
                _this.state.dynamicProperties.currColumnsWithWidth[currCol] = updatedStats[0];
                redraw = true;
            }
            if (updatedStats[1] > _this.state.dynamicProperties.currRowsWithHeight[currRow]) {
                _this.state.dynamicProperties.currRowsWithHeight[currRow] = updatedStats[1];
                redraw = true;
            }
        }
        if (isReverseCol === true) {
            currX -= _this.state.dynamicProperties.currColumnsWithWidth[currCol];
        }
        else {
            currX += _this.state.dynamicProperties.currColumnsWithWidth[currCol];
        }
    }

    function renderRow(currRow, isExtraRow, isReverseRow, isExtraCol, isReverseCol) {

        currX = 0;
        if (_this.state.dynamicProperties.currRowsWithHeight[currRow] == undefined && _this.callbackMethods['getRowHeight']) {
            _this.state.dynamicProperties.currRowsWithHeight[currRow] = _this.callbackMethods['getRowHeight'].callback(currRow);
        }
        for (var currCol = 0; currCol < _this.state.dynamicProperties.freezeColIndex && currX <= gridWidth; currCol++) {
            renderCell(currRow, currCol, isExtraRow, isReverseRow, isExtraCol, isReverseCol);
        }
        if (_this.state.dynamicProperties.freezeX < currX) {
            _this.state.dynamicProperties.freezeX = currX;
        }

        for (var currCol = _this.state.dynamicProperties.colStartIndex; currCol < _this.state.gridProperties.cols && currX <= gridWidth; currCol++) {
            renderCell(currRow, currCol, isExtraRow, isReverseRow, isExtraCol, isReverseCol);
        }

        if (isExtraRow === true) {
            for (; currCol < _this.state.gridProperties.cols && currX <= gridWidth * 2; currCol++) {
                renderCell(currRow, currCol, isExtraRow, isReverseRow, true, false);
            }
            if (_this.state.dynamicProperties.currColumnsWithWidth[_this.state.dynamicProperties.colStartIndex - 1] != undefined) {
                currX = gridWidth * 3 - _this.state.dynamicProperties.currColumnsWithWidth[_this.state.dynamicProperties.colStartIndex - 1];
            }
            else {
                currX = gridWidth * 3;
            }
            for (currCol = _this.state.dynamicProperties.colStartIndex - 1; currCol >= _this.state.dynamicProperties.freezeColIndex && currX > gridWidth * 2; currCol--) {
                renderCell(currRow, currCol, isExtraRow, isReverseRow, true, true);
            }
        }

        if (isReverseRow === true) {
            currY -= _this.state.dynamicProperties.currRowsWithHeight[currRow - 1];
        }
        else {
            currY += _this.state.dynamicProperties.currRowsWithHeight[currRow];
        }
    }

    function renderAllRows() {
        redraw = false;
        currY = 0;
        _this.state.dynamicProperties.freezeX = 0;
        _this.state.dynamicProperties.freezeY = 0;
        var currRow = 0
        for (currRow = 0; currRow < _this.state.dynamicProperties.freezeRowIndex && currY <= gridHeight; currRow++) {
            renderRow(currRow);
        }
        if (_this.state.dynamicProperties.freezeY < currY) {
            _this.state.dynamicProperties.freezeY = currY;
        }

        for (currRow = _this.state.dynamicProperties.rowStartIndex; currRow < _this.state.gridProperties.rows && currY <= gridHeight; currRow++) {
            renderRow(currRow);
        }
        if (redraw == false) {
            _this.mainCtx.drawImage(_this.grid, 0, 0, gridWidth, gridHeight, 0, 0, gridWidth, gridHeight);

            if (_this.state.dynamicProperties.extraRowsRenderTimeoutInterval != null) {
                clearInterval(_this.state.dynamicProperties.extraRowsRenderTimeoutInterval);
            }
            _this.state.dynamicProperties.extraRowsRenderTimeoutInterval = setTimeout(function () {

                console.log("Rendering extra row/cols");
                currY = 0;
                var currRow = 0
                for (currRow = 0; currRow < _this.state.dynamicProperties.freezeRowIndex && currY <= gridHeight; currRow++) {
                    renderRow(currRow, true, false);
                }

                for (currRow = _this.state.dynamicProperties.rowStartIndex; currRow < _this.state.gridProperties.rows && currY <= gridHeight; currRow++) {
                    renderRow(currRow, true, false);
                }

                for (; currRow < _this.state.gridProperties.rows && currY <= gridHeight * 2; currRow++) {
                    renderRow(currRow, true, false);
                }

                if (_this.state.dynamicProperties.currRowsWithHeight[_this.state.dynamicProperties.rowStartIndex - 1] != undefined) {
                    currY = gridHeight * 3 - _this.state.dynamicProperties.currRowsWithHeight[_this.state.dynamicProperties.rowStartIndex - 1];
                }
                else {
                    currY = gridHeight * 3;
                }
                for (currRow = _this.state.dynamicProperties.rowStartIndex - 1; currRow >= _this.state.dynamicProperties.freezeRowIndex && currY >= gridHeight * 2; currRow--) {
                    renderRow(currRow, true, true);
                }

                _this.state.dynamicProperties.rowStartIndexOld = _this.state.dynamicProperties.rowStartIndex;
                _this.state.dynamicProperties.colStartIndexOld = _this.state.dynamicProperties.colStartIndex;

                _this.state.dynamicProperties.rowEndIndexOld = _this.state.dynamicProperties.rowEndIndex;
                _this.state.dynamicProperties.colEndIndexOld = _this.state.dynamicProperties.colEndIndex;

                //// save canvas image as data url (png format by default)
                //var dataURL = _this.grid.toDataURL();

                //// set canvasImg image src to dataURL
                //// so it can be saved as an image
                //document.getElementById('canvasImg').src = dataURL;

                if (Object.keys(nullValues).length > 0 && _this.callbackMethods['getData']) {
                    _this.callbackMethods['getData'].counter++;
                    //console.log("Calling Get Data for ", _this.callbackMethods['getData'].counter);
                    setTimeout(function () {
                        _this.callbackMethods['getData'].callback(_this.callbackMethods['getData'].counter, nullValues, function (counter, data) {
                            //console.log("returned Get Data", counter);
                            if (_this.callbackMethods['getData'].counter === counter) {
                                availableValues = data;
                                nullValues = {};
                                renderAllRows();
                                data = null;
                            }
                        });
                    }, 100);
                }
            }, 100);
            _this.eventLayer.focus();
        }
        else {
            renderAllRows();
        }
    }
    renderAllRows();
    //if (Object.keys(nullValues).length > 0 && _this.callbackMethods['getData']) {
    //    _this.callbackMethods['getData'].counter++;
    //    //console.log("Calling Get Data for ", _this.callbackMethods['getData'].counter);
    //    setTimeout(function () {
    //        _this.callbackMethods['getData'].callback(_this.callbackMethods['getData'].counter, nullValues, function (counter, data) {
    //            //console.log("returned Get Data", counter);
    //            if (_this.callbackMethods['getData'].counter === counter) {
    //                nullValues = data;
    //                renderAllRows();
    //                data = null;
    //            }
    //        });
    //    }, 10);
    //}
    return;
};

CanvasGrid.drawCell = function (_this, x0, y0, x1, y1, cellValue, cellProperties) {
    var drawBackground = true;
    //if (_this.state.dynamicProperties.cacheImages.hasOwnProperty(JSON.stringify(cellProperties) + "_" + (x1 - x0) + "_" + (y1 - y0))) {
    //    _this.ctx.putImageData(_this.state.dynamicProperties.cacheImages[JSON.stringify(cellProperties) + "_" + (x1 - x0) + "_" + (y1 - y0)], x0, y0);
    //    drawBackground = false;
    //}

    if (drawBackground === true) {
        // clear cell
        _this.ctx.beginPath();
        _this.ctx.rect(x0, y0, (x1 - x0), (y1 - y0));
        _this.ctx.fillStyle = cellProperties.background.color;
        _this.ctx.fill();

        // border left
        //var p = _this.ctx.getImageData(x0, y0 + 1, 1, 1).data;
        //var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
        _this.ctx.beginPath();
        _this.ctx.moveTo(Math.floor(x0) + 0.5, Math.floor(y1) + 0.5);
        _this.ctx.lineTo(Math.floor(x0) + 0.5, Math.floor(y0) + 0.5);
        if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('left')) {
            _this.ctx.strokeStyle = cellProperties.border.left.color;
            _this.ctx.lineWidth = cellProperties.border.left.width;
        }
        else {
            _this.ctx.strokeStyle = _this.state.gridProperties.background.color;
            _this.ctx.lineWidth = 0.5;
        }
        _this.ctx.lineCap = 'round';
        _this.ctx.stroke();

        // border top
        _this.ctx.beginPath();
        _this.ctx.moveTo(Math.floor(x0) + 0.5, Math.floor(y0) + 0.5);
        _this.ctx.lineTo(Math.floor(x1) + 0.5, Math.floor(y0) + 0.5);
        if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('top')) {
            _this.ctx.strokeStyle = cellProperties.border.top.color;
            _this.ctx.lineWidth = cellProperties.border.top.width;
        }
        else {
            _this.ctx.strokeStyle = _this.state.gridProperties.background.color;
            _this.ctx.lineWidth = 0.5;
        }
        _this.ctx.lineCap = 'round';
        _this.ctx.stroke();

        // border right
        _this.ctx.beginPath();
        _this.ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y0) + 0.5);
        _this.ctx.lineTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
        if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('right')) {
            _this.ctx.strokeStyle = cellProperties.border.right.color;
            _this.ctx.lineWidth = cellProperties.border.right.width;
        }
        else {
            _this.ctx.strokeStyle = _this.state.gridProperties.background.color;
            _this.ctx.lineWidth = 0.5;
        }
        _this.ctx.lineCap = 'round';
        _this.ctx.stroke();

        // border bottom
        _this.ctx.beginPath();
        _this.ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
        _this.ctx.lineTo(Math.floor(x0) + 0.5, Math.floor(y1) + 0.5);
        if (cellProperties.hasOwnProperty('border') && cellProperties.border.hasOwnProperty('bottom')) {
            _this.ctx.strokeStyle = cellProperties.border.bottom.color;
            _this.ctx.lineWidth = cellProperties.border.bottom.width;
        }
        else {
            _this.ctx.strokeStyle = _this.state.gridProperties.background.color;
            _this.ctx.lineWidth = 0.5;
        }
        _this.ctx.lineCap = 'round';
        _this.ctx.stroke();

        //_this.state.dynamicProperties.cacheImages[JSON.stringify(cellProperties) + "_" + (x1 - x0) + "_" + (y1 - y0)] = _this.ctx.getImageData(x0, y0, x1, y1);
        //console.log(JSON.stringify(cellProperties) + "_" + (x1 - x0) + "_" + (y1 - y0));
        //console.log(Object.keys(_this.state.dynamicProperties.cacheImages).length);
    }

    var matrix = null;
    if (cellValue == null) {
        cellValue = '?';
    }
    if (cellValue != null && (typeof cellValue != 'string' || cellValue.trim() != '')) {
        matrix = CanvasGrid.drawText(_this, x0, y0, x1, y1, cellValue, cellProperties.textStyle);
        x1 = matrix[0] + x0;
        y1 = matrix[1] + y0;
    }
    if (cellProperties != null && cellProperties.background != null && cellProperties.background.img != null) {
        CanvasGrid.drawImage(_this, x0, y0, x1, y1, cellProperties.background.img);
    }
    //var innerWidth = (x1 - x0);
    //var innerHeight = (y1 - y0);
    //_this.ctx.drawImage(_this.grid, x0, y0, innerWidth, innerHeight, x0, y0, innerWidth, innerHeight);
    //if (cellValue === "?") {
    //    //debugger;
    //    //_this.cacheCellCtx.beginPath();
    //    //_this.cacheCellCtx.rect(0, 0, _this.state.cellProperties.width, _this.state.cellProperties.height);
    //    //_this.cacheCellCtx.fillStyle = _this.state.cellProperties.background.color;
    //    //_this.cacheCellCtx.fill();

    //    //_this.cacheCellCtx.drawImage(_this.grid, x0, y0, innerWidth, innerHeight, x0, y0, innerWidth, innerHeight);
    //    _this.state.dynamicProperties.cacheImages[JSON.stringify(cellProperties) + "_" + (x1 - x0) + "_" + (y1 - y0)] = _this.ctx.getImageData(x0, y0, innerWidth, innerHeight);
    //    //// save canvas image as data url (png format by default)
    //    //var dataURL = _this.grid.toDataURL();

    //    //// set canvasImg image src to dataURL
    //    //// so it can be saved as an image
    //    //document.getElementById('canvasImg').src = dataURL;
    //    //debugger;
    //    //_this.state.dynamicProperties.cacheImages[JSON.stringify(cellProperties)] = { x: 0, y: 0, width: innerWidth, height: innerHeight };
    //}
    return matrix;
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

    return _this.ctx.measureText(text);
}

CanvasGrid.drawImage = function (_this, x0, y0, x1, y1, image) {
    var tmpStartRow = _this.state.dynamicProperties.rowStartIndex;
    var tmpStartCol = _this.state.dynamicProperties.colStartIndex;
    var imageObj = new Image();

    imageObj.onload = function () {
        if (tmpStartRow === _this.state.dynamicProperties.rowStartIndex && tmpStartCol === _this.state.dynamicProperties.colStartIndex) {
            _this.mainCtx.drawImage(imageObj, x0, y0, x1 - x0, y1 - y0);
            _this.ctx.drawImage(imageObj, x0, y0, x1 - x0, y1 - y0);
        }
    };
    imageObj.src = image.url;//'http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg';

    //var imageObj = new Image();

    //imageObj.onload = function () {
    //    if (tmpStartRow === _this.state.dynamicProperties.rowStartIndex && tmpStartCol === _this.state.dynamicProperties.colStartIndex) {
    //        _this.mainCtx.drawImage(imageObj, x0, y0, x1 - x0, y1 - y0);
    //        _this.ctx.drawImage(imageObj, x0, y0, x1 - x0, y1 - y0);
    //    }
    //};
    //imageObj.src = "thumbnail.png";//'http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg';
}

CanvasGrid.drawText = function (_this, x0, y0, x1, y1, cellValue, textStyle) {
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

    var text = cellValue;


    var offsetX = 0;
    var offsetY = 0;

    _this.ctx.fillStyle = textStyle.color;

    //if (x0===1125) debugger;
    if (textStyle.wrap === 0) {
        if (_this.ctx.textAlign == 'left') {
            offsetX = 5;
        }
        else if (_this.ctx.textAlign == 'right') {
            offsetX = (x1 - x0) - 5;
        }
        else if (_this.ctx.textAlign == 'center') {
            offsetX = ((x1 - x0) / 2);
        }

        if (_this.ctx.textBaseline == 'bottom') {
            offsetY = (y1 - y0) - 1;
        }
        else if (_this.ctx.textBaseline == 'top') {
            offsetY = 1;
        }
        else if (_this.ctx.textBaseline == 'middle') {
            offsetY = ((y1 - y0) / 2);
        }
        _this.ctx.fillText(text, x0 + offsetX, y0 + offsetY);
    }
    else if (textStyle.wrap === 2) {
        var measure = _this.ctx.measureText(text);
        var currWidth = measure.width + 10;
        if (currWidth > _this.state.gridProperties.width - _this.state.dynamicProperties.freezeX) {
            currWidth = _this.state.gridProperties.width - _this.state.dynamicProperties.freezeX;
        }
        var maxWidth = (x1 - x0);
        if (maxWidth < currWidth) {
            maxWidth = currWidth;
            x1 = (maxWidth + x0);
        }
        if (_this.ctx.textAlign == 'left') {
            offsetX = 5;
        }
        else if (_this.ctx.textAlign == 'right') {
            offsetX = (x1 - x0) - 5;
        }
        else if (_this.ctx.textAlign == 'center') {
            offsetX = ((x1 - x0) / 2);
        }

        if (_this.ctx.textBaseline == 'bottom') {
            offsetY = (y1 - y0) - 1;
        }
        else if (_this.ctx.textBaseline == 'top') {
            offsetY = 1;
        }
        else if (_this.ctx.textBaseline == 'middle') {
            offsetY = ((y1 - y0) / 2);
        }
        _this.ctx.fillText(text, x0 + offsetX, y0 + offsetY);
    }
    else {
        var finalLines = [];
        var words = text.split(' ');
        var currText = '';
        var maxWidth = (x1 - x0) - 10;;
        var maxHeight = textStyle.size + parseInt(textStyle.size / 2.5);

        words.forEach(function (word) {
            var measure = _this.ctx.measureText(currText + word);
            var currWidth = measure.width;
            var currHeight = measure.height;
            if (currHeight > maxHeight)
                maxHeight = currHeight;
            if (maxWidth < currWidth) {
                for (var c = 0; c < word.length; c++) {
                    var char = word[c];
                    measure = _this.ctx.measureText(currText + char);
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

        if (_this.ctx.textAlign == 'left') {
            offsetX = 5;
        }
        else if (_this.ctx.textAlign == 'right') {
            offsetX = (x1 - x0) - 5;
        }
        else if (_this.ctx.textAlign == 'center') {
            offsetX = ((x1 - x0) / 2);
        }

        if (_this.ctx.textBaseline == 'bottom') {
            offsetY = ((y1 - y0) - 1) - ((finalLines.length - 1) * maxHeight);
        }
        else if (_this.ctx.textBaseline == 'top') {
            offsetY = 1;
        }
        else if (_this.ctx.textBaseline == 'middle') {
            offsetY = ((y1 - y0) / 2) - ((finalLines.length - 1) / 2 * maxHeight);
        }
        finalLines.forEach(function (singleLine, index) {
            _this.ctx.fillText(singleLine, x0 + offsetX, y0 + offsetY + (index * maxHeight));
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