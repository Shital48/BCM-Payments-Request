sap.ui.define([ 
    "refunddetails/model/models",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"

], (  models,Controller,JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("refunddetails.controller.RequestDetails", {
        onInit() {
        }, 
        onBeforeRendering: function () { 
            this.mdl_zFilter = this.getOwnerComponent().getModel('zRequestModel'); 
        },
        onSelectionChange: function (oEvent) {
            var selectedKey = oEvent.getSource().getSelectedKey();
            var oView = this.getView(); 

            if (selectedKey === "OPTION1") {
                oView.byId("vendorsSection").setVisible(true);
                oView.byId("customersSection").setVisible(false);                
                // this.onClearPress();
            } else if (selectedKey === "OPTION2") {
                oView.byId("customersSection").setVisible(true);
                oView.byId("vendorsSection").setVisible(false);                
                // this.onClearPress();
            }
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