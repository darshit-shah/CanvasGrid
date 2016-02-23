
var axiomPivotHelper = {
  //create summary rows and store it in array
  prepareSummaryRow: function(data, dimensions, measures, grandtotal) {
    var arrSummaryRows = [];
    var collapsedInfo = {};

    if (dimensions.length > 0) {
      for (var i = 0; i < data.length; i++) {
        for (var j = i + 1; j < data.length; j++) {
          var a = data[i];
          var b = data[j];

          var change = false;
          for (var d = 0; d < dimensions.length; d++) {
            if (a[dimensions[d].fieldRefNumber] == null) {
              change = false;
              break;
            } else if (b[dimensions[d].fieldRefNumber] == null) {
              change = true;
              break;
            } else if (a[dimensions[d].fieldRefNumber].toString() < b[dimensions[d].fieldRefNumber].toString()) {
              change = false;
              break;
            } else if (a[dimensions[d].fieldRefNumber].toString() > b[dimensions[d].fieldRefNumber].toString()) {
              change = true;
              break;
            }
          }
          if (change) {
            var temp = data[i];
            data[i] = data[j];
            data[j] = temp;
          }
        }
      }
    }

    //table level summary
    var objTablewiseMeasureSummary = {};
    objTablewiseMeasureSummary['rEndIndex'] = 0;
    objTablewiseMeasureSummary['rStartIndex'] = 0;
    for (var m = 0; m < measures.length; m++) {
      var objSummary = {};
      objSummary['sum'] = 0;
      objSummary['min'] = Infinity;
      objSummary['max'] = -Infinity;
      objSummary['avg'] = 0;
      objSummary['count'] = 0;
      objTablewiseMeasureSummary[measures[m].fieldRefNumber] = objSummary;
    }

    //column level summary
    var arrColumnLevelSummary = [];
    for (var d = 0; d < dimensions.length - 1; d++) {
      var objColwiseMeasureSummary = {};
      objColwiseMeasureSummary['rEndIndex'] = 0;
      objColwiseMeasureSummary['rStartIndex'] = 0;
      for (var m = 0; m < measures.length; m++) {
        var objSummary = {};
        objSummary['sum'] = 0;
        objSummary['min'] = Infinity;
        objSummary['max'] = -Infinity;
        objSummary['avg'] = 0;
        objSummary['count'] = 0;
        objColwiseMeasureSummary[measures[m].fieldRefNumber] = objSummary;
      }
      arrColumnLevelSummary.push(objColwiseMeasureSummary);
    }

    //start finding summary row position
    var rowStartIndex = 0;
    for (var r = 0; r < data.length; r++) {
      //calculate summary
      var currentRow = data[r];
      var nextRow = data[r + 1];
      var misMatchColIndex = -1;

      //calc table level summary
      for (var m = 0; m < measures.length; m++) {
        objTablewiseMeasureSummary[measures[m].fieldRefNumber]['sum'] += +currentRow[measures[m].fieldRefNumber];
        objTablewiseMeasureSummary[measures[m].fieldRefNumber]['min'] = Math.min(objTablewiseMeasureSummary[measures[m].fieldRefNumber]['min'], currentRow[measures[m].fieldRefNumber]);
        objTablewiseMeasureSummary[measures[m].fieldRefNumber]['max'] = Math.max(objTablewiseMeasureSummary[measures[m].fieldRefNumber]['max'], currentRow[measures[m].fieldRefNumber]);
        objTablewiseMeasureSummary[measures[m].fieldRefNumber]['count']++;
        objTablewiseMeasureSummary[measures[m].fieldRefNumber]['avg'] = objTablewiseMeasureSummary[measures[m].fieldRefNumber]['sum'] / objTablewiseMeasureSummary[measures[m].fieldRefNumber]['count'];
      }

      //check if group changed
      objTablewiseMeasureSummary.rEndIndex++;

      for (var d = dimensions.length - 2; d >= 0; d--) {
        var objColwiseMeasureSummary = arrColumnLevelSummary[d]; //columnwise calcution prepare
        for (var m = 0; m < measures.length; m++) {
          //calc column level summary
          var objSummary = objColwiseMeasureSummary[measures[m].fieldRefNumber];
          objSummary['sum'] += +currentRow[measures[m].fieldRefNumber];
          objSummary['min'] = Math.min(objSummary['min'], +currentRow[measures[m].fieldRefNumber]);
          objSummary['max'] = Math.max(objSummary['max'], +currentRow[measures[m].fieldRefNumber]);
          objSummary['count']++;
          objSummary['avg'] = objSummary['sum'] / objSummary['count'];
        }

        //check if group changed
        objColwiseMeasureSummary.rEndIndex = r;
        if (true || misMatchColIndex == -1) {
          if ((r == data.length - 1) || (currentRow[dimensions[d].fieldRefNumber] != nextRow[dimensions[d].fieldRefNumber])) {
            misMatchColIndex = d;
            if (collapsedInfo[objColwiseMeasureSummary.rStartIndex] == undefined) {
              collapsedInfo[objColwiseMeasureSummary.rStartIndex] = {};
            }
            collapsedInfo[objColwiseMeasureSummary.rStartIndex][dimensions[d].fieldRefNumber] = {
              collapsible: true,
              isCollapsed: false,
              rStartIndex: objColwiseMeasureSummary.rStartIndex,
              rEndIndex: objColwiseMeasureSummary.rEndIndex
            };

            //for (var d = misMatchColIndex; d < dimensions.length - 1; d++) {
            var objColwiseMeasureSummary = arrColumnLevelSummary[d]; //columnwise calculation ready

            //get aggregation specified by user on column
            var tempArrSummary = null;
            if (dimensions[d].hasOwnProperty('summary')) {
              tempArrSummary = dimensions[d].summary;
            }

            //add summary data in row
            var aggrKeys = Object.keys(tempArrSummary.aggregation);
            for (var k = 0; k < aggrKeys.length; k++) {
              if (tempArrSummary.aggregation[aggrKeys[k]].display == true) {
                var objSummaryRow = {}; //final summary row
                objSummaryRow.rEndIndex = objColwiseMeasureSummary.rEndIndex;
                objSummaryRow.rStartIndex = objColwiseMeasureSummary.rStartIndex;
                objSummaryRow.cIndex = d;
                var tempRow = $.extend(true, {}, currentRow);

                //clear cells between key to summary cell
                for (var dd = misMatchColIndex; dd < dimensions.length; dd++) {
                  tempRow[dimensions[dd].fieldRefNumber] = '';
                }

                var decimalPlaces = null;
                if (tempArrSummary.aggregation[aggrKeys[k]].hasOwnProperty('decimalPlaces'))
                  decimalPlaces = tempArrSummary.aggregation[aggrKeys[k]].decimalPlaces;
                tempRow[dimensions[d].fieldRefNumber] =
                  (tempArrSummary.aggregation[aggrKeys[k]].prefixSummaryTitle != undefined && tempArrSummary.aggregation[aggrKeys[k]].prefixSummaryTitle == false) ? tempArrSummary.aggregation[aggrKeys[k]].summaryTitle : currentRow[dimensions[d].fieldRefNumber] + ' ' + tempArrSummary.aggregation[aggrKeys[k]].summaryTitle;
                if (tempRow.formatting == undefined)
                  tempRow.formatting = "{}";
                var rowFormatting = JSON.parse(tempRow.formatting);
                for (var mm = 0; mm < measures.length; mm++) {
                  var summaryVal = '-';
                  var summaryStyle = tempArrSummary.aggregation[aggrKeys[k]].style;
                  if (summaryStyle != undefined) {
                    for (var sd = 0; sd < dimensions.length; sd++) {
                      rowFormatting[dimensions[sd].fieldRefNumber] = $.extend(rowFormatting[dimensions[sd].fieldRefNumber], summaryStyle);
                    }
                    rowFormatting[measures[mm].fieldRefNumber] = $.extend(rowFormatting[measures[mm].fieldRefNumber], summaryStyle);
                  }
                  if (!isNaN(objColwiseMeasureSummary[measures[mm].fieldRefNumber][aggrKeys[k]])) {
                    if (decimalPlaces != null)
                      summaryVal = objColwiseMeasureSummary[measures[mm].fieldRefNumber][aggrKeys[k]].toFixed(decimalPlaces);
                    else
                      summaryVal = objColwiseMeasureSummary[measures[mm].fieldRefNumber][aggrKeys[k]];
                  }
                  tempRow[measures[mm].fieldRefNumber] = summaryVal;
                }
                tempRow.formatting = JSON.stringify(rowFormatting);
                objSummaryRow.row = tempRow;
                arrSummaryRows.push(objSummaryRow);
                objTablewiseMeasureSummary.rEndIndex++;
              }
            }

            for (var mm = 0; mm < measures.length; mm++) {
              objColwiseMeasureSummary[measures[mm].fieldRefNumber]['sum'] = 0;
              objColwiseMeasureSummary[measures[mm].fieldRefNumber]['min'] = Infinity;
              objColwiseMeasureSummary[measures[mm].fieldRefNumber]['max'] = -Infinity;
              objColwiseMeasureSummary[measures[mm].fieldRefNumber]['avg'] = 0;
              objColwiseMeasureSummary[measures[mm].fieldRefNumber]['count'] = 0;
            }
            //re-intilize
            objColwiseMeasureSummary['rEndIndex'] = 0;
            objColwiseMeasureSummary['rStartIndex'] = r + 1;
            //}
          }
        }
      }

      if (misMatchColIndex > -1) {

      }
    }

    //objTablewiseMeasureSummary['avg'] = objTablewiseMeasureSummary['sum']/objTablewiseMeasureSummary['count'];

    //add grandtotal
    if (grandtotal != undefined) {
      var aggrKeys = Object.keys(grandtotal.aggregation);
      var position = grandtotal.position;
      for (var k = aggrKeys.length - 1; k >= 0; k--) {
        var tempRow = $.extend(true, {}, data[data.length - 1]); //last row
        if (grandtotal.aggregation[aggrKeys[k]].display == true) {
          var objSummaryRow = {}; //final summary row
          objSummaryRow.rEndIndex = data.length + arrSummaryRows.length;
          objSummaryRow.rStartIndex = 0;

          //clear all dimenstion cells value
          for (var d = 0; d < dimensions.length; d++) {
            tempRow[dimensions[d].fieldRefNumber] = '';
          }

          var decimalPlaces = null;
          if (grandtotal.aggregation[aggrKeys[k]].hasOwnProperty('decimalPlaces'))
            decimalPlaces = grandtotal.aggregation[aggrKeys[k]].decimalPlaces;
          tempRow[dimensions[dimensions.length - 1].fieldRefNumber] = grandtotal.aggregation[aggrKeys[k]].summaryTitle;
          if (tempRow.formatting == undefined)
            tempRow.formatting = "{}";
          var rowFormatting = JSON.parse(tempRow.formatting);
          for (var mm = 0; mm < measures.length; mm++) {
            var summaryVal = '-';
            var summaryStyle = grandtotal.aggregation[aggrKeys[k]].style;
            if (summaryStyle != undefined) {
              for (var sd = 0; sd < dimensions.length; sd++) {
                rowFormatting[dimensions[sd].fieldRefNumber] = $.extend(rowFormatting[dimensions[sd].fieldRefNumber], summaryStyle);
              }
              rowFormatting[measures[mm].fieldRefNumber] = $.extend(rowFormatting[measures[mm].fieldRefNumber], summaryStyle);
            }
            if (!isNaN(objTablewiseMeasureSummary[measures[mm].fieldRefNumber][aggrKeys[k]])) {
              if (decimalPlaces != null)
                summaryVal = objTablewiseMeasureSummary[measures[mm].fieldRefNumber][aggrKeys[k]].toFixed(decimalPlaces);
              else
                summaryVal = objTablewiseMeasureSummary[measures[mm].fieldRefNumber][aggrKeys[k]];
            }
            tempRow[measures[mm].fieldRefNumber] = summaryVal;
          }
          tempRow.formatting = JSON.stringify(rowFormatting);
          objSummaryRow.row = tempRow;
          if (position == 'top') {
            objSummaryRow.rEndIndex = -1;
            arrSummaryRows.splice(0, 0, objSummaryRow); //insert at top
          } else {
            arrSummaryRows.push(objSummaryRow);
          }
        }
      }
    }
    return {
      summaryRows: arrSummaryRows,
      collapsedInfo: collapsedInfo
    };
  },
  prepareData: function(options) {
    var collapsible = options.collapsible;
    var showSummary = options.showSummary;
    var repeatContent = options.repeatContent;
    var grandTotal = options.grandTotal;
    var dimensions = options.dimensions;
    var measures = options.measures;
    var data = options.data;

    var summaryRowCount = 0;
    if (grandTotal != undefined) {
      if (grandTotal.aggregation.sum.display == true) summaryRowCount++;
      if (grandTotal.aggregation.min.display == true) summaryRowCount++;
      if (grandTotal.aggregation.max.display == true) summaryRowCount++;
      if (grandTotal.aggregation.avg.display == true) summaryRowCount++;
      if (grandTotal.aggregation.count.display == true) summaryRowCount++;
      grandTotal.summaryRowCount = summaryRowCount;
    }

    for (var i = 0; i < dimensions.length - 1; i++) {
      dimensions[i].collapsible = dimensions[i].collapsible != undefined ? dimensions[i].collapsible : collapsible;
      dimensions[i].repeatContent = dimensions[i].repeatContent != undefined ? dimensions[i].repeatContent : repeatContent;
      dimensions[i].summaryRowCount = 0;
      if (showSummary == true) {
        if (dimensions[i].summary.aggregation.sum.display == true) dimensions[i].summaryRowCount++;
        if (dimensions[i].summary.aggregation.min.display == true) dimensions[i].summaryRowCount++;
        if (dimensions[i].summary.aggregation.max.display == true) dimensions[i].summaryRowCount++;
        if (dimensions[i].summary.aggregation.avg.display == true) dimensions[i].summaryRowCount++;
        if (dimensions[i].summary.aggregation.count.display == true) dimensions[i].summaryRowCount++;
      }
    }

    var arrSummaryRowsDet = axiomPivotHelper.prepareSummaryRow(data, dimensions, measures, grandTotal);
    var arrSummaryRows = arrSummaryRowsDet.summaryRows;
    var collapsedInfo = arrSummaryRowsDet.collapsedInfo;

    var colInfo = [];
    for (var i = 0; i < dimensions.length; i++) {
      var info = {};
      info.name = dimensions[i].fieldRefNumber;
      info.width = 200;
      colInfo.push(info);
      info = null;
    }
    for (var i = 0; i < measures.length; i++) {
      var info = {};
      info.name = measures[i].fieldRefNumber;
      info.width = 200;
      colInfo.push(info);
      info = null;
    }

    function processData() {
      var icons = [];
      var colData = JSON.parse(JSON.stringify(colInfo));
      var rowData = [];
      var latestCollapsedInfo = {};
      var currSummaryRow = 0;
      var rowIndex = 0;
      for (var r = 0; r < data.length; r++) {
        if (showSummary == true && currSummaryRow < arrSummaryRows.length && (r - 1 >= arrSummaryRows[currSummaryRow].rEndIndex)) {
          if (r - 1 == arrSummaryRows[currSummaryRow].rEndIndex) {
            rowData.push($.extend(true, {}, arrSummaryRows[currSummaryRow].row));
            if (repeatContent == false && arrSummaryRows[currSummaryRow].cIndex != undefined) {
              for (var cNext = 0; cNext < arrSummaryRows[currSummaryRow].cIndex; cNext++) {
                rowData[rowData.length - 1][colInfo[cNext].name] = "";
              }
            }
            rowIndex++;
          }
          currSummaryRow++;
          r--;
        } else {
          if (collapsedInfo[r] != undefined) {
            latestCollapsedInfo = collapsedInfo[r];
            var added = false;
            for (var c = 0; c < dimensions.length - 1; c++) {
              if (collapsedInfo[r][colData[c].name] != undefined) {
                icons.push({
                  id: rowIndex + '_' + c,
                  row: (rowIndex + 1),
                  col: (c + 1),
                  data: {
                    r: r,
                    c: c
                  }
                });
                if (collapsedInfo[r][colData[c].name].isCollapsed) {
                  rowData.push($.extend(true, {}, data[r]));
                  if (repeatContent == false) {
                    for (var cNext = 0; cNext < c; cNext++) {
                      if (!latestCollapsedInfo.hasOwnProperty(colInfo[cNext].name))
                        rowData[rowData.length - 1][colInfo[cNext].name] = "";
                    }
                  }
                  for (var cNext = c + 1; cNext < colInfo.length; cNext++) {
                    rowData[rowData.length - 1][colInfo[cNext].name] = "";
                  }
                  rowIndex++;
                  added = true;
                  //debugger;
                  r += (collapsedInfo[r][colData[c].name].rEndIndex - collapsedInfo[r][colData[c].name].rStartIndex);
                  while (showSummary == true && currSummaryRow < arrSummaryRows.length && (r >= arrSummaryRows[currSummaryRow].rEndIndex)) {
                    if (r == arrSummaryRows[currSummaryRow].rEndIndex && arrSummaryRows[currSummaryRow].cIndex <= c) {
                      rowData.push($.extend(true, {}, arrSummaryRows[currSummaryRow].row));
                      if (repeatContent == false) {
                        for (var cNext = 0; cNext < c; cNext++) {
                          if (arrSummaryRows[currSummaryRow].cIndex == c)
                            rowData[rowData.length - 1][colInfo[cNext].name] = "";
                        }
                      }
                      rowIndex++;
                    }
                    currSummaryRow++;
                  }
                  break;
                }
              }
            }
            if (!added) {
              rowData.push($.extend(true, {}, data[r]));
              if (repeatContent == false) {
                for (var c = 0; c < dimensions.length - 1; c++) {
                  if (!latestCollapsedInfo.hasOwnProperty(colData[c].name)) {
                    rowData[rowData.length - 1][colData[c].name] = "";
                  }
                }
              }
              rowIndex++;
            }
          } else {
            rowData.push($.extend(true, {}, data[r]));
            if (repeatContent == false) {
              for (var c = 0; c < dimensions.length - 1; c++) {
                rowData[rowData.length - 1][colData[c].name] = "";
              }
            }
            rowIndex++;
          }
        }
      }

      while (showSummary == true && currSummaryRow < arrSummaryRows.length) {
        rowData.push($.extend(true, {}, arrSummaryRows[currSummaryRow].row));
        if (repeatContent == false && arrSummaryRows[currSummaryRow].cIndex != undefined) {
          for (var cNext = 0; cNext < arrSummaryRows[currSummaryRow].cIndex; cNext++) {
            rowData[rowData.length - 1][colInfo[cNext].name] = "";
          }
        }
        currSummaryRow++;
      }

      var rowInfo = [];
      for (var row = 0; row < rowData.length; row++) {
        var info = {
          height: 24
        };
        for (var col = 0; col < colInfo.length; col++) {
          info[colInfo[col].name] = {};
          if (rowData[row][colInfo[col].name] == undefined)
            rowData[row][colInfo[col].name] = "";
          info[colInfo[col].name].value = "     " + rowData[row][colInfo[col].name].toString();
          info[colInfo[col].name].formatting = {};
          if (rowData[row]['formatting'] == undefined)
            rowData[row]['formatting'] = "{}";
          var formatting = JSON.parse(rowData[row]['formatting']);
          if (formatting[colInfo[col].name] && formatting[colInfo[col].name].bgColor)
            info[colInfo[col].name].formatting.background = formatting[colInfo[col].name].bgColor;
          if (formatting[colInfo[col].name] && formatting[colInfo[col].name].foreColor)
            info[colInfo[col].name].formatting.color = formatting[colInfo[col].name].foreColor;
        }
        rowInfo.push(info);
      }
      options.cb(colInfo, rowInfo, icons, collapsedInfo, processData);
    }
    processData();
  }

}
