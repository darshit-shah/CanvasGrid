function getData() {
    fieldData = [
                { "hidden": 0, "fieldID": 1, "fieldName": "City", "dataTypeID": "General", "formatID": "", "seqNo": 1, "colWidth": 180, "fieldRefNumber": "City", "dataTypeDisplayValue": "General", "colWidthType": "px", "isMasterView": 1, "calculateFormula": "", collapsible: true }
            , { "hidden": 0, "fieldID": 2, "fieldName": "State", "dataTypeID": "General", "formatID": "", "seqNo": 2, "colWidth": 180, "fieldRefNumber": "State", "dataTypeDisplayValue": "General", "colWidthType": "px", "isMasterView": 1, "calculateFormula": "", collapsible: true }
            , { "hidden": 0, "fieldID": 3, "fieldName": "Area", "dataTypeID": "General", "formatID": "", "seqNo": 3, "colWidth": 180, "fieldRefNumber": "Area", "dataTypeDisplayValue": "General", "colWidthType": "px", "isMasterView": 1, "calculateFormula": "", collapsible: true }
            , { "hidden": 0, "fieldID": 4, "fieldName": "Cnt", "dataTypeID": "General", "formatID": "", "seqNo": 4, "colWidth": 180, "fieldRefNumber": "Cnt", "dataTypeDisplayValue": "General", "colWidthType": "px", "isMasterView": 1, "calculateFormula": "10*10" }
            ];

    var tableData = [];
    for (var i = 1; i <= 15; i++) {
        var formatting = JSON.stringify({ "City": {}, "State": {} });
        tableData.push({ "pk_ID": i, "granularity": null, "formatting": formatting, "rowID": i, "createdDate": 1413279409, "modifiedDate": 1413794179, "createdBy": 1, "modifiedBy": 1, "createdIP": "127.0.0.1", "modifiedIP": "127.0.0.1", "City": "India", "State": "Gujarat", "Area": "Area" + (i), "Cnt": "26.33333" });
    }
    for (var i = 1; i <= 2; i++) {
        var formatting = JSON.stringify({ "City": {}, "State": {} });
        tableData.push({ "pk_ID": i, "granularity": null, "formatting": formatting, "rowID": i, "createdDate": 1413279409, "modifiedDate": 1413794179, "createdBy": 1, "modifiedBy": 1, "createdIP": "127.0.0.1", "modifiedIP": "127.0.0.1", "City": "USA", "State": "CH", "Area": "Area" + (i), "Cnt": "26.33333" });
    }
    for (var i = 1; i <= 7; i++) {
        var formatting = JSON.stringify({ "City": {}, "State": {} });
        tableData.push({ "pk_ID": i, "granularity": null, "formatting": formatting, "rowID": i, "createdDate": 1413279409, "modifiedDate": 1413794179, "createdBy": 1, "modifiedBy": 1, "createdIP": "127.0.0.1", "modifiedIP": "127.0.0.1", "City": "USA", "State": "LA", "Area": "Area" + (i), "Cnt": "26.33333" });
    }
    for (var i = 1; i <= 1; i++) {
        var formatting = JSON.stringify({ "City": {}, "State": {} });
        tableData.push({ "pk_ID": i, "granularity": null, "formatting": formatting, "rowID": i, "createdDate": 1413279409, "modifiedDate": 1413794179, "createdBy": 1, "modifiedBy": 1, "createdIP": "127.0.0.1", "modifiedIP": "127.0.0.1", "City": "USA", "State": "NJ", "Area": "Area" + (i), "Cnt": "26.33333" });
    }
    for (var i = 1; i <= 1; i++) {
        var formatting = JSON.stringify({ "City": {}, "State": {} });
        tableData.push({ "pk_ID": i, "granularity": null, "formatting": formatting, "rowID": i, "createdDate": 1413279409, "modifiedDate": 1413794179, "createdBy": 1, "modifiedBy": 1, "createdIP": "127.0.0.1", "modifiedIP": "127.0.0.1", "City": "Srilanka", "State": "CB", "Area": "Area" + (i), "Cnt": "26.33333" });
    }

    var data = {};
    data.content = {};
    data.status = true;
    data.content.fieldData = fieldData;
    data.content.tableData = tableData;
    loadTable(data);
}

