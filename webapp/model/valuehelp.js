sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/ui/mdc/FilterField",
    "sap/ui/model/FilterOperator",
    "sap/base/util/uid",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog"
],
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     *
     *  {typeof sap.ui.model.json.JSONModel} JSONModel
     *  {typeof sap.ui.Device} Device
     *
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (JSONModel, Device,
        FilterBar, FilterGroupItem,
        FilterField, FilterOperator,
        uid, ValueHelpDialog) {
        "use strict";

        ValueHelpDialog.prototype.cgAddFilters = function (filters) {
            for (let filter of filters) {
                let path = filter.path;
                const filterField = this.dialogMetadata.columns[path].filterField;
                filterField.setConditions([filter]);
                this.dialogMetadata.columns[path].filterValues.push(filter);
                this.getFilterBar().fireSearch();
            }
        }

        return {
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },

            createValueHelp: async function (config) {
                const groupName = uid();
                const filterGroupItems = [];
                const dialogMetadata = {
                    columnDefinition: config.columns,
                    columns: {},
                    filterId2ColId: {}
                }
                for (let colDef of config.columns) {
                    const searchFieldId = groupName + colDef.path;
                    dialogMetadata.columns[colDef.path] = {
                        searchFieldId: searchFieldId,
                        filterValues: [],
                    };
                    dialogMetadata.filterId2ColId[searchFieldId] = colDef.path;
                    const oFilterField = new FilterField({
                        id: searchFieldId,
                        defaultOperator: sap.ui.model.FilterOperator.EQ,
                        maxConditions: 1,
                        change: function (oEvent) {
                            const filterID = oEvent.getSource().getId();
                            const colId = dialogMetadata.filterId2ColId[filterID];
                            dialogMetadata.columns[colId].filterValues = oEvent.getParameter("conditions");
                            console.log(dialogMetadata);
                        }
                    });
                    filterGroupItems.push(new FilterGroupItem({
                        groupName: sap.ui.comp.filterbar.FilterBar.INTERNAL_GROUP,
                        name: colDef.path,
                        label: colDef.label,
                        visible: colDef.filterable,
                        control: oFilterField
                    }));
                    dialogMetadata.columns[colDef.path].filterField = oFilterField;
                }
                var oSearchField = new sap.m.SearchField({
                    showSearchButton: sap.ui.Device.system.phone,
                    placeholder: 'search',
                    showRefreshButton: true,
                    search: function (event) {
                        var value = event.getSource().getValue();
                        var oBinding = dialog.getTable().getBinding();
                        oBinding.sCustomParams = "search=" + value;
                        oBinding.refresh(true);
                    },
                });

                let dialog = new ValueHelpDialog({
                    draggable: false,
                    title: config.title,
                    supportMultiselect: config.multiSelect,
                    supportRanges: false,
                    key: config.keyField, // Specify the key field
                    descriptionKey: config.keyDescField, // Specify the description field
                    filterBar: new FilterBar({
                        isRunningInValueHelpDialog: false,
                        advancedMode: true,
                        filterBarExpanded: true,
                        filterGroupItems: filterGroupItems,
                        basicSearch: oSearchField,
                        filterChange: function (oEvent) {
                            var value = oEvent.mParameters.mParameters.newValue;
                            var oBinding = dialog.getTable().getBinding();
                            oBinding.sCustomParams = "search=" + value;
                            oBinding.refresh(true);
                        },
                        search: function (oEvent) {
                            var sValue = oEvent.getSource().getBasicSearchValue();
                            if (sValue === "" || sValue === undefined || sValue === null) {
                                var oBinding = dialog.getTable().getBinding();
                                const filter = [];
                                oBinding.sCustomParams = "";
                                for (let columnId in dialogMetadata.columns) {
                                    let conditions = dialogMetadata.columns[columnId].filterValues;
                                    for (let cond of conditions) {
                                        if (!cond.isEmpty) {
                                            filter.push(new sap.ui.model.Filter(columnId,
                                                FilterOperator[cond.operator],
                                                cond.values));
                                        }
                                    }
                                }
                                if (filter.length > 0) {
                                    oBinding.filter(new sap.ui.model.Filter({
                                        filters: filter,
                                        and: true
                                    }));
                                } else {
                                    oBinding.filter()
                                }
                            } else {
                                var oBindingInfo = dialog.getTable().getBindingInfo('rows');
                                if (!oBindingInfo.parameters) {
                                    oBindingInfo.parameters = {};
                                }
                                if (!oBindingInfo.parameters.custom) {
                                    oBindingInfo.parameters.custom = {};
                                }
                                oBindingInfo.parameters.custom.search = sValue;
                                oBindingInfo.filters = dialog.getTable().getBinding('rows').aApplicationFilters;
                                dialog.getTable().bindRows(oBindingInfo);
                            }
                        }
                    }),
                    ok: function (oEvent) {
                        var token = oEvent.getParameter("tokens");
                        if (token.length > 0) {
                            if (config.multiSelect) {
                                var selectedRows = token.map(item => item.data().row)
                                dialog.close();
                                var oBinding = dialog.getTable().getBinding();
                                oBinding.sCustomParams = "";
                                oBinding.refresh(true);
                                if (config.ok) {
                                    config.ok(selectedRows);
                                }
                            } else {
                                token = token[0];
                                // Handle the selected value
                                var selectedRow = token.data().row;
                                dialog.close();
                                var oBinding = dialog.getTable().getBinding();
                                oBinding.sCustomParams = "";
                                oBinding.refresh(true);
                                if (config.ok) {
                                    config.ok(selectedRow);
                                }
                            }
                        }
                    },
                    cancel: function (oEvent) {
                        var oBinding = dialog.getTable().getBinding();
                        oBinding.sCustomParams = "";
                        oBinding.refresh(true);
                        dialog.close();
                    }.bind(this)
                });

                // Create a Table to display the data
                var oTable = await dialog.getTableAsync();

                oTable.setModel(config.model);
                if (oTable.bindRows) {
                    for (let colDef of config.columns) {
                        oTable.addColumn(new sap.ui.table.Column({ label: colDef.label, template: colDef.path }));
                    }
                    oTable.bindRows(config.basePath);
                    const oBinding = oTable.getBinding("rows");
                    if (oBinding && config.aBindingFilter) {
                        oBinding.filter(config.aBindingFilter, sap.ui.model.FilterType.Application);
                    }
                } else {
                    const cells = [];
                    for (let colDef of config.columns) {
                        oTable.addColumn(new sap.m.Column({ header: new sap.m.Label({ text: colDef.label }) }));
                        cells.push(new sap.m.Text({ text: `{${colDef.path}}` }));
                    }
                    oTable.bindItems(config.basePath, new sap.m.ColumnListItem({
                        cells: cells
                    }));
                }
                dialog.dialogMetadata = dialogMetadata;
                if (config.preFilters) {
                    dialog.cgAddFilters(config.preFilters);
                }
                dialog.update();
                // dialog.setTable(oTable);
                return dialog;
            }
        };
    });