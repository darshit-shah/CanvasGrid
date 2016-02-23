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
        axiomPivotHelper.prepareData({ collapsible: true, showSummary: $('#chkShowSummary').is(":checked"), repeatContent: $('#chkRepeatContent').is(":checked"), grandTotal: grandTotal, dimensions: dimensions, measures: measures, data: data.content.tableData, cb: bindGrid });
    }
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