function loadTable(data) {
    if (data.status == true) {
        var colArr = data.content.fieldData; //column info

        //column level config
        colArr[0].colWidth = 120;
        colArr[0].summary = {
            aggregation: {
                sum: { display: true, summaryTitle: 'Total', style: { bgColor: '#F0FFF0', foreColor: '#000', fontWeight: 'bold'} },
                min: { display: false, summaryTitle: 'Min', style: { bgColor: '#F0FFF0', foreColor: '#000', fontWeight: 'bold'} },
                max: { display: false, summaryTitle: 'Max', style: { bgColor: '#F0FFF0', foreColor: '#000', fontWeight: 'bold'} },
                avg: { display: false, summaryTitle: 'Avg', style: { bgColor: '#F0FFF0', foreColor: '#000', fontWeight: 'bold'} },
                count: { display: false, summaryTitle: '#', style: { bgColor: '#F0FFF0', foreColor: '#000', fontWeight: 'bold'} }
            }
        };

        colArr[1].colWidth = 120;
        colArr[1].summary = {
            aggregation: {
                sum: { display: true, summaryTitle: 'Total', style: { bgColor: '#FDF5E6', foreColor: '#000', fontWeight: 'bold'} },
                min: { display: false, summaryTitle: 'Min', style: { bgColor: '#FDF5E6', foreColor: '#000', fontWeight: 'bold'} },
                max: { display: false, summaryTitle: 'Max', style: { bgColor: '#FDF5E6', foreColor: '#000', fontWeight: 'bold'} },
                avg: { display: true, summaryTitle: 'Avg', style: { bgColor: '#FDF5E6', foreColor: '#000', fontWeight: 'bold'} },
                count: { display: false, summaryTitle: '#', style: { bgColor: '#FDF5E6', foreColor: '#000', fontWeight: 'bold'} }
            }
        };

        colArr[2].colWidth = 120;
        colArr[3].colWidth = 220;

        //dimenstions and measures
        var dimensions = [colArr[0], colArr[1], colArr[2]];
        var measures = [colArr[3]];

        //table level config
        var grandTotal = {
            position: 'top',
            aggregation: {
                sum: { display: true, summaryTitle: 'Grand Total', style: { bgColor: '#FFDEAD', foreColor: '#000', fontWeight: 'bold'} },
                min: { display: false, summaryTitle: 'Min', style: { bgColor: '#FFDEAD', foreColor: '#000', fontWeight: 'bold'} },
                max: { display: true, summaryTitle: 'Max', style: { bgColor: '#FFDEAD', foreColor: '#000', fontWeight: 'bold'} },
                avg: { display: false, summaryTitle: 'Avg', style: { bgColor: '#FFDEAD', foreColor: '#000', fontWeight: 'bold'} },
                count: { display: false, summaryTitle: '#', style: { bgColor: '#FFDEAD', foreColor: '#000', fontWeight: 'bold'} }
            }
        };
        prepareData({ collapsible: true, showSummary: $('#chkShowSummary').is(":checked"), repeatContent: $('#chkRepeatContent').is(":checked"), grandTotal: grandTotal, dimensions: dimensions, measures: measures, data: data.content.tableData, cb: bindGrid });
    }
}

function prepareData(options) {
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
            }
            else {
                if (collapsedInfo[r] != undefined) {
                    latestCollapsedInfo = collapsedInfo[r];
                    var added = false;
                    for (var c = 0; c < dimensions.length - 1; c++) {
                        if (collapsedInfo[r][colData[c].name] != undefined) {
                            icons.push({ id: rowIndex + '_' + c, row: (rowIndex + 1), col: (c + 1), data: { r: r, c: c} });
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
                }
                else {
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
            var info = { height: 24 };
            for (var col = 0; col < colInfo.length; col++) {
                info[colInfo[col].name] = {};
                info[colInfo[col].name].value = "     " + rowData[row][colInfo[col].name].toString();
                info[colInfo[col].name].formatting = {};
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

function bindGrid(colInfo, rowInfo, icons, collapsedInfo, processData) {
    if ($('#myDiv').data('objCanvasGrid') == undefined) {
        $('#myDiv').data('objCanvasGrid', null);
        myGrid = $('#myDiv').CanvasGrid({ colInfo: [].concat(colInfo), data: rowInfo, readOnly: true });
        myGrid.addCellSelector($('#myDiv'), "Green", 1, 1, 1, 1, "MyGrid");
    }
    else {
        myGrid.updateData($('#myDiv'), rowInfo);
    }
    for (var i = 0; i < icons.length; i++) {
        addIcon(icons[i].id, icons[i].row, icons[i].col, icons[i].data, colInfo, collapsedInfo, processData);
    }
}

function addIcon(id, row, col, data, colInfo, collapsedInfo, processData) {
    var icon = $('<img>');
    if (collapsedInfo[data.r][colInfo[data.c].name].isCollapsed == true) {
        icon.attr("src", "expand.png")
    }
    else {
        icon.attr("src", "collapse.png")
    }
    icon.css("margin-top", "2px");
    icon.attr("id", id);
    icon.data('data', data);
    icon.on('click', function (e) {
        collapsedInfo[data.r][colInfo[data.c].name].isCollapsed = !collapsedInfo[data.r][colInfo[data.c].name].isCollapsed;
        icons = [];
        processData();
    });
    myGrid.setItem($('#myDiv'), id, icon, row, col);
}