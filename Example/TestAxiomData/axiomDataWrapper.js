$(document).ready(function () {
    axiomDataWrapper.onLoad();
});
axiomDataWrapper = {
    userID: 0,
    onLoad: function () {
        AxiomAPIs.onInitialized(function () {
            axiomDataWrapper.bindProjects();
        }); //"axiomPrivateAPI"
    },

    bindProjects: function () {
        $("#drpFromProject").empty();
        $("#drpFromProject").append("<option value=0>---Select from project---</option>");
        AxiomAPIs.project({ action: 'list' }, function (jsonData) {
            if (jsonData.status == true) {
                for (var i = 0; i < jsonData.content.projectList.length; i++) {
                    $("#drpFromProject").append('<option value=' + jsonData.content.projectList[i].id + '>' + axiomDataWrapper.replaceTag(jsonData.content.projectList[i].name) + '</option>');
                }
            }
        });
        $("#drpFromProject").change(axiomDataWrapper.bindTables);
        $('#btnGetData').click(axiomDataWrapper.fetchData);
    },

    bindTables: function () {
        if ($("#drpFromProject").val() > 0) {
            $("#drpTable").empty();
            $("#drpTable").append("<option value=0>---Select View---</option>");
            AxiomAPIs.table({
                "action": "list",
                "projectID": $("#drpFromProject").val()
            }, function (jsonData) {
                if (jsonData.status == true) {
                    for (var i = 0; i < jsonData.content.tableList.length; i++)
                        $("#drpTable").append('<option value=' + jsonData.content.tableList[i].viewID + '>' + axiomDataWrapper.replaceTag(jsonData.content.tableList[i].name) + '</option>');
                }
            });
        }
    },

    fetchData: function () {
        if ($("#drpFromProject").val() != 0) {
            if ($("#drpTable").val() != 0) {
                $('#btnGetData').remove();
                AxiomAPIs.table({
                    "action": "tableData",
                    "viewID": $("#drpTable").val(),
                    "filterCondition": "1=1",
                    "needExtraField": true
                }, function (resultData) {
                    if (resultData.status == true) {
                        var colInfo = [];
                        for (var i = 0; i < resultData.content.fieldData.length; i++) {
                            var info = {};
                            info.name = resultData.content.fieldData[i].fieldRefNumber;
                            info.width = resultData.content.fieldData[i].colWidth;
                            colInfo.push(info);
                            info = null;
                        }
                        var data = [];
                        for (var i = 0; i < resultData.content.tableData.length; i++) {
                            var rowInfo = { height: 20 };
                            for (var col = 0; col < colInfo.length; col++) {
                                rowInfo[colInfo[col].name] = {};
                                rowInfo[colInfo[col].name].value = resultData.content.tableData[i][colInfo[col].name];
                            }
                            data.push(rowInfo);
                            rowInfo = null;
                        }
                        $('#resizableDiv').resizable({ helper: "ui-resizable-helper" });
                        $('#resizableDiv').on('resizestop', function (evt, ui) {
                            $('#myDiv').trigger('resize', [ui.size.width, ui.size.height]);
                        });
                        $('#myDiv').show();
                        myGrid = $('#myDiv').CanvasGrid({ colInfo: colInfo, data: data, readOnly: true });
                        myGrid.addCellSelector($('#myDiv'), "Green", 1, 1, 1, 1, "MyGrid")
                        $('#myDiv').trigger('resize', [$(window).width() - 20, $(window).height() - 75]);
                    }
                    else {
                        alert(resultData.content.message);
                    }
                })
            }
            else {
                alert("Please select view");
            }
        }
        else {
            alert("Please select project");
        }
    },

    replaceTag: function (str) {
        str = str ? str : '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

}