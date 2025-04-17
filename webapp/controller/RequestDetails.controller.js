sap.ui.define([
    "refunddetails/model/models",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator"

], (models, Controller, JSONModel, DateFormat, Filter, Fragment, FilterOperator) => {
    "use strict";

    return Controller.extend("refunddetails.controller.RequestDetails", {
        onInit() {
            var oModel1 = this.getOwnerComponent().getModel();
            this._dialogMap = {};
            sap.ui.core.BusyIndicator.show(0);
            oModel1.metadataLoaded().then(function () {
                sap.ui.core.BusyIndicator.hide();
            });
        },


        onBeforeRendering: function () {
            this.mdl_zFilter = this.getOwnerComponent().getModel('zRequestModel');
        },
        onSelectionChange: function (oEvent) {
            var selectedKey = oEvent.getSource().getSelectedKey();
            this._selectedPayMethodText = oEvent.getSource().getSelectedItem().getText();

            var oView = this.getView();

            if (selectedKey === "OPTION_VENDER") {
                oView.byId("vendorsSection").setVisible(true);
                oView.byId("customersSection").setVisible(false); 
            } else if (selectedKey === "OPTION_CUSTOMER") {
                oView.byId("customersSection").setVisible(true);
                oView.byId("vendorsSection").setVisible(false); 
            }
        },
        onBeforeRebindTable: function (oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");
            oBindingParams.parameters = oBindingParams.parameters || {};
            oBindingParams.parameters.expand = "VenDet";
        },

        onPayMethodDialogClose: function () {
            this._oPayMethodDialog.close();
        },
        onSelectAllCheckbox: function (oEvent) {
            const bSelected = oEvent.getParameter("selected");
            const oSmartTable = this.byId("vendorTable");
            const oTable = oSmartTable.getTable();
            const aItems = oTable.getItems();

            aItems.forEach(function (oItem) {
                const oCtx = oItem.getBindingContext();
                if (oCtx) {
                    oCtx.getModel().setProperty(oCtx.getPath() + "/Selected", bSelected);
                }
            });
        },

        onCheckboxSelect: function () {
            const oSmartTable = this.byId("vendorTable");
            const oTable = oSmartTable.getTable();
            const aItems = oTable.getItems();

            const bAllSelected = aItems.every(item => item.getBindingContext().getProperty("Selected"));
            const oHeaderCheckBox = this.byId("selectAllCheckbox");

            oHeaderCheckBox.setSelected(bAllSelected);
        },
        onPayMethodPress: function (oEvent) {
            this._oButton = oEvent.getSource();
            const oContext = this._oButton.getBindingContext();
            if (!oContext) {
                console.log("No binding context found for this button.");
                return;
            }
            var oData = oContext.getObject();
            if (!oData || !oData.Lifnr || !oData.DateAson) {
                console.log("Missing Lifnr or DateAson in data.");
                return;
            }
            var sLifnr = oData.Lifnr;
            var oDateAson = oData.DateAson;
            var sDateAson = new Date(oDateAson).toISOString().split(".")[0];
            const oModel2 = this.getOwnerComponent().getModel("zRequestModel");
            const oVendorData = oModel2.getProperty("/VendorData") || {};
            if (!oVendorData[sLifnr]) {
                oVendorData[sLifnr] = {
                    PayMethodSelectedKey: "OPTION_Full"
                };
                oModel2.setProperty("/VendorData", oVendorData);
            }
            const oDialogStateModel = new JSONModel(oVendorData[sLifnr]);

            this._dialogMap = this._dialogMap || {};
            if (this._dialogMap[sLifnr]) {
                const oExistingDialog = this._dialogMap[sLifnr];
                oExistingDialog.setModel(oDialogStateModel, "dialogState");
                this._loadInvoiceData(sLifnr, sDateAson, oExistingDialog);
                oExistingDialog.open();
            }
            else {

                this.loadFragment({
                    name: "refunddetails.view.InvoiceDetail",
                    id: `invoiceDialog-${sLifnr}`
                }).then(function (oDialog) {
                    oDialog.setModel(oDialogStateModel, "dialogState");
                    this.getView().addDependent(oDialog);

                    this._dialogMap[sLifnr] = oDialog;

                    this._loadInvoiceData(sLifnr, sDateAson, oDialog);
                    oDialog.open();
                    oDialog.open();
                }.bind(this));
            }
        },
        _loadInvoiceData: function (sLifnr, sDateAson, oDialog) {
            const oModel = this.getOwnerComponent().getModel();
            oDialog.setBusy(true);
            oModel.read("/VendorInvSet", {
                urlParameters: {
                    "$expand": "VenDet",
                    "$filter": "Lifnr eq '" + sLifnr + "' and DateAson eq datetime'" + sDateAson + "'"
                },
                success: function (oData) {
                    oDialog.setBusy(false);
                    if (oData && oData.results && oData.results.length > 0) {
                        var oVenDetData = oData.results[0].VenDet;
                        console.log(oVenDetData);
                        if (oVenDetData && oVenDetData.results && oVenDetData.results.length > 0) {
                            var aVenDetResults = oVenDetData.results;
                            const oJSONModel = new sap.ui.model.json.JSONModel({ results: aVenDetResults });
                            oDialog.setModel(oJSONModel, "filtered");
                        }
                    }
                }.bind(this),
                error: function (oError) {
                    oDialog.setBusy(false);
                    console.error("Error fetching filtered data", oError);
                }
            });
        }
        ,
        onCloseInvoiceDialog: function (oEvent) {
            const oDialog = oEvent.getSource().getParent();
            if (oDialog) {
                oDialog.close();
                const oFilteredModel = oDialog.getModel("filtered");
                if (oFilteredModel) {
                    oFilteredModel.setData({ results: [] });
                }
            }
        },

        onConfirmDialog: function (oEvent) {
            const oDialog = oEvent.getSource().getParent();
            const oDialogState = oDialog.getModel("dialogState").getData();

            const sLifnr = this._oButton.getBindingContext().getProperty("Lifnr");
            const oModel = this.getOwnerComponent().getModel("zRequestModel");
            const oVendorData = oModel.getProperty("/VendorData");

            oVendorData[sLifnr] = oDialogState;
            oModel.setProperty("/VendorData", oVendorData);

            if (this._oButton && this._selectedPayMethodText) {
                this._oButton.setText(this._selectedPayMethodText);
            }

            oDialog.close();
        },
        formatDate: function (sDate) {
            if (!sDate) {
                return "";
            }
            var oDate = new Date(sDate);
            return DateFormat.getDateTimeInstance({ pattern: "dd/MM/yyyy" }).format(oDate);
        } 
    });
});