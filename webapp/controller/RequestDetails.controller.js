sap.ui.define([
    "refunddetails/model/models",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"

], (models, Controller, JSONModel, Filter, FilterOperator) => {
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
        onPayMethodPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oRowData = oContext.getObject();
            const sPayMethod = oRowData.PayMethod || "(Not Set)";

            this._selectedPayMethodContext = oContext;

            if (!this._oPayMethodDialog) {
                Fragment.load({
                    name: "your.namespace.view.fragments.PayMethodDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oPayMethodDialog = oDialog;
                    this.getView().addDependent(oDialog);

                    const oModel = new sap.ui.model.json.JSONModel({ payMethod: sPayMethod });
                    oDialog.setModel(oModel, "dialog");

                    oDialog.open();
                }.bind(this));
            } else {
                this._oPayMethodDialog.getModel("dialog").setData({ payMethod: sPayMethod });
                this._oPayMethodDialog.open();
            }
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