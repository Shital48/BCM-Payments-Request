sap.ui.define([
    "sap/ui/core/UIComponent",
    "refunddetails/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("refunddetails.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            // Local JSON Model
            this.setModel(models.createLocalJson(), "zRequestModel");
           // UIComponent.prototype.init.apply(this, arguments);

            // var oModel = this.getModel();
            // sap.ui.core.BusyIndicator.show(0);
            // oModel.metadataLoaded().then(function () {
            //     sap.ui.core.BusyIndicator.hide();
            // });


        }


    });
});