var axiomPivotHelper = {
    //create summary rows and store it in array
    prepareSummaryRow: function (data, dimensions, measures, grandtotal) {
        var arrSummaryRows = [];
        var collapsedInfo = {};

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
                        collapsedInfo[objColwiseMeasureSummary.rStartIndex][dimensions[d].fieldRefNumber] = { collapsible: true, isCollapsed: false, rStartIndex: objColwiseMeasureSummary.rStartIndex, rEndIndex: objColwiseMeasureSummary.rEndIndex };

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
                                        (tempArrSummary.aggregation[aggrKeys[k]].prefixSummaryTitle != undefined && tempArrSummary.aggregation[aggrKeys[k]].prefixSummaryTitle == false)
                                        ? tempArrSummary.aggregation[aggrKeys[k]].summaryTitle
                                        : currentRow[dimensions[d].fieldRefNumber] + ' ' + tempArrSummary.aggregation[aggrKeys[k]].summaryTitle;
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
                    if (position && position == 'top') {
                        objSummaryRow.rEndIndex = -1;
                        arrSummaryRows.splice(0, 0, objSummaryRow); //insert at top
                    }
                    else {
                        arrSummaryRows.push(objSummaryRow);
                    }
                }
            }
        }
        return { summaryRows: arrSummaryRows, collapsedInfo: collapsedInfo };
    },
    //insert summary rows
    insertSummaryRows: function (data, summaryRows, showDimensionsSummary, showGrandSummary, grandSummaryRowsPosition, grandSummaryRowsCount) {
        if (showDimensionsSummary && showGrandSummary) {//all rows
            for (var i = 0; i < summaryRows.length; i++) {
                data.splice(summaryRows[i].rEndIndex + 1, 0, summaryRows[i].row);
                for (var j = i + 1; j < summaryRows.length; j++) {
                    summaryRows[j].rEndIndex++;
                }
            }
        }
        else if (showDimensionsSummary && !showGrandSummary) {//only summary rows
            if (grandSummaryRowsPosition == 'top') {
                for (var i = grandSummaryRowsCount; i < summaryRows.length; i++) {
                    data.splice(summaryRows[i].rEndIndex + 1, 0, summaryRows[i].row);
                    for (var j = i + 1; j < summaryRows.length; j++) {
                        summaryRows[j].rEndIndex++;
                    }
                }
            }
            else {
                for (var i = 0; i < summaryRows.length - grandSummaryRowsCount; i++) {
                    data.splice(summaryRows[i].rEndIndex + 1, 0, summaryRows[i].row);
                    for (var j = i + 1; j < summaryRows.length; j++) {
                        summaryRows[j].rEndIndex++;
                    }
                }
            }
        }
        else if (!showDimensionsSummary && showGrandSummary) {//only grand totals
            if (grandSummaryRowsPosition == 'top') {
                for (var i = 0; i < grandSummaryRowsCount; i++) {
                    data.splice(summaryRows[i].rEndIndex + 1, 0, summaryRows[i].row);
                    for (var j = i + 1; j < summaryRows.length; j++) {
                        summaryRows[j].rEndIndex++;
                    }
                }
            }
            else {
                for (var i = summaryRows.length - 1; i >= summaryRows.length - grandSummaryRowsCount; i--) {
                    data.splice(summaryRows[i].rEndIndex + 1, 0, summaryRows[i].row);
                    for (var j = i + 1; j < summaryRows.length; j++) {
                        summaryRows[j].rEndIndex++;
                    }
                }
            }
        }
    },
    sortData: function () {
    },
    findExpandCollapseCells: function (data, arrFields, options) {
        var rStartPos = 0;
        if (options.grandTotal) {
            if (options.grandTotal.position && options.grandTotal.position == 'top')
                rStartPos = options.grandTotal.summaryRowCount;
        }

        //find expand collapse cells
        var arrRowStartIndex = [rStartPos];
        var summaryRowCount = 0;
        if (arrFields[1].hasOwnProperty('summaryRowCount') && arrFields[1].summaryRowCount > 0)//if summary row specified
            summaryRowCount = arrFields[1].summaryRowCount;
        var arrRowEndIndex = [data.length];
        while (arrRowStartIndex.length > 0) {
            for (var c = 1; c < arrFields.length; c++) {
                if (arrRowStartIndex[arrRowStartIndex.length - 1] >= arrRowEndIndex[arrRowEndIndex.length - 1]) {
                    var tempStartIndex = arrRowStartIndex.pop();
                    arrRowEndIndex.pop();
                    var summaryRowCount = 0;
                    if (arrFields[arrRowStartIndex.length].hasOwnProperty('summaryRowCount') && arrFields[arrRowStartIndex.length].summaryRowCount > 0)//if summary row specified
                        summaryRowCount = arrFields[arrRowStartIndex.length].summaryRowCount;
                    arrRowStartIndex[arrRowStartIndex.length - 1] = tempStartIndex + summaryRowCount;
                    c -= 2;
                    continue;
                }
                var isCollapsible = false;
                if (arrFields[c].hasOwnProperty('collapsible') && arrFields[c].collapsible == true)
                    isCollapsible = true;

                if (isCollapsible) {
                    var summaryRowCount = 0;
                    if (arrFields[c].hasOwnProperty('summaryRowCount') && arrFields[c].summaryRowCount > 0)//if summary row specified
                        summaryRowCount = arrFields[c].summaryRowCount;
                    var isBreaked = false;
                    for (var i = arrRowStartIndex[arrRowStartIndex.length - 1]; (i + summaryRowCount + 1) < arrRowEndIndex[arrRowEndIndex.length - 1]; i++) {
                        var currentVal = data[i][arrFields[c].fieldRefNumber];
                        var nextVal = data[i + summaryRowCount + 1][arrFields[c].fieldRefNumber];
                        if (currentVal != nextVal) {
                            if (i != arrRowStartIndex[arrRowStartIndex.length - 1] && options.repeatContent == false) {
                                data[i][arrFields[c].fieldRefNumber] = '';
                            }
                            for (var tempI = 0; tempI < summaryRowCount; tempI++) {
                                if (options.repeatContent == false)
                                    data[i + tempI + 1][arrFields[c].fieldRefNumber] = '';
                            }

                            data[arrRowStartIndex[arrRowStartIndex.length - 1]][arrFields[c].fieldRefNumber]['grouped_row_cnt'] = (i - arrRowStartIndex[arrRowStartIndex.length - 1]) + 1;
                            data[arrRowStartIndex[arrRowStartIndex.length - 1]][arrFields[c].fieldRefNumber]['isCollapsed'] = false;
                            data[arrRowStartIndex[arrRowStartIndex.length - 1]][arrFields[c].fieldRefNumber]['collapsible'] = true;
                            arrRowStartIndex.push(arrRowStartIndex[arrRowStartIndex.length - 1]);
                            arrRowEndIndex.push(i + 1);
                            isBreaked = true;
                            break;
                        }
                        else {
                            if (i != arrRowStartIndex[arrRowStartIndex.length - 1] && options.repeatContent == false) {
                                data[i][arrFields[c].fieldRefNumber] = '';
                            }
                        }
                    }
                    if (!isBreaked) {
                        var numOfRows = (arrRowEndIndex[arrRowEndIndex.length - 1] - arrRowStartIndex[arrRowStartIndex.length - 1]) - summaryRowCount;
                        for (var tempI = 0; tempI < summaryRowCount + (numOfRows > 1 ? 1 : 0); tempI++) {
                            if (options.repeatContent == false)
                                data[arrRowEndIndex[arrRowEndIndex.length - 1] - (tempI + 1)][arrFields[c].fieldRefNumber] = '';
                        }
                        if (i < data.length - 1) {
                            data[arrRowStartIndex[arrRowStartIndex.length - 1]][arrFields[c].fieldRefNumber]['grouped_row_cnt'] = numOfRows;
                            data[arrRowStartIndex[arrRowStartIndex.length - 1]][arrFields[c].fieldRefNumber]['isCollapsed'] = false;
                            data[arrRowStartIndex[arrRowStartIndex.length - 1]][arrFields[c].fieldRefNumber]['collapsible'] = true;
                        }
                        arrRowStartIndex.push(arrRowStartIndex[arrRowStartIndex.length - 1]);
                        var summaryRowCount = 0;
                        if (arrFields[arrRowEndIndex.length].hasOwnProperty('summaryRowCount') && arrFields[arrRowEndIndex.length].summaryRowCount > 0)//if summary row specified
                            summaryRowCount = arrFields[arrRowEndIndex.length].summaryRowCount;
                        arrRowEndIndex.push(arrRowEndIndex[arrRowEndIndex.length - 1] - summaryRowCount);
                    }
                }
                else {
                    if (arrRowStartIndex.length > 1) {
                        arrRowStartIndex.pop();
                        var summaryRowCount = 0;
                        if (arrFields[arrRowStartIndex.length].hasOwnProperty('summaryRowCount') && arrFields[arrRowStartIndex.length].summaryRowCount > 0)//if summary row specified
                            summaryRowCount = arrFields[arrRowStartIndex.length].summaryRowCount;
                        c = arrRowStartIndex.length - 1;
                        arrRowStartIndex[arrRowStartIndex.length - 1] = arrRowEndIndex.pop() + summaryRowCount;
                    }
                    else {
                        arrRowStartIndex = [];
                        arrRowEndIndex = [];
                        break;
                    }
                }
            }
        }
    }
}