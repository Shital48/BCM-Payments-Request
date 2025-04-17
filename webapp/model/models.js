sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        createLocalJson: function () {
            var oCreateData = this.getRequestBlank();
            var oModel = new JSONModel({
                "Create": oCreateData
            });
            return oModel;
        },

        getRequestBlank: function () {
            return { 
                "VendorData":{}, 
                "PaymentMethod":"" 
                 
            }
        }
    };

});