sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "refunddetails/model/valuehelp",

], (Controller, JSONModel, Filter, FilterOperator, valuehelp) => {
    "use strict";

    return Controller.extend("refunddetails.controller.RequestDetails", {
        onInit() {
        },
        onBeforeRendering: function () {
            const oModel = new JSONModel({
                vendors: [
                    {
                        "vendorName": "10000007 - JSW Steel Ltd",
                        "totalAmount": 100000,
                        "msme": "Yes",
                        "approvalAmount": 80000,
                        "paymentMethod": "Partial",
                        "invoiceAmount": 50000,
                        "advanceRequestAmount": 10000,
                        "retentionAmount": 40000
                    },
                    {
                        "vendorName": "10000008 - Pena Cement India",
                        "totalAmount": 150000,
                        "msme": "No",
                        "approvalAmount": 150000,
                        "paymentMethod": "Full",
                        "invoiceAmount": 100000,
                        "advanceRequestAmount": 20000,
                        "retentionAmount": 30000
                    },
                    {
                        "vendorName": "10000009 - LTT Cement India",
                        "totalAmount": 175000,
                        "msme": "Yes",
                        "approvalAmount": 0,
                        "paymentMethod": "Select",
                        "invoiceAmount": 90000,
                        "advanceRequestAmount": 10000,
                        "retentionAmount": 75000
                    }
                ],
                customerData: [
                    {
                        "customerNo": "10000007",
                        "name": "ABCF",
                        "project": "PEPL wilow",
                        "unitNo": "A-104",
                        "docNo": "104",
                        "date": "01.01.2025",
                        "totalAmount": "100000",
                        "fullPayment": true,
                        "payable": "100000"
                    },
                    {
                        "customerNo": "10000008",
                        "name": "XYZ",
                        "project": "apple",
                        "unitNo": "B-103",
                        "docNo": "103",
                        "date": "01.03.2025",
                        "totalAmount": "150000",
                        "fullPayment": false,
                        "payable": "25000"
                    },
                    {
                        "customerNo": "10000009",
                        "name": "HIJ",
                        "project": "FOBF",
                        "unitNo": "A-205",
                        "docNo": "205",
                        "date": "01.02.2025",
                        "totalAmount": "150000",
                        "fullPayment": false,
                        "payable": "0"
                    }
                ]
            });
            this.getView().setModel(oModel);
        },
        onSelectionChange: function (oEvent) {
            var selectedKey = oEvent.getSource().getSelectedKey();
            var oView = this.getView(); 

            if (selectedKey === "OPTION1") {
                oView.byId("vendorsSection").setVisible(true);
                oView.byId("customersSection").setVisible(false);
            } else if (selectedKey === "OPTION2") {
                oView.byId("customersSection").setVisible(true); 
                oView.byId("vendorsSection").setVisible(false);
            }
        },
        onGoPress: function (oEvent) {
            const oView = this.getView();
            const sBusinessSegment = oView.byId("businessSegment").getValue();
            const sCompanyCodeFrom = oView.byId("companyCodeFrom").getValue();
            const sCompanyCodeTo = oView.byId("companyCodeTo").getValue();
            const sProjectFrom = oView.byId("projectFrom").getValue();
            const sProjectTo = oView.byId("projectTo").getValue();
            const sVendorFrom = oView.byId("vendorFrom").getValue();
            const sVendorTo = oView.byId("vendorTo").getValue();
            const sAsOnDate = oView.byId("asOnDate").getDateValue();

            const aFilters = [];

            if (sBusinessSegment) {
                aFilters.push(new Filter("BusinessSegment", FilterOperator.EQ, sBusinessSegment));
            }

            if (sCompanyCodeFrom && sCompanyCodeTo) {
                aFilters.push(new Filter("CompanyCode", FilterOperator.BT, sCompanyCodeFrom, sCompanyCodeTo));
            }

            if (sProjectFrom && sProjectTo) {
                aFilters.push(new Filter("Project", FilterOperator.BT, sProjectFrom, sProjectTo));
            }

            if (sVendorFrom && sVendorTo) {
                aFilters.push(new Filter("Vendor", FilterOperator.BT, sVendorFrom, sVendorTo));
            }

            if (sAsOnDate) {
                aFilters.push(new Filter("AsOnDate", FilterOperator.EQ, sAsOnDate));
            }

            const oTable = this.byId("vendorsTable");
            const oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        onBusinessSegmentHelp: function (oEvent) {
            const aData = ["BS01", "BS02", "BS03"];
            const oInput = oEvent.getSource();
            valuehelp.openValueHelp(this, oInput, aData, "Select Business Segment", "value");
        },

        onCompanyCodeHelp: function (oEvent) {
            const aData = [
                "1000", "2000", "3000", "4000"
            ];
            const oInput = oEvent.getSource();
            valuehelp.openValueHelp(this, oInput, aData, "Select Company Code", "value");
        },

        onProjectHelp: function (oEvent) {
            const aData = ["Migration", "Upgrade"
            ];
            const oInput = oEvent.getSource();
            valuehelp.openValueHelp(this, oInput, aData, "Select Project", "value");
        },

        onVendorHelp: function (oEvent) {
            const aData = ["Vendor A", "Vendor B"
            ];
            const oInput = oEvent.getSource();
            valuehelp.openValueHelp(this, oInput, aData, "Select Vendor", "value");

        },
        onClearPress: function () {
            const oView = this.getView();

            oView.byId("businessSegment").setValue("");
            oView.byId("companyCodeFrom").setValue("");
            oView.byId("companyCodeTo").setValue("");
            oView.byId("projectFrom").setValue("");
            oView.byId("projectTo").setValue("");
            oView.byId("vendorFrom").setValue("");
            oView.byId("vendorTo").setValue("");

            oView.byId("asOnDate").setDateValue(null);

            const oTable = oView.byId("vendorsTable");
            const oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter([]);
            }
        }




    });
});