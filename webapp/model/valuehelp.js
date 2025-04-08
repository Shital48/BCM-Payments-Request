sap.ui.define([
    "sap/m/Dialog",
    "sap/m/SearchField",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
],
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     *
     *  {typeof sap.ui.model.json.JSONModel} JSONModel
     *  {typeof sap.ui.Device} Device
     *
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (Dialog, SearchField, List, StandardListItem, Button, VBox, Filter, FilterOperator, JSONModel) {
        "use strict";

        return {

            openValueHelp: function (oController, oInput, aData, sTitle, sKeyField) {
                const oView = oController.getView();
                var oSelectedValue = "";
                oController._currentInput = oInput;

                if (!oController._oGenericVHDialog) {
                    const oList = new List({
                        id: oView.createId("vhList"),
                        mode: "SingleSelectMaster",
                        selectionChange: function (oEvent) {
                            const oSelectedItem = oEvent.getParameter("listItem");
                            const sSelectedValue = oSelectedItem.getBindingContext().getProperty("value");
                    
                            if (sSelectedValue) {
                                oController._currentInput.setValue(sSelectedValue);
                            }
                    
                            oController._oGenericVHDialog.close();
                        }
                    });

                    const oSearchField = new SearchField(oView.createId("vhSearch"), {
                        liveChange: function (oEvent) {
                            const sQuery = oEvent.getParameter("newValue");
                            const oBinding = oList.getBinding("items");
                            if (oBinding) {
                                const aFilter = sQuery
                                    ? [new Filter(sKeyField, FilterOperator.Contains, sQuery)]
                                    : [];
                                oBinding.filter(aFilter);
                            }
                        }
                    });

                    const oDialog = new Dialog({
                        title: sTitle || "Select Value",
                        contentWidth: "30%",
                        stretchOnPhone: true,
                        content: new VBox({
                            items: [oSearchField, oList]
                        }),
 
                        endButton: new Button({
                            text: "Close",
                            press: function () {
                                oDialog.close();
                            }
                        })
                    });

                    oController._oGenericVHDialog = oDialog;
                    oView.addDependent(oDialog);
                }
                const oModel = new sap.ui.model.json.JSONModel(aData.map(val => ({ value: val })));
                const oList = oView.byId("vhList");
                oList.setModel(oModel);
                oList.bindItems({
                    path: "/",
                    template: new StandardListItem({
                        title: "{value}"
                    })
                });

                const oSearch = oView.byId("vhSearch");
                if (oSearch) oSearch.setValue("");

                oController._oGenericVHDialog.setTitle(sTitle || "Select Value");
                oController._oGenericVHDialog.open();
            }
        };
    });