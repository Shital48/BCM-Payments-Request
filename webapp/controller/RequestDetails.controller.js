sap.ui.define([
    "refunddetails/model/models",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator"

], (models, Controller,Fragment, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("refunddetails.controller.RequestDetails", {
        onInit() {
            var oModel1 = this.getOwnerComponent().getModel();
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
            var oView = this.getView();

            if (selectedKey === "OPTION_VENDER") {
                oView.byId("vendorsSection").setVisible(true);
                oView.byId("customersSection").setVisible(false);
                // this.onClearPress();
            } else if (selectedKey === "OPTION_CUSTOMER") {
                oView.byId("customersSection").setVisible(true);
                oView.byId("vendorsSection").setVisible(false);
                // this.onClearPress();
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
            const oTable = oSmartTable.getTable(); // ResponsiveTable
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
            const oContext = oEvent.getSource().getBindingContext();
            var oData = oContext.getObject();
            var sLifnr = oData.Lifnr;
    var oDateAson = oData.DateAson;
    // var sDateAson = new Date(oDateAson).toISOString().split(".")[0];
    var sDateAson ="2025-04-10T14:49:52"
    var oModel = this.getOwnerComponent().getModel();

    if (!this._oInvoiceDialog) {
        this.loadFragment({
            name: "refunddetails.view.InvoiceDetail"
        }).then(function (oDialog) {
            this._oInvoiceDialog = oDialog;
            this.getView().addDependent(oDialog);
            this._loadInvoiceData(sLifnr, sDateAson);
            oDialog.open();
        }.bind(this));
    } else {
        this._loadInvoiceData(sLifnr, sDateAson);
        this._oInvoiceDialog.open();
    } 
        },
        _loadInvoiceData: function (sLifnr, sDateAson) {
            const oModel = this.getOwnerComponent().getModel();
        
            oModel.read("/VendorInvSet", {
                urlParameters: {
                    "$expand": "VenDet",
                    "$filter": "Lifnr eq '" + sLifnr + "' and DateAson eq datetime'" + sDateAson + "'"
                },
                success: function (oData) {
                    const oJSONModel = new sap.ui.model.json.JSONModel(oData.results[0].VenDet);
                    this._oInvoiceDialog.setModel(oJSONModel, "filtered");
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching filtered data", oError);
                }
            });
        }
        ,
        onCloseInvoiceDialog: function () {
            this._oInvoiceDialog.close();
        }
        
        
        
        




        // , 

        // onClearPress: function () {
        //     const oView = this.getView();

        //     oView.byId("businessSegment").setValue("");
        //     oView.byId("companyCodeFrom").setValue("");
        //     oView.byId("companyCodeTo").setValue("");
        //     oView.byId("projectFrom").setValue("");
        //     oView.byId("projectTo").setValue("");
        //     oView.byId("vendorFrom").setValue("");
        //     oView.byId("vendorTo").setValue("");
        //     oView.byId("customerFrom").setValue("");
        //     oView.byId("customerTo").setValue("");

        //     oView.byId("asOnDate").setDateValue(null);

        //     const oTable = oView.byId("vendorsSection");
        //     const oBinding = oTable.getBinding("items");
        //     if (oBinding) {
        //         oBinding.filter([]);
        //     }
        // }




    });
});