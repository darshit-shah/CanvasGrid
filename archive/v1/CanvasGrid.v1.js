
(function($) {
  var CanvasGridMethods = {
    getData: function(ele) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in getData');
      else
        return ele.data('objCanvasGrid').getData();
    },
    selectCells: function(ele, key, colStart, rowStart, colEnd, rowEnd) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in selectCell');
      else
        return ele.data('objCanvasGrid').selectCells(key, colStart, rowStart, colEnd, rowEnd);
    },
    addCellSelector: function(ele, color, colStart, rowStart, colEnd, rowEnd, key) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in addCellSelector');
      else
        return ele.data('objCanvasGrid').addCellSelector(color, colStart, rowStart, colEnd, rowEnd, key);
    },
    getSelectedRow: function(ele) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in getSelectedRow');
      else
        return ele.data('objCanvasGrid').getSelectedRow();
    },
    getSelectedCell: function(ele) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in getSelectedCell');
      else
        return ele.data('objCanvasGrid').getSelectedCell();
    },
    removeCellSelector: function(ele, key) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in removeCellSelector');
      else
        return ele.data('objCanvasGrid').removeCellSelector(key);
    },
    setItem: function(ele, key, item, row, col) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in setItem');
      else
        return ele.data('objCanvasGrid').setItem(key, item, row, col);
    },
    removeItem: function(ele, key) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in removeItem');
      else
        return ele.data('objCanvasGrid').removeItem(key);
    },
    updateData: function(ele, data) {
      if (ele.data('objCanvasGrid') == undefined)
        console.log('error in updateData');
      else
        return ele.data('objCanvasGrid').updateData(data);
    }
  }
  var CanvasGrid = function(ele, options) {
    var self = this;
    var isGridReadOnly = options.readOnly;
    if (!isGridReadOnly)
      isGridReadOnly = false;
    var hScroll = null;
    var vScroll = null;
    var canvas = null;
    var gContext = null;
    var components = null;
    var mainEvents = null;
    var scrollLockCount = 0;

    var rowStartIndex = -1;
    var colStartIndex = -1;
    var rowEndIndex = -1;
    var colEndIndex = -1;

    var cellSelectorBorder = 2;
    var selectedRowStartIndex = {};
    var selectedColStartIndex = {};
    var selectedRowEndIndex = {};
    var selectedColEndIndex = {};

    var selectedStartBox = {};
    var selectedEndBox = {};

    var lastScrollTop = 0;
    var lastScrollLeft = 0;
    var lastScrollTopAdj = 0;
    var lastScrollLeftAdj = 0;

    var canvasHeight = 0;
    var canvasWidth = 0;
    var canvasHeightAdj = 0;
    var canvasWidthAdj = 0;

    var data = options.data;
    var colInfo = options.colInfo;
    var info = {};
    info.name = 'Sr.';
    info.width = options.rowHeaderWidth;
    colInfo.unshift(info);
    info = null;

    var row = {
      height: 30
    };
    for (var i = 0; i < colInfo.length; i++) {
      row[colInfo[i].name] = {
        value: colInfo[i].name
      };
    }
    if(options.showHeaderRow)
      data.unshift(row);
    row = null;

    var numRows = data.length;
    var numCols = colInfo.length;

    var cellSelectors = {};
    var cellSelectorsVisible = {};

    var anotatedItems = {};

    var cellEditor;
    var cellEditorSizes;

    var isDragStart = false;

    var scrollInterval = 0;

    var scrollEvent = null;

    var freezeRowIndex = options.freezeRowIndex;
    var freezeColIndex = options.freezeColIndex;
    var freezeX = 0;
    var freezeY = 0;

    var mergedCells = [];

    var bindEvents = function() {

      hScroll.scroll(function() {
        findStartIndexBasedOnScroll();
      });

      vScroll.scroll(function() {
        findStartIndexBasedOnScroll();
      });

      cellEditor.focusout(function() {
        var i = selectedRowStartIndex[options.MyKey];
        var j = selectedColStartIndex[options.MyKey];
        i -= data[i][colInfo[j].name].formatting.rowSpanNeg;
        j -= data[i][colInfo[j].name].formatting.colSpanNeg;
        data[i][colInfo[j].name].value = cellEditor.text();
        var dataObj = data[i][colInfo[j].name];
        //var extraHeight = 0;
        //var extraWidth = 0;
        if (dataObj.formatting.rowSpan > 1 || dataObj.formatting.colSpan > 1) {
          for (var rIndex = i; rIndex < i + dataObj.formatting.rowSpan; rIndex++) {
            for (var cIndex = j; cIndex < j + dataObj.formatting.colSpan; cIndex++) {
              if (rIndex > i || cIndex > 0) {
                data[rIndex][colInfo[cIndex].name].value = cellEditor.text();
              }
            }
          }
        }
        var heightChanged = drawCell(gContext, cellEditorSizes.x, cellEditorSizes.y, cellEditorSizes.x + cellEditorSizes.x1, cellEditorSizes.y + cellEditorSizes.y1, i, j);
        if (heightChanged)
          drawCanvas();
      });

      cellEditor.keydown(function(e) {
        if (e.keyCode == 9 || e.keyCode == 10 || e.keyCode == 13) {
          mainEvents.focus();
          mainEvents.trigger(e);
        } else if (e.keyCode == 27) {
          cellEditor.text(data[selectedRowStartIndex[options.MyKey]][colInfo[selectedColStartIndex[options.MyKey]].name].value);
          mainEvents.focus();
          cellEditor.hide();
        }
      })

      function forwardEvent(evt) {
        // console.log(evt);
        ele.trigger(evt);
      }

      mainEvents.mousedown(function(evt) {
        forwardEvent(evt);
        mainEvents.focus();
        //console.log('mainEvents', evt.type);
        var tmpSelectedRowIndex = 0;
        var tmpSelectedColIndex = 0;
        var mousePos = getMousePos(canvas, evt);
        var y = 0;
        var yCounter = 0;
        for (yCounter = 0; yCounter < (numRows - 1);) {
          //while (rowStartIndex + yCounter < (numRows - 1) && (y + data[rowStartIndex + yCounter].height) < mousePos.y) {
          if (yCounter >= freezeRowIndex && yCounter < rowStartIndex)
            yCounter = rowStartIndex;
          if ((y + data[yCounter].height) >= mousePos.y)
            break;
          y += data[yCounter].height;
          yCounter++;
        }
        tmpSelectedRowIndex = yCounter;
        var y1 = y + data[yCounter].height;
        var x = 0;
        var xCounter = 0;
        for (xCounter = 0; xCounter < (numCols - 1);) {
          //while (colStartIndex + xCounter < (numCols - 1) && (x + colInfo[colStartIndex + xCounter].width) < mousePos.x) {
          if (xCounter >= freezeColIndex && xCounter < colStartIndex)
            xCounter = colStartIndex;
          if ((x + colInfo[xCounter].width) >= mousePos.x)
            break;
          x += colInfo[xCounter].width;
          xCounter++;
        }
        tmpSelectedColIndex = xCounter;
        var x1 = x + colInfo[xCounter].width;

        if (tmpSelectedRowIndex > 0 && tmpSelectedColIndex > 0) {

          selectedRowEndIndex[options.MyKey] = tmpSelectedRowIndex;
          selectedColEndIndex[options.MyKey] = tmpSelectedColIndex;

          if (!evt.shiftKey) {
            selectedRowStartIndex[options.MyKey] = tmpSelectedRowIndex;
            selectedColStartIndex[options.MyKey] = tmpSelectedColIndex;
          }
          selectCell();
          isDragStart = true;
        } else {
          // console.log(tmpSelectedRowIndex, tmpSelectedColIndex);
        }
        //console.log('Drag Start');
        evt.preventDefault();
        evt.stopPropagation();

      });

      mainEvents.mouseup(function(evt, evt1) {
        forwardEvent(evt);
        //console.log('mainEvents', evt.type);
        if (evt1)
          evt = evt1;
        clearInterval(scrollInterval);
        scrollInterval = 0
        scrollEvent = null;
        //console.log('Drag End');
        isDragStart = false;
        evt.preventDefault();
        evt.stopPropagation();
      });

      mainEvents.on('mousemove', function(evt, evt1) {
        //console.log('mainEvents', evt.type);
        if (evt1) {
          evt = evt1;
        } else {
          clearInterval(scrollInterval);
          scrollInterval = 0
          scrollEvent = null;
        }
        if (isDragStart) {
          if (evt.which === 1) {
            var tmpSelectedRowIndex = 0;
            var tmpSelectedColIndex = 0;
            var mousePos = getMousePos(canvas, evt);
            var y = 0;
            var yCounter = 0;
            for (yCounter = 0; yCounter < (numRows - 1);) {
              //while (rowStartIndex + yCounter < (numRows - 1) && (y + data[rowStartIndex + yCounter].height) < mousePos.y) {
              if (yCounter >= freezeRowIndex && yCounter < rowStartIndex)
                yCounter = rowStartIndex;
              if ((y + data[yCounter].height) >= mousePos.y)
                break;
              y += data[yCounter].height;
              yCounter++;
            }
            tmpSelectedRowIndex = yCounter;
            var y1 = y + data[yCounter].height;
            var x = 0;
            var xCounter = 0;
            for (xCounter = 0; xCounter < (numCols - 1);) {
              //while (colStartIndex + xCounter < (numCols - 1) && (x + colInfo[colStartIndex + xCounter].width) < mousePos.x) {
              if (xCounter >= freezeColIndex && xCounter < colStartIndex)
                xCounter = colStartIndex;
              if ((x + colInfo[xCounter].width) >= mousePos.x)
                break;
              x += colInfo[xCounter].width;
              xCounter++;
            }
            tmpSelectedColIndex = xCounter;
            var x1 = x + colInfo[xCounter].width;
            evt.shiftKey = true;
            if (tmpSelectedRowIndex > 0 && tmpSelectedColIndex > 0) {
              selectedRowEndIndex[options.MyKey] = tmpSelectedRowIndex;
              selectedColEndIndex[options.MyKey] = tmpSelectedColIndex;
              selectCell();
              //console.log('dragging', selectedRowStartIndex, selectedRowEndIndex);
            } else {
              scrollEvent = evt;
              if (tmpSelectedColIndex == 0) {
                scrollEvent.clientX = mousePos.left + colInfo[0].width + 1
              }
              if (tmpSelectedRowIndex == 0) {
                scrollEvent.clientY = mousePos.top + data[0].height + 1;
              }
              if (scrollInterval == 0) {
                scrollInterval = setInterval(function() {
                  if (tmpSelectedColIndex == 0) {
                    hScroll.scrollLeft(hScroll.scrollLeft() - 50);
                  }
                  if (tmpSelectedRowIndex == 0) {
                    vScroll.scrollTop(vScroll.scrollTop() - 50);
                  }
                  $(mainEvents).trigger('mousemove', [scrollEvent]);
                }, 10);
              }
            }
          } else {
            $(mainEvents).trigger('mouseup', [evt]);
          }
        } else {
          forwardEvent(evt);
        }
        evt.preventDefault();
        evt.stopPropagation();
      });

      mainEvents.mouseenter(function(evt, evt1) {
        forwardEvent(evt);
        //console.log('mainEvents', evt.type);
        evt.preventDefault();
        evt.stopPropagation();
      });

      mainEvents.mouseleave(function(evt, evt1) {
        forwardEvent(evt);
        //console.log('mainEvents', evt.type);
        evt.preventDefault();
        evt.stopPropagation();
      });

      mainEvents.on('keydown', function(e) {
        //console.log('mainEvents', e.type);
        var keyHandled = true;
        if (drawLock == false) {
          if (e.ctrlKey == false) {
            if (scrollLockCount == 0) {
              if (e.keyCode == 37 || (e.keyCode == 9 && e.shiftKey)) { // left
                if (e.keyCode == 9)
                  e.shiftKey = false;
                if (selectedColEndIndex[options.MyKey] - (data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.colSpanNeg + 1) > 0) {
                  selectedColEndIndex[options.MyKey] -= data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.colSpanNeg + 1;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else if (e.keyCode == 38) { // up
                if (selectedRowEndIndex[options.MyKey] - (data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpanNeg + 1) > 0) {
                  selectedRowEndIndex[options.MyKey] -= data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpanNeg + 1;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else if (e.keyCode == 39 || (e.keyCode == 9 && !e.shiftKey)) { // right
                if (selectedColEndIndex[options.MyKey] + data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.colSpan < (numCols)) {
                  selectedColEndIndex[options.MyKey] += data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.colSpan;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else if (e.keyCode == 40 || e.keyCode == 10 || e.keyCode == 13) { // down
                if (selectedRowEndIndex[options.MyKey] + data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpan < (numRows)) {
                  selectedRowEndIndex[options.MyKey] += data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpan;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else if (e.keyCode == 36) { // home
                if (selectedColEndIndex[options.MyKey] > 1) {
                  selectedColEndIndex[options.MyKey] = 1;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else if (e.keyCode == 35) { // end
                if (selectedColEndIndex[options.MyKey] < (colInfo.length - 1)) {
                  selectedColEndIndex[options.MyKey] = colInfo.length - 1;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else if (e.keyCode == 33) { // page-up
                if (selectedRowEndIndex[options.MyKey] - (data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpanNeg + 1) > 0) {
                  if (selectedRowEndIndex[options.MyKey] != rowStartIndex) {
                    selectedRowEndIndex[options.MyKey] = rowStartIndex;
                    if (!e.shiftKey) {
                      selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                      selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                    }
                    selectCell();
                  } else {
                    vScroll.scrollTop(vScroll.scrollTop() - canvasHeight + (freezeY + canvasHeightAdj + data[selectedRowEndIndex[options.MyKey]].height))
                    setTimeout(function() {
                      if (selectedRowEndIndex[options.MyKey] != rowStartIndex)
                        selectedRowEndIndex[options.MyKey] = rowStartIndex;
                      else
                        selectedRowEndIndex[options.MyKey] = rowEndIndex;
                      if (!e.shiftKey) {
                        selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                        selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                      }
                      selectCell();
                    }, 100);
                  }
                }
              } else if (e.keyCode == 34) { // page-down
                if (selectedRowEndIndex[options.MyKey] + data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpan < (numRows)) {
                  if (selectedRowEndIndex[options.MyKey] != rowEndIndex) {
                    selectedRowEndIndex[options.MyKey] = rowEndIndex;
                    if (!e.shiftKey) {
                      selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                      selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                    }
                    selectCell();
                  } else {
                    vScroll.scrollTop(vScroll.scrollTop() + canvasHeight - (freezeY + canvasHeightAdj + data[selectedRowEndIndex[options.MyKey]].height));
                    setTimeout(function() {
                      if (selectedRowEndIndex[options.MyKey] != rowStartIndex)
                        selectedRowEndIndex[options.MyKey] = rowStartIndex;
                      else
                        selectedRowEndIndex[options.MyKey] = rowEndIndex;
                      if (!e.shiftKey) {
                        selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                        selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                      }
                      selectCell();
                    }, 100);
                  }
                }
              } else if (e.keyCode != 16 // Shift Key
                && e.keyCode != 18 // Alt key
                && e.keyCode != 91 // Win key
                && e.keyCode != 27 // Esc key
              ) {
                if (colInfo[selectedColStartIndex[options.MyKey]].editable && !isGridReadOnly) {
                  // console.log(e.keyCode);
                  cellEditor.html('');
                  cellEditor.show();
                  cellEditor.focus();
                  if (e.keyCode == 113) { //F2
                    cellEditor.text(data[selectedRowStartIndex[options.MyKey]][colInfo[selectedColStartIndex[options.MyKey]].name].value);
                    placeCaretAtEnd(cellEditor[options.MyKey]);
                  }
                  cellEditor.trigger(e);
                } else {}
                keyHandled = false;
                e.stopPropagation();
              } else {
                keyHandled = false;
              }
            }
          }
          if (e.ctrlKey == true) {
            if (scrollLockCount == 0) {
              if (e.keyCode == 36) { // home
                if (selectedColEndIndex[options.MyKey] > 1 || selectedRowEndIndex[options.MyKey] > 1) {
                  selectedColEndIndex[options.MyKey] = 1;
                  selectedRowEndIndex[options.MyKey] = 1;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else if (e.keyCode == 35) { // end
                if (selectedColEndIndex[options.MyKey] < (colInfo.length - 1) || selectedRowEndIndex[options.MyKey] < (data.length - 1)) {
                  selectedColEndIndex[options.MyKey] = colInfo.length - 1;
                  selectedRowEndIndex[options.MyKey] = data.length - 1;
                  if (!e.shiftKey) {
                    selectedColStartIndex[options.MyKey] = selectedColEndIndex[options.MyKey];
                    selectedRowStartIndex[options.MyKey] = selectedRowEndIndex[options.MyKey];
                  }
                  selectCell();
                }
              } else {
                keyHandled = false;
              }
            }
          }
        }
        if (keyHandled) {
          e.stopPropagation();
          e.preventDefault();
        }
      });
    }

    function adjustRowCol() {
      var adjusted = true;
      var cStart = selectedColStartIndex[options.MyKey];
      var cEnd = selectedColEndIndex[options.MyKey];
      if (cStart > cEnd) {
        cEnd = selectedColStartIndex[options.MyKey];
        cStart = selectedColEndIndex[options.MyKey];
      }
      var rStart = selectedRowStartIndex[options.MyKey];
      var rEnd = selectedRowEndIndex[options.MyKey];
      if (rStart > rEnd) {
        rEnd = selectedRowStartIndex[options.MyKey];
        rStart = selectedRowEndIndex[options.MyKey];
      }
      for (var i = rStart; i <= rEnd; i++) {
        for (var j = cStart; j <= cEnd; j++) {
          if (i - data[i][colInfo[j].name].formatting.rowSpanNeg < rStart) {
            rStart = i - data[i][colInfo[j].name].formatting.rowSpanNeg;
            j = cEnd;
            i = rStart - 1;
          } else if (i + (data[i][colInfo[j].name].formatting.rowSpan - 1) > rEnd) {
            rEnd = i + (data[i][colInfo[j].name].formatting.rowSpan - 1);
            j = cEnd;
            i = rStart - 1;
          } else if (j - data[i][colInfo[j].name].formatting.colSpanNeg < cStart) {
            cStart = j - data[i][colInfo[j].name].formatting.colSpanNeg;
            j = cStart - 1;
          } else if (j + (data[i][colInfo[j].name].formatting.colSpan - 1) > cEnd) {
            cEnd = j + (data[i][colInfo[j].name].formatting.colSpan - 1);
            j = cStart - 1;
          }
        }
      }
      if (selectedRowStartIndex[options.MyKey] <= selectedRowEndIndex[options.MyKey]) {
        selectedRowStartIndex[options.MyKey] = rStart;
        selectedRowEndIndex[options.MyKey] = rEnd;
      } else {
        selectedRowStartIndex[options.MyKey] = rEnd;
        selectedRowEndIndex[options.MyKey] = rStart;
      }
      if (selectedColStartIndex[options.MyKey] <= selectedColEndIndex[options.MyKey]) {
        selectedColStartIndex[options.MyKey] = cStart;
        selectedColEndIndex[options.MyKey] = cEnd;
      } else {
        selectedColStartIndex[options.MyKey] = cEnd;
        selectedColEndIndex[options.MyKey] = cStart;
      }
    }

    function placeCaretAtEnd(el) {
      el.focus();
      if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
      }
    }


    var freezePan = function(r, c) {
      r = r + 1;
      c = c + 1;
      if (rowStartIndex != 0 || colStartIndex != 0) {
        alert('Freeze can be applied only if first row or first column is visible');
      }
      if (r != undefined) {
        if (r > rowEndIndex && rowEndIndex > -1) {
          alert('Freeze can be applied only to visible cell');
        } else {
          freezeRowIndex = r;
          freezeY = 0;
          for (var i = 0; i < freezeRowIndex; i++) {
            freezeY += data[i].height;
          }
          rowStartIndex = freezeRowIndex;
        }
      }
      if (c != undefined) {
        if (c > colEndIndex && colEndIndex > -1) {
          alert('Freeze can be applied only to visible cell');
        } else {
          freezeColIndex = c;
          freezeX = 0;
          for (var i = 0; i < freezeColIndex; i++) {
            freezeX += colInfo[i].width;
          }
          colStartIndex = freezeColIndex;
        }
      }
      drawCanvas();
    }

    var resize = function() {
      var width = ele.width();
      var height = ele.height();

      var scrollBar_width = 18;
      canvasHeight = (height - (scrollBar_width + 2));
      canvasWidth = (width - (scrollBar_width + 2));

      ele.find('.mainAxiomCanvas').attr("width", canvasWidth).attr("height", canvasHeight);
      ele.find('.mainComponentDiv').css("width", canvasWidth).css("height", canvasHeight);
      ele.find('.mainEvents').css("width", canvasWidth).css("height", canvasHeight);
      ele.find('.vAxiomScroll').css("height", canvasHeight);
      ele.find('.hAxiomScroll').css("width", canvasWidth);

      rowStartIndex = freezeRowIndex;
      colStartIndex = freezeColIndex;
      updateScrollBars();

      //drawCanvas();
    }

    var updateAnotatedItemPositions = function() {
      if (rowStartIndex == -1 || rowEndIndex == -1 || colStartIndex == -1 || colEndIndex == -1)
        return;
      var keys = Object.keys(anotatedItems);
      for (var iSelector = 0; iSelector < keys.length; iSelector++) {
        selectorIndex = keys[iSelector];
        var y0, y1, x0, x1;
        var y = 0;
        var x = 0;
        if ((anotatedItems[selectorIndex].row < freezeRowIndex || rowStartIndex <= anotatedItems[selectorIndex].row && rowEndIndex >= anotatedItems[selectorIndex].row) && (anotatedItems[selectorIndex].col < freezeColIndex || colStartIndex <= anotatedItems[selectorIndex].col && colEndIndex >= anotatedItems[selectorIndex].col)) { //No scroll needed
          var y = 0;
          var x = 0;
          for (var i = 0; i < anotatedItems[selectorIndex].row; i++) {
            if (i >= freezeRowIndex && i < rowStartIndex) {
              i = rowStartIndex;
              if (rowStartIndex == anotatedItems[selectorIndex].row)
                break;
            }
            y += data[i].height;
          }
          y0 = y;
          y1 = y + data[anotatedItems[selectorIndex].row].height;
          for (var i = 0; i < anotatedItems[selectorIndex].col; i++) {
            if (i >= freezeColIndex && i < colStartIndex) {
              i = colStartIndex;
              if (colStartIndex == anotatedItems[selectorIndex].col)
                break;
            }
            x += colInfo[i].width;
          }
          x0 = x;
          x1 = x + anotatedItems[selectorIndex].col.width;

          if (anotatedItems[selectorIndex].visible == false) {
            anotatedItems[selectorIndex].visible = true;
            anotatedItems[selectorIndex].item.show();

          }

          anotatedItems[selectorIndex].item
            .css('left', x0 + 'px')
            .css('top', function(x) {
              return y0 + 'px';
            });
        } else {
          anotatedItems[selectorIndex].visible = false;
          anotatedItems[selectorIndex].item.hide();
        }
      }
    }

    var selectCell = function(triggerChange) {
      if (rowStartIndex == -1 || rowEndIndex == -1 || colStartIndex == -1 || colEndIndex == -1)
        return;
      adjustRowCol();
      var keys = Object.keys(selectedEndBox);
      for (var iSelector = 0; iSelector < keys.length; iSelector++) {
        selectorIndex = keys[iSelector];
        var y = 0;
        var x = 0;
        if ((selectedRowEndIndex[selectorIndex] < freezeRowIndex || rowStartIndex <= selectedRowEndIndex[selectorIndex] && rowEndIndex >= selectedRowEndIndex[selectorIndex]) && (selectedColEndIndex[selectorIndex] < freezeColIndex || colStartIndex <= selectedColEndIndex[selectorIndex] && colEndIndex >= selectedColEndIndex[selectorIndex])) { //No scroll needed
          var y = 0;
          var x = 0;
          for (var i = 0; i < selectedRowEndIndex[selectorIndex]; i++) {
            if (i >= freezeRowIndex && i < rowStartIndex) {
              i = rowStartIndex;
              if (rowStartIndex == selectedRowEndIndex[selectorIndex])
                break;
            }
            y += data[i].height;
          }
          selectedEndBox[selectorIndex].y0 = y;
          selectedEndBox[selectorIndex].y1 = y + data[selectedRowEndIndex[selectorIndex]].height - cellSelectorBorder * 2;
          for (var i = 0; i < selectedColEndIndex[selectorIndex]; i++) {
            if (i >= freezeColIndex && i < colStartIndex) {
              i = colStartIndex;
              if (colStartIndex == selectedColEndIndex[selectorIndex])
                break;
            }
            x += colInfo[i].width;
          }
          selectedEndBox[selectorIndex].x0 = x;
          selectedEndBox[selectorIndex].x1 = x + colInfo[selectedColEndIndex[selectorIndex]].width - cellSelectorBorder * 2;


          y = 0;
          x = 0;


          if (selectedRowStartIndex[selectorIndex] != selectedRowEndIndex[selectorIndex]) {
            for (var i = 0; i < selectedRowStartIndex[selectorIndex]; i++) {
              if (i >= freezeRowIndex && i < rowStartIndex) {
                i = rowStartIndex;
                if (rowStartIndex == selectedRowEndIndex[selectorIndex])
                  break;
              }
              y += data[i].height;
            }
            selectedStartBox[selectorIndex].y0 = y;
            selectedStartBox[selectorIndex].y1 = y + data[selectedRowStartIndex[selectorIndex]].height - cellSelectorBorder * 2;
          } else {
            selectedStartBox[selectorIndex].y0 = selectedEndBox[selectorIndex].y0;
            selectedStartBox[selectorIndex].y1 = selectedEndBox[selectorIndex].y1;
          }
          if (selectedColStartIndex[selectorIndex] != selectedColEndIndex[selectorIndex]) {
            for (var i = 0; i < selectedColStartIndex[selectorIndex]; i++) {
              if (i >= freezeColIndex && i < colStartIndex) {
                i = colStartIndex;
                if (colStartIndex == selectedColEndIndex[selectorIndex])
                  break;
              }
              x += colInfo[i].width;
            }
            selectedStartBox[selectorIndex].x0 = x;
            selectedStartBox[selectorIndex].x1 = x + colInfo[selectedColStartIndex[selectorIndex]].width - cellSelectorBorder * 2;
          } else {
            selectedStartBox[selectorIndex].x0 = selectedEndBox[selectorIndex].x0;
            selectedStartBox[selectorIndex].x1 = selectedEndBox[selectorIndex].x1;
          }


          if (selectedRowStartIndex[selectorIndex] <= selectedRowEndIndex[selectorIndex] && selectedColStartIndex[selectorIndex] <= selectedColEndIndex[selectorIndex])
            updateCellSelectorPosition(selectedStartBox[selectorIndex].x0, selectedStartBox[selectorIndex].y0, selectedEndBox[selectorIndex].x1, selectedEndBox[selectorIndex].y1, selectorIndex, triggerChange);
          else if (selectedRowStartIndex[selectorIndex] <= selectedRowEndIndex[selectorIndex] && selectedColStartIndex[selectorIndex] > selectedColEndIndex[selectorIndex])
            updateCellSelectorPosition(selectedEndBox[selectorIndex].x0, selectedStartBox[selectorIndex].y0, selectedStartBox[selectorIndex].x1, selectedEndBox[selectorIndex].y1, selectorIndex, triggerChange);
          else if (selectedRowStartIndex[selectorIndex] > selectedRowEndIndex[selectorIndex] && selectedColStartIndex[selectorIndex] <= selectedColEndIndex[selectorIndex])
            updateCellSelectorPosition(selectedStartBox[selectorIndex].x0, selectedEndBox[selectorIndex].y0, selectedEndBox[selectorIndex].x1, selectedStartBox[selectorIndex].y1, selectorIndex, triggerChange);
          else
            updateCellSelectorPosition(selectedEndBox[selectorIndex].x0, selectedEndBox[selectorIndex].y0, selectedStartBox[selectorIndex].x1, selectedStartBox[selectorIndex].y1, selectorIndex, triggerChange);
        } else {
          //console.log(lastScrollTop, lastScrollTopAdj, vScroll.scrollTop());
          if (selectorIndex == options.MyKey && (triggerChange != false)) {
            var updateYScroll = false;
            var updateXScroll = false;
            if (rowEndIndex < selectedRowEndIndex[selectorIndex]) { //scroll down
              var probableNewRowStart = selectedRowEndIndex[selectorIndex];
              //                            y = 0;
              //                            for (var i = selectedRowEndIndex[selectorIndex]; i >= freezeRowIndex; i--) {
              //                                if ((y + data[i].height) > (canvasHeight - freezeY))
              //                                    break;
              //                                probableNewRowStart = i;
              //                                y += data[i].height;
              //                            }
              y = vScroll.scrollTop() + lastScrollTopAdj;
              for (var i = rowEndIndex + 1; i <= probableNewRowStart; i++) {
                y += data[i].height;
              }
              updateYScroll = true;
            } else if (rowStartIndex > selectedRowStartIndex[selectorIndex]) { //scroll up
              var probableNewRowStart = selectedRowStartIndex[selectorIndex];
              y = vScroll.scrollTop() + lastScrollTopAdj;
              for (var i = rowStartIndex - 1; i >= probableNewRowStart; i--) {
                y -= data[i].height;
              }
              updateYScroll = true;
            }

            if (colEndIndex < selectedColEndIndex[selectorIndex]) { //scroll right
              var probableNewColStart = selectedColEndIndex[selectorIndex];
              x = 0;
              //                            for (var i = selectedColEndIndex[selectorIndex]; i >= freezeColIndex; i--) {
              //                                if ((x + colInfo[i].width) > (canvasWidth - freezeX))
              //                                    break;
              //                                probableNewColStart = i;
              //                                x += colInfo[i].width;
              //                            }
              x = hScroll.scrollLeft();
              for (var i = colStartIndex; i < probableNewColStart; i++) {
                x += colInfo[i].width;
              }
              updateXScroll = true;
            } else if (colStartIndex > selectedColStartIndex[selectorIndex]) { //scroll left
              var probableNewColStart = selectedColStartIndex[selectorIndex];
              x = hScroll.scrollLeft();
              for (var i = colStartIndex - 1; i >= probableNewColStart; i--) {
                x -= colInfo[i].width;
              }
              updateXScroll = true;
            }
            if (updateXScroll && updateYScroll) {
              hScroll.scrollLeft(x);
              vScroll.scrollTop(y);
            } else if (updateXScroll) {
              hScroll.scrollLeft(x);
            } else if (updateYScroll) {
              vScroll.scrollTop(y);
            }
          } else {
            updateCellSelectorPosition(-1, -1, -1, -1, selectorIndex);
          }
        }
      }
      if (triggerChange != false)
        ele.trigger('updateSelection', [{
          key: options.MyKey,
          colStart: selectedColStartIndex[options.MyKey],
          rowStart: selectedRowStartIndex[options.MyKey],
          colEnd: selectedColEndIndex[options.MyKey],
          rowEnd: selectedRowEndIndex[options.MyKey],
          selectedStartBox: selectedStartBox[options.MyKey],
          selectedEndBox: selectedEndBox[options.MyKey]
        }]);
      updateAnotatedItemPositions();
    }

    var updateCellSelectorPosition = function(x, y, x1, y1, key, triggerChange) {
      if (key == undefined)
        key = options.MyKey;
      if (x == -1) {
        if (cellSelectorsVisible[key] == true) {
          cellSelectors[key].hide();
          cellSelectorsVisible[key] = false;
        }
      } else {
        if (cellSelectorsVisible[key] == false) {
          cellSelectors[key].show()
            .css('left', x)
            .css('top', y)
            .css('width', (x1 - x) + 'px')
            .css('height', (y1 - y) + 'px');

          cellSelectorsVisible[key] = true;
        } else {
          d3.select(cellSelectors[key][0])
            .transition()
            .duration(isDragStart == true || triggerChange == false ? 0 : 100)
            .style('left', x + 'px')
            .style('top', y + 'px')
            .style('width', (x1 - x) + 'px')
            .style('height', (y1 - y) + 'px');
        }
      }
      if (key == options.MyKey) {
        updateCellEditorPosition(x, y, x1, y1);
      }
    }

    var updateCellEditorPosition = function(x, y) {
      var x1 = 0,
        y1 = 0;
      cellEditor.hide();
      if (x == -1) {} else {
        for (var i = data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpanNeg * -1; i < data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.rowSpan && i < rowEndIndex; i++) {
          y1 += data[selectedRowEndIndex[options.MyKey] + i].height;
        }

        for (var i = data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.colSpanNeg * -1; i < data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name].formatting.colSpan && i < colEndIndex; i++) {
          x1 += colInfo[selectedColEndIndex[options.MyKey] + i].width;
        }
        cellEditorSizes = {
          x: x,
          y: y,
          x1: x1,
          y1: y1
        };

        x1 -= 2 * (cellSelectorBorder + parseFloat(cellEditor.css('padding')));
        y1 -= 2 * (cellSelectorBorder + parseFloat(cellEditor.css('padding')));
        //                y1 -= 2 * (parseFloat(cellEditor.css('border-width')) + parseFloat(cellEditor.css('padding')));
        //                x1 -= 2 * (parseFloat(cellEditor.css('border-width')) + parseFloat(cellEditor.css('padding')));

        cellEditor.css('left', x);
        cellEditor.css('top', y);
        cellEditor.css('min-width', x1);
        cellEditor.css('min-height', y1);
        cellEditor.css('max-width', canvasWidth - (x + 2 * (parseFloat(cellEditor.css('border-width')) + parseFloat(cellEditor.css('padding')))));
        cellEditor.css('max-height', canvasHeight - (y + 2 * (parseFloat(cellEditor.css('border-width')) + parseFloat(cellEditor.css('padding')))));
        cellEditor.html('');
      }
    }

    var getMousePos = function(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top,
        left: rect.left,
        top: rect.top
      };
    }

    var init = function() {
      ele.empty();

      var width = ele.width();
      var height = ele.height();

      var scrollBar_width = 18;
      canvasHeight = (height - (scrollBar_width + 2));
      canvasWidth = (width - (scrollBar_width + 2));

      ele.append('<canvas id="mainAxiomCanvas" class="mainAxiomCanvas" width="' + canvasWidth + '" height="' + canvasHeight + '" style="background:#FEFEFE"></canvas>');
      ele.append('<div class="mainComponentDiv" style="width:' + canvasWidth + 'px; height:' + canvasHeight + 'px; background:transparent; overflow:hidden"></div>');
      ele.append('<div class="mainEvents" style="width:' + canvasWidth + 'px; height:' + canvasHeight + 'px; background:transparent;" tabindex="0"></div>');
      ele.append('<div class="vAxiomScroll" style="width:' + scrollBar_width + 'px; Height:' + canvasHeight + 'px;"><div style="width:1px"></div></div>');
      ele.append('<div class="hAxiomScroll" style="width:' + canvasWidth + 'px; Height:' + scrollBar_width + 'px;"><div style="height:1px"></div></div>');

      hScroll = ele.find('.hAxiomScroll');
      vScroll = ele.find('.vAxiomScroll');
      components = ele.find('.mainComponentDiv');

      cellEditor = $('<div contenteditable class="cellEditor" style="border:' + cellSelectorBorder + 'px solid green; background:#fff; z-index:2">')
      components.append(cellEditor);

      mainEvents = ele.find('.mainEvents');

      canvas = ele.find("#mainAxiomCanvas")[0];
      gContext = canvas.getContext('2d');

      $(document).mousemove(function(evt) {
        //console.log('document mouse move');
        if (isDragStart && evt.which === 1) {
          scrollEvent = evt;
          if (scrollInterval == 0) {
            scrollInterval = setInterval(function() {
              if (scrollEvent.pageX > $(canvas).offset().left + canvasWidth) {
                hScroll.scrollLeft(hScroll.scrollLeft() + 50);
              } else if (scrollEvent.pageX < $(canvas).offset().left) {
                hScroll.scrollLeft(hScroll.scrollLeft() - 50);
              }
              if (scrollEvent.pageY > $(canvas).offset().top + canvasHeight) {
                vScroll.scrollTop(vScroll.scrollTop() + 50);
              } else if (scrollEvent.pageY < $(canvas).offset().top) {
                vScroll.scrollTop(vScroll.scrollTop() - 50);
              }
              $(mainEvents).trigger('mousemove', [scrollEvent]);
            }, 10);
          }
        }
      });

      $(document).mouseup(function(evt) {
        if (isDragStart && evt.which === 1) {
          $(mainEvents).trigger('mouseup', [evt]);
        }
      });

      processData();
    }

    var processData = function() {
      for (var i = 0; i < numRows; i++) {
        for (var j = 0; j < numCols; j++) {
          var dataObj = {
            value: '',
            invalid: false,
            formatting: {
              border: {
                left: {
                  color: 'transparent',
                  style: 'solid',
                  width: 1
                },
                top: {
                  color: 'transparent',
                  style: 'solid',
                  width: 1
                },
                right: {
                  color: 'lightgrey',
                  style: 'solid',
                  width: 1
                },
                bottom: {
                  color: 'lightgrey',
                  style: 'solid',
                  width: 1
                }
              },
              background: '#FEFEFE',
              color: 'black',
              colSpan: 1,
              rowSpan: 1,
              colSpanNeg: 0,
              rowSpanNeg: 0,
              textAlign: 'left',
              textBaseline: 'middle',
              font: {
                family: 'Calibri',
                size: 11,
                bold: false,
                italics: false
              }
            }
          };
          if (i == 0) {
            dataObj.formatting.textAlign = 'center';
          }
          if (i > 0 && j == 0) {
            dataObj.formatting.textAlign = 'right';
            dataObj.value = i.toString();
          }
          if (j == 0 || i == 0) {
            if (i == 0 && colInfo[j].editable == false) {
              dataObj.formatting.background = '#CCC';
            } else {
              dataObj.formatting.background = '#F3F3F3';
            }
            dataObj.formatting.color = 'black';
          }

          $.extend(true, dataObj, data[i][colInfo[j].name]);
          if (mergedCells.indexOf(i + '_' + j) == -1) {
            if (dataObj.formatting.rowSpan > 1 || dataObj.formatting.colSpan > 1) {
              for (var rIndex = i; rIndex < i + dataObj.formatting.rowSpan; rIndex++) {
                for (var cIndex = j; cIndex < j + dataObj.formatting.colSpan; cIndex++) {
                  if (rIndex > i || cIndex > j) {
                    data[rIndex][colInfo[cIndex].name] = {};
                    $.extend(true, data[rIndex][colInfo[cIndex].name], dataObj);
                    data[rIndex][colInfo[cIndex].name].formatting.rowSpan = dataObj.formatting.rowSpan - (rIndex - i);
                    data[rIndex][colInfo[cIndex].name].formatting.colSpan = dataObj.formatting.colSpan - (cIndex - j);
                    data[rIndex][colInfo[cIndex].name].formatting.rowSpanNeg = (rIndex - i);
                    data[rIndex][colInfo[cIndex].name].formatting.colSpanNeg = (cIndex - j);
                    mergedCells.push(rIndex + '_' + cIndex);
                  }
                }
              }
            }
          }
          data[i][colInfo[j].name] = dataObj;
        }
        if (!data[i].height)
          data[i].height = 24;
      }
    }

    var updateScrollBars = function() {
      var totalHeight = 0;
      var totalWidth = 0;
      var vScrollPos = 0;
      var hScrollPos = 0;
      for (var i = 0; i < numRows; i++) {
        totalHeight += data[i].height;
        if (i >= freezeRowIndex && i < rowStartIndex)
          vScrollPos += data[i].height;
      }
      for (var j = 0; j < numCols; j++) {
        totalWidth += colInfo[j].width;
        if (j >= freezeColIndex && j < colStartIndex)
          hScrollPos += colInfo[j].width;
      }
      hScroll.find('div').css('width', totalWidth);
      vScroll.find('div').css('height', totalHeight);

      hScroll.scrollLeft(hScrollPos);
      vScroll.scrollTop(vScrollPos);
      //            if (totalWidth < hScroll.width() || totalHeight < vScroll.height()) {
      //                //rowStartIndex = freezeRowIndex;
      //                //colStartIndex = freezeColIndex;
      //                drawCanvas();
      //            }
      drawCanvas();
      selectCell();
    }

    var findStartIndexBasedOnScroll = function() {
      if (lastScrollLeft == hScroll.scrollLeft() && lastScrollTop == vScroll.scrollTop())
        return;
      if (lastScrollLeft < 0)
        lastScrollLeft = 0;
      if (lastScrollTop < 0)
        lastScrollTop = 0;

      var lastRowStartIndex = rowStartIndex;
      var lastColStartIndex = colStartIndex;
      if ((lastScrollTop - lastScrollTopAdj) > vScroll.scrollTop()) {
        /*scroll up*/
        while (rowStartIndex > 0) {
          if (lastScrollTop - (lastScrollTopAdj > 0 ? lastScrollTopAdj : 0) > vScroll.scrollTop()) {
            lastScrollTop -= data[rowStartIndex].height;
            rowStartIndex--;
          } else {
            break;
          }
        }
      } else if ((lastScrollTop - lastScrollTopAdj) < vScroll.scrollTop()) {
        /*scroll down*/
        while (rowStartIndex < numRows) {
          if (lastScrollTop < vScroll.scrollTop()) {
            lastScrollTop += data[rowStartIndex].height;
            rowStartIndex++;
          } else {
            break;
          }
        }
      }
      //console.log(lastScrollTopAdj);
      lastScrollTopAdj = (lastScrollTop) - vScroll.scrollTop();
      //console.log(lastScrollTopAdj, lastScrollTop, vScroll.scrollTop());

      if ((lastScrollLeft - lastScrollLeftAdj) > hScroll.scrollLeft()) {
        /*scroll left*/
        while (colStartIndex > 0) {
          if (lastScrollLeft - (lastScrollLeftAdj > 0 ? lastScrollLeftAdj : 0) > hScroll.scrollLeft()) {
            lastScrollLeft -= colInfo[colStartIndex].width;
            colStartIndex--;
          } else {
            break;
          }
        }
      } else if ((lastScrollLeft - lastScrollLeftAdj) < hScroll.scrollLeft()) {
        /*scroll right*/
        while (colStartIndex < numCols) {
          if (lastScrollLeft < hScroll.scrollLeft()) {
            lastScrollLeft += colInfo[colStartIndex].width;
            colStartIndex++;
          } else {
            break;
          }
        }
      }
      lastScrollLeftAdj = lastScrollLeft - hScroll.scrollLeft();

      if (lastRowStartIndex != rowStartIndex || lastColStartIndex != colStartIndex) {
        //console.log(lastRowStartIndex, rowStartIndex, lastColStartIndex, colStartIndex);
        drawCanvas();
      }
    }

    function wrapText(context, text, maxWidth, lineHeight) {
      var metrics = context.measureText(text);
      var finalLines = [];
      if (metrics.width <= maxWidth) {
        finalLines.push(text);
        return finalLines;
      } else {
        var words = text.split(' ');
        var line = [];
        var currWidth = 0;
        var totalHeight = 0;

        for (var n = 0; n < words.length; n++) {
          var metrics = context.measureText(words[n] + ' ');
          if (currWidth + metrics.width <= maxWidth) {
            line.push(words[n]);
            currWidth += metrics.width;
          } else {
            if (line.length > 0)
              finalLines.push(line.join(' '));
            currWidth = 0;
            line = [];
            if (metrics.width <= maxWidth) {
              line.push(words[n]);
              currWidth += metrics.width;
            } else {
              for (var c = 0; c < words[n].length; c++) {
                metrics = context.measureText(words[n][c]);
                if (currWidth + metrics.width <= maxWidth) {
                  line.push(words[n][c]);
                  currWidth += metrics.width;
                } else {
                  if (line.length > 0)
                    finalLines.push(line.join(''));
                  line = [];
                  currWidth = 0;
                }
              }
              if (line.length > 0)
                finalLines.push(line.join(''));
              line = [];
              currWidth = 0;
            }
          }
        }
        if (line.length > 0)
          finalLines.push(line.join(' '));
        currWidth = 0;
        line = [];
        return finalLines;
      }
    }

    var drawCell = function(context, x0, y0, x1, y1, i, j) {
      //            var originalContext = context;
      //            if (extraHeightNeg > 0 || extraWidthNeg > 0) {
      //                var tempCanvas = document.getElementById('tempCanvas');
      //                context = tempCanvas.getContext('2d');
      //            }
      //            else {
      //                originalContext = null;
      //            }
      var dataObj = data[i][colInfo[j].name];
      context.beginPath();
      context.rect(x0 + 1, y0 + 1, x1 - (x0 + 2), y1 - (y0 + 2));
      context.fillStyle = dataObj.formatting.background;
      context.fill();
      if (dataObj.formatting.border.top.width > 0) {
        context.beginPath();
        context.moveTo(x0 + (dataObj.formatting.border.left.width - 1), y0 + (dataObj.formatting.border.top.width - 1));
        context.lineTo(x1 - (dataObj.formatting.border.right.width - 1), y0 + (dataObj.formatting.border.top.width - 1));
        context.strokeStyle = dataObj.formatting.border.top.color;
        context.lineWidth = dataObj.formatting.border.top.width;
        context.lineCap = 'round';
        context.stroke();
      }
      if (dataObj.formatting.border.right.width > 0) {
        context.beginPath();
        context.moveTo(x1 - (dataObj.formatting.border.right.width - 1), y0 + (dataObj.formatting.border.top.width - 1));
        context.lineTo(x1 - (dataObj.formatting.border.right.width - 1), y1 - (dataObj.formatting.border.bottom.width - 1));
        context.strokeStyle = dataObj.formatting.border.right.color;
        context.lineWidth = dataObj.formatting.border.right.width;
        context.lineCap = 'round';
        context.stroke();
      }
      if (dataObj.formatting.border.bottom.width > 0) {
        context.beginPath();
        context.moveTo(x1 - (dataObj.formatting.border.right.width - 1), y1 - (dataObj.formatting.border.bottom.width - 1));
        context.lineTo(x0 + (dataObj.formatting.border.left.width - 1), y1 - (dataObj.formatting.border.bottom.width - 1));
        context.strokeStyle = dataObj.formatting.border.bottom.color;
        context.lineWidth = dataObj.formatting.border.bottom.width;
        context.lineCap = 'round';
        context.stroke();
      }
      if (dataObj.formatting.border.left.width > 0) {
        context.beginPath();
        context.moveTo(x0 + (dataObj.formatting.border.left.width - 1), y1 - (dataObj.formatting.border.bottom.width - 1));
        context.lineTo(x0 + (dataObj.formatting.border.left.width - 1), y0 + (dataObj.formatting.border.top.width - 1));
        context.strokeStyle = dataObj.formatting.border.left.color;
        context.lineWidth = dataObj.formatting.border.left.width;
        context.lineCap = 'round';
        context.stroke();
      }

      context.textAlign = dataObj.formatting.textAlign;
      context.textBaseline = dataObj.formatting.textBaseline;
      var fontText = '';
      fontText += dataObj.formatting.font.size + 'pt ';
      fontText += dataObj.formatting.font.family + ' ';
      if (dataObj.formatting.font.bold)
        fontText += 'bold ';
      if (dataObj.formatting.font.italics)
        fontText += 'italic ';

      context.font = fontText;

      if (i == 0) {
        context.beginPath();
        context.moveTo(x0, y1 - 1);
        context.lineTo(x1, y1 - 1);
        context.closePath();
        context.strokeStyle = 'steelblue';
        context.stroke();
      }
      if (j == 0) {
        context.beginPath();
        context.moveTo(x1 - 1, y0);
        context.lineTo(x1 - 1, y1);
        context.closePath();
        context.strokeStyle = 'steelblue';
        context.stroke();
      }

      if (i == (freezeRowIndex - 1) && i != 0) {
        context.beginPath();
        context.moveTo(x0, y1 - 1);
        context.lineTo(x1, y1 - 1);
        context.closePath();
        context.strokeStyle = 'steelblue';
        context.stroke();
      }
      if (j == (freezeColIndex - 1) && j != 0) {
        context.beginPath();
        context.moveTo(x1 - 1, y0);
        context.lineTo(x1 - 1, y1);
        context.closePath();
        context.strokeStyle = 'steelblue';
        context.stroke();
      }

      if (dataObj.invalid == true) {
        context.beginPath();
        context.moveTo(x0 + 1, y0 + 1);
        context.lineTo(x1 - 2, y0 + 1);
        context.lineTo(x1 - 2, y1 - 2);
        context.lineTo(x0 + 1, y1 - 2);
        context.lineTo(x0 + 1, y0 + 1);
        context.closePath();
        context.strokeStyle = 'red';
        context.stroke();
      }


      var text = dataObj.value;
      if (text != '') {
        context.fillStyle = dataObj.formatting.color;

        var offsetX = 0;
        if (context.textAlign == 'left') {
          offsetX = 5;
        } else if (context.textAlign == 'right') {
          offsetX = (x1 - x0) - 5;
        } else if (context.textAlign == 'center') {
          offsetX = ((x1 - x0) / 2);
        }

        var offsetY = 0;
        if (context.textBaseline == 'bottom') {
          offsetY = (y1 - y0) - 1;
        } else if (context.textBaseline == 'top') {
          offsetY = 1;
        } else if (context.textBaseline == 'middle') {
          offsetY = ((y1 - y0) / 2);
        }

        var lineHeight = dataObj.formatting.font.size + parseInt(dataObj.formatting.font.size / 2.5);
        var lines = wrapText(context, text, (x1 - x0) - 10, lineHeight);
        var cellHeight = (lineHeight * lines.length) + 2;
        if (cellHeight <= (y1 - y0)) {
          for (var l = 0; l < lines.length; l++) {
            if (context.textBaseline == 'top')
              context.fillText(lines[l], x0 + offsetX, y0 + offsetY + (l * lineHeight));
            else if (context.textBaseline == 'bottom')
              context.fillText(lines[l], x0 + offsetX, y0 + offsetY + (l - (lines.length - 1)) * lineHeight);
            else {
              context.fillText(lines[l], x0 + offsetX, y0 + offsetY + (l - (lines.length - 1)) * lineHeight + ((lines.length - 1) * lineHeight) / 2);
            }
          }
          return false;
        } else {
          vScroll.find('div').css('height', parseFloat(vScroll.find('div').css('height')) + ((cellHeight - ((y1 - y0) - data[i].height)) - data[i].height));
           if (cellHeight > data[i].height) {
            data[i].height = cellHeight;
            // data[i].height += (cellHeight - ((y1 - y0) - data[i].height)) - data[i].height;
          }
          return true;
          //return false;
        }
      } else {
        return false;
      }
    }

    var drawLock = false;
    var drawCanvas = function() {
      var globalResized = false;
      drawLock = true;
      var localCellSelectorVisible = false;
      if (rowStartIndex == -1)
        rowStartIndex = 0;
      if (colStartIndex == -1)
        colStartIndex = 0;

      gContext.clearRect(0, 0, canvasWidth, canvasHeight);
      var localMergedCells = [];
      var x0 = 0;
      var x1 = 0;
      var y0 = 0;
      var y1 = 0;

      for (var i = 0; i < numRows; i++) {
        if (i >= freezeRowIndex && i < rowStartIndex) {
          i = rowStartIndex;
        }
        rowEndIndex = i;
        x1 = 0;
        y0 = y1;
        y1 += data[i].height;
        for (var j = 0; j < numCols; j++) {
          if (j >= freezeColIndex && j < colStartIndex) {
            j = colStartIndex;
          }
          colEndIndex = j;
          x0 = x1;
          x1 += colInfo[j].width;

          if (localMergedCells.indexOf(i + '_' + j) == -1) {
            var dataObj = data[i][colInfo[j].name];
            var extraWidthNeg = 0;
            var extraHeightNeg = 0;
            var extraWidth = 0;
            var extraHeight = 0;
            for (var rIndex = i - 1; rIndex >= i - dataObj.formatting.rowSpanNeg; rIndex--) {
              extraHeightNeg += data[rIndex].height;
            }
            for (var cIndex = j - 1; cIndex >= j - dataObj.formatting.colSpanNeg; cIndex--) {
              extraWidthNeg += colInfo[cIndex].width;
            }
            if (dataObj.formatting.rowSpan > 1 || dataObj.formatting.colSpan > 1) {
              for (var rIndex = i - dataObj.formatting.rowSpanNeg; rIndex < i + dataObj.formatting.rowSpan; rIndex++) {
                if (rIndex > i) {
                  extraHeight += data[rIndex].height;
                }
                for (var cIndex = j - dataObj.formatting.colSpanNeg; cIndex < j + dataObj.formatting.colSpan; cIndex++) {
                  if (rIndex == i && cIndex > j) {
                    extraWidth += colInfo[cIndex].width;
                  }
                  if (rIndex > i || cIndex > j) {
                    localMergedCells.push(rIndex + '_' + cIndex);
                  }
                }
              }
            }
            if (extraWidthNeg > 0 || extraHeightNeg > 0) {
              var c = $('<canvas id="tempCanvas" width="' + canvas.getAttribute('width') + '" height="' + canvas.getAttribute('height') + '"></canvas>');
              var context = c[0].getContext('2d');
              var resized = drawCell(context, x0 - extraWidthNeg, y0 - extraHeightNeg, x1 + extraWidth, y1 + extraHeight, i - dataObj.formatting.rowSpanNeg, j - dataObj.formatting.colSpanNeg);
              gContext.drawImage(c[0], x0, y0, 2000, 1000, x0, y0, 2000, 1000);
              c = null;
              context = null;
              globalResized = globalResized || resized;
            } else {
              var resized = drawCell(gContext, x0 - extraWidthNeg, y0 - extraHeightNeg, x1 + extraWidth, y1 + extraHeight, i - dataObj.formatting.rowSpanNeg, j - dataObj.formatting.colSpanNeg);
              globalResized = globalResized || resized;
            }
          }
          canvasWidthAdj = x1 - canvasWidth;
          if (x1 > canvasWidth) {
            colEndIndex--;
            break;
          }
        }
        canvasHeightAdj = y1 - canvasHeight;
        if (y1 > canvasHeight) {
          rowEndIndex--;
          break;
        }
      }
      if (globalResized) {
        drawCanvas();
      } else {
        selectCell(false);
        setTimeout(function() {
          drawLock = false;
        }, 0);
      }
    }

    this.addCellSelector = function(color, colStart, rowStart, colEnd, rowEnd, key) {
      if (rowStart == undefined || rowStart < 1)
        selectedRowStartIndex[key] = 1;
      else
        selectedRowStartIndex[key] = rowStart;

      if (rowEnd == undefined || rowEnd < 1)
        selectedRowEndIndex[key] = 1;
      else
        selectedRowEndIndex[key] = rowEnd;

      if (colStart == undefined || colStart < 1)
        selectedColStartIndex[key] = 1;
      else
        selectedColStartIndex[key] = colStart;

      if (colEnd == undefined || colEnd < 1)
        selectedColEndIndex[key] = 1;
      else
        selectedColEndIndex[key] = colEnd;

      selectedStartBox[key] = {
        x0: 0,
        x1: 0,
        y0: 0,
        y1: 0
      };
      selectedEndBox[key] = {
        x0: 0,
        x1: 0,
        y0: 0,
        y1: 0
      };
      if (color == undefined)
        color = "black";
      cellSelectors[key] = $('<div class="cellSelector" style="border: ' + cellSelectorBorder + 'px solid ' + color + ';">');
      cellSelectorsVisible[key] = false;
      components.append(cellSelectors[key]);
      selectCell();
    }

    this.removeCellSelector = function(key) {
      delete selectedRowStartIndex[key];
      delete selectedRowEndIndex[key];
      delete selectedColStartIndex[key];
      delete selectedColEndIndex[key];

      delete selectedStartBox[key];
      delete selectedEndBox[key];
      if (cellSelectors[key].length > 0)
        cellSelectors[key].remove();
      delete cellSelectors[key];
      delete cellSelectorsVisible[key];
    }

    this.selectCells = function(key, colStart, rowStart, colEnd, rowEnd) {
      if (rowStart == undefined || rowStart < 1)
        selectedRowStartIndex[key] = 1;
      else
        selectedRowStartIndex[key] = rowStart;

      if (rowEnd == undefined || rowEnd < 1)
        selectedRowEndIndex[key] = 1;
      else
        selectedRowEndIndex[key] = rowEnd;

      if (colStart == undefined || colStart < 1)
        selectedColStartIndex[key] = 1;
      else
        selectedColStartIndex[key] = colStart;

      if (colEnd == undefined || colEnd < 1)
        selectedColEndIndex[key] = 1;
      else
        selectedColEndIndex[key] = colEnd;

      selectCell(false);
    }

    this.getSelectedRow = function() {
      return data[selectedRowEndIndex[options.MyKey]];
    }

    this.getSelectedCell = function() {
      return data[selectedRowEndIndex[options.MyKey]][colInfo[selectedColEndIndex[options.MyKey]].name];
    }

    this.setItem = function(key, item, row, col) {
      if (anotatedItems[key] != undefined) {
        anotatedItems[key].item.remove();
        delete anotatedItems[key];
      }
      anotatedItems[key] = {
        item: item,
        row: row,
        col: col,
        visible: false
      };
      anotatedItems[key].item.css("position", "absolute");
      anotatedItems[key].item.show();
      //            anotatedItems[key].item.css('left', -100);
      //            anotatedItems[key].item.css('top', -100);
      mainEvents.append(anotatedItems[key].item);
      setTimeout(function() {
        updateAnotatedItemPositions();
      }, 0);
    }

    this.removeItem = function(key) {
      if (anotatedItems[key] != undefined) {
        anotatedItems[key].item.remove();
        delete anotatedItems[key];
      }
    }

    this.updateData = function(localData) {
      data.splice(1, data.length - 1);
      data = data.concat(localData);
      numRows = data.length;
      var keys = Object.keys(anotatedItems);
      for (var i = 0; i < keys.length; i++) {
        anotatedItems[keys[i]].item.remove();
        delete anotatedItems[keys[i]];
      }
      processData();
      updateScrollBars();
    }

    this.getData = function() {
      return [].concat(data);
    }

    init();
    resize();
    bindEvents();
    mainEvents.focus();
    freezePan(freezeRowIndex, freezeColIndex);
    ele.on("resize", function(e, width, height) {
      ele.css('width', width);
      ele.css('height', height);
      resize();
      bindEvents();
      mainEvents.focus();
    });
  };

  $.fn.CanvasGrid = function(options) {
    var element = $(this);
    if (element.data('objCanvasGrid')) {
      return;
    }
    var settings = $.extend({
      colInfo: [],
      data: [],
      readOnly: true,
      showHeaderRow: true,
      rowHeaderWidth: 75,
      freezeRowIndex: 0,
      freezeColIndex: 0,
      MyKey: "MyGrid",
      selectorColor: "Green"
    }, options);

    var objCanvasGrid = new CanvasGrid(this, settings);
    element.data('objCanvasGrid', objCanvasGrid);
    return CanvasGridMethods;
  }; //AXIOM CANVAS GRID END
})(jQuery);
//END
