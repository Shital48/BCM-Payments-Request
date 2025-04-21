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

        //Header 

        onSelectionChange: function (oEvent) {
            var selectedKey = oEvent.getSource().getSelectedKey();
            this._selectedPayMethodText = oEvent.getSource().getSelectedItem().getText();

            var oView = this.getView();

            if (selectedKey === "OPTION_VENDER") {
                this.mdl_zFilter.setProperty("/Create/SelectedKey", "Vendor");
                oView.byId("vendorsSection").setVisible(true);
                oView.byId("customersSection").setVisible(false);
            } else if (selectedKey === "OPTION_CUSTOMER") {
                this.mdl_zFilter.setProperty("/Create/SelectedKey", "Customer");
                oView.byId("customersSection").setVisible(true);
                oView.byId("vendorsSection").setVisible(false);
            }
        },
        formatDate: function (sDate) {
            if (!sDate) {
                return "";
            }
            var oDate = new Date(sDate);
            return DateFormat.getDateTimeInstance({ pattern: "dd/MM/yyyy" }).format(oDate);
        },
        onCheckboxSelect1: function (oEvent) {
            const bSelected = oEvent.getParameter("selected");
            const oCheckBox = oEvent.getSource();
            const oRow = oCheckBox.getParent();
            const oContext = oRow.getBindingContext();
            const aCells = oRow.getCells();
            const oInput = aCells.find(cell => cell.isA("sap.m.Input"));
            const sTotalAmt = oContext.getProperty("TotalAmt");


            if (bSelected) {
                oInput.setValue(sTotalAmt);
                oInput.setEditable(false);
            } else {
                oInput.setEditable(true);
            }

        },
        formatter: {
            getDefaultQty: function () {
                return "";
            }
        },
        onQtyLiveChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();
            var oContext = oInput.getBindingContext();
            if (!oContext) {
                console.warn("No binding context for input field.");
                return;
            }
            var oRow = oInput.getParent();
            var oCheckBox = oRow.getCells().find(cell => cell.isA("sap.m.CheckBox"));
            var iValue = parseInt(sValue, 10);
            var TotalAmount = parseInt(oContext.getProperty("TotalAmt"), 10) || 0;
            if (!/^\d+$/.test(sValue)) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Maintain a valid Payment");
                oCheckBox.setSelected(false);
                return;
            }
            if (isNaN(iValue) || sValue < 1) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Add valid value");
                oCheckBox.setSelected(false);
            } else if (iValue > TotalAmount) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Payable amount exceeds Total Amount");
                oCheckBox.setSelected(false);
            }
            else {
                oInput.setValueState("None");
                if (iValue === TotalAmount) {
                    oCheckBox.setSelected(true);
                    oInput.setEditable(false);
                } else {
                    oCheckBox.setSelected(false);
                    oInput.setEditable(true);
                }
            }

        },



        //VENDOR

        onBeforeRebindTable: function (oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");
            oBindingParams.parameters = oBindingParams.parameters || {};
            oBindingParams.parameters.expand = "VenDet";
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
            const oVendorData = this.mdl_zFilter.getProperty("/VendorData") || {};
            if (!oVendorData[sLifnr]) {
                oVendorData[sLifnr] = {
                    PayMethodSelectedKey: "OPTION_Select"
                };
                this.mdl_zFilter.setProperty("/VendorData", oVendorData);
            }
            const oDialogStateModel = new JSONModel(Object.assign({}, oVendorData[sLifnr]));

            this._dialogMap = this._dialogMap || {};
            if (this._dialogMap[sLifnr]) {
                const oExistingDialog = this._dialogMap[sLifnr];
                oExistingDialog.setModel(oDialogStateModel, "dialogState");
                this._loadInvoiceData(sLifnr, sDateAson, oExistingDialog, oVendorData);
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
                    this._loadInvoiceData(sLifnr, sDateAson, oDialog, oVendorData);
                    oDialog.open();
                }.bind(this));
            }
        },
        _loadInvoiceData: function (sLifnr, sDateAson, oDialog, oVendorData) {
            const oModel = this.getOwnerComponent().getModel();
            oDialog.setBusy(true);

            if (oVendorData[sLifnr] && oVendorData[sLifnr].Invoices) {
                const oJSONModel = new JSONModel({ results: oVendorData[sLifnr].Invoices });
                oDialog.setModel(oJSONModel, "filtered");
                oDialog.setBusy(false);
            } else {
                oModel.read("/VendorInvSet", {
                    urlParameters: {
                        "$expand": "VenDet",
                        "$filter": "Lifnr eq '" + sLifnr + "' and DateAson eq datetime'" + sDateAson + "'"
                    },
                    success: function (oData) {
                        oDialog.setBusy(false);
                        if (oData && oData.results && oData.results.length > 0) {
                            var aVenDetResults = oData.results[0].VenDet?.results;
                            if (aVenDetResults?.length > 0) {
                                const oJSONModel = new JSONModel({ results: aVenDetResults });
                                oDialog.setModel(oJSONModel, "filtered");
                                if (!oVendorData[sLifnr]) {
                                    oVendorData[sLifnr] = {};
                                }

                                oVendorData[sLifnr].Invoices = aVenDetResults;
                                this.mdl_zFilter.setProperty("/VendorData", oVendorData);
                            }
                        }
                    }.bind(this),
                    error: function (oError) {
                        oDialog.setBusy(false);
                        console.error("Error fetching filtered data", oError);
                    }
                });
            }
        },

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
            const oVendorData = this.mdl_zFilter.getProperty("/VendorData");

            oVendorData[sLifnr] = oDialogState;
            const updatedInvoices = oDialog.getModel("filtered").getProperty("/results");
            if (updatedInvoices) {
                oVendorData[sLifnr].Invoices = updatedInvoices;
            }
            this.mdl_zFilter.setProperty("/VendorData", oVendorData);

            const sNewText = oDialogState.PayMethodSelectedKey ? this._selectedPayMethodText : "";
            if (this._oButton) {
                this._oButton.setText(sNewText);
            }
            oDialog.close();
        },

        //FOOTER

        onSubmitPress: function () {
            var othis = this;
            const oModel = this.getView().getModel();
            const oView = this.getView();

            const sSelectedKey = this.mdl_zFilter.getProperty("/Create/SelectedKey");
            oView.setBusy(true);

            const formatToODataDate = function (dateString) {
                const oDate = new Date(dateString);
                return `/Date(${oDate.getTime()})/`;
            };

            if (sSelectedKey === "Customer") {

                const oTable = oView.byId("customerTable");
                const aSelectedItems = oTable.getSelectedItems();

                if (!aSelectedItems.length) {
                    sap.m.MessageToast.show("Please select at least one customer record.");
                    oView.setBusy(false);
                    return;
                }
                const aCustReq = [];

                aSelectedItems.forEach(function (oItem) {
                    const oData = oItem.getBindingContext().getObject();
                    const aCells = oItem.getCells();
                    const sApprovalAmt = aCells[8].getValue();
                    aCustReq.push({
                        "RequestNo": "",
                        "DateAson": formatToODataDate(oData.DateAson || new Date()),
                        "Kunnr": oData.Kunnr,
                        "Pspid": oData.Pspid || "",
                        "Name1": oData.Name1,
                        "Paval": oData.Paval || "",
                        "Project": oData.Project || "",
                        "ProjectName": oData.ProjectName || "",
                        "UnitNo": oData.UnitNo || "",
                        "Docnr": oData.Docnr,
                        "Gjahr": oData.Gjahr,
                        "Bukrs": oData.Bukrs,
                        "Budat": formatToODataDate(oData.Budat),
                        "TotalAmt": oData.TotalAmt,
                        "PayMethod": oData.PayMethod || "",
                        "ApprovalAmt": sApprovalAmt,
                        "Bankl": oData.Bankl || ""
                    });
                });
                console.log("acustrequest" , aCustReq)

                const oPayload = {
                    RequestNo: "",
                    CustReq: aCustReq
                };


                oModel.create("/CustomerReqSet", oPayload, {
                    success: function () {
                        oView.setBusy(false);
                        console.log("Customer submission successful!");
                    },
                    error: function (oError) {
                        oView.setBusy(false);
                        console.error("Customer POST failed", oError);
                    }
                });

            }
            else if (sSelectedKey === "Vendor") {
                const oVendorTable = oView.byId("vendorTable"); 
                const aSelectedVendors = oVendorTable.getSelectedItems();

                if (!aSelectedVendors.length) {
                    sap.m.MessageToast.show("Please select at least one Vendor record.");
                    oView.setBusy(false);
                    return;
                }
                const aVenReq = [];
                const oVendorData = this.mdl_zFilter.getProperty("/Create/VendorData");

                aSelectedVendors.forEach(function (oItem) { 
                    const oData = oItem.getBindingContext().getObject(); 
                    console.log("Full data from EntitySet:", oData);

                        const sLifnr = oData.Lifnr;
                        const sPayMethod = oData.PayMethod;

                        var aInvoices = this.mdl_zFilter.getData().oVendorData[sLifnr].Invoices;
                        aVenReq.push({
                            "Lifnr": aInvoices.sLifnr,
                            "Category":aInvoices.Category,
                            "Docnr": aInvoices.Docnr,
                            "Bukrs": aInvoices.Bukrs,
                            "Gjahr": aInvoices.Gjahr,
                            "Budat":  aInvoices.Budat,
                            "DocAmt": aInvoices.DocAmt,
                            "PayMethod": sPayMethod,
                            "ApprovalAmt": aInvoices.ApprovalAmt,
                            "Project": aInvoices.Project || "",
                            "ProjectName": aInvoices.ProjectName || "",
                            "RequestNo": ""
                        });
                    
                });
                console.log("avenrequest" , aVenReq)

                if (aVenReq.length === 0) {
                    console.log("Please select at least one vendor record.");
                    return;
                }

                const oPayload = {
                    RequestNo: "",
                    VenReq: aVenReq
                }; 

                oModel.create("/VendorReqSet", oPayload, {
                    success: function () {
                        oView.setBusy(false);
                        // sap.m.MessageToast.show("Vendor invoice request submitted successfully.");
                        console.log("Vendor POST successful");
                    },
                    error: function (oError) {
                        oView.setBusy(false);
                        console.error("Vendor POST failed", oError);
                    }
                });
            }
        }
 
    });
});