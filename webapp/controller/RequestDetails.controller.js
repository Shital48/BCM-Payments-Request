sap.ui.define([
    "refunddetails/model/models",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"

], (models, Controller, JSONModel, DateFormat, Filter, Fragment, FilterOperator, MessageToast, MessageBox) => {
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
        onAfterRendering: function () {
            var oSmartFilterBar = this.byId("vendorFilterBar");
            if (oSmartFilterBar) {
                oSmartFilterBar.attachInitialized(function () {
                    oSmartFilterBar.setFilterData({
                        DateAson: {
                            items: [],
                            ranges: [{
                                exclude: false,
                                operation: "LE",
                                keyField: "DateAson",
                                value1: new Date(),
                                value2: null
                            }]
                        }
                    }); 
                });

            }

            var oSmartFilterBar = this.byId("customerFilterBar");
            if (oSmartFilterBar) {
                oSmartFilterBar.attachInitialized(function () {
                    oSmartFilterBar.setFilterData({
                        DateAson: {
                            items: [],
                            ranges: [{
                                exclude: false,
                                operation: "LE",
                                keyField: "DateAson",
                                value1: new Date(),
                                value2: null
                            }]
                        }
                    }); 
                });

            }
        },


        //Header 

        onSelectionChange: function (oEvent) {
            var selectedKey = oEvent.getSource().getSelectedKey();
            this._selectedPayMethodText = oEvent.getSource().getSelectedItem().getText();

            var oView = this.getView();

            if (selectedKey === "OPTION_VENDER") {
                this.mdl_zFilter.setProperty("/VendorDetails/SelectedKey", "Vendors");
                oView.byId("vendorsSection").setVisible(true);
                oView.byId("customersSection").setVisible(false);
                this.clearAllFields();
            } else if (selectedKey === "OPTION_CUSTOMER") {
                this.mdl_zFilter.setProperty("/VendorDetails/SelectedKey", "Customers");
                oView.byId("customersSection").setVisible(true);
                oView.byId("vendorsSection").setVisible(false);
                this.clearAllFields();
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
            const oContext1 = oCheckBox.getBindingContext();
            const record = oContext1.getObject();
            const oRow = oCheckBox.getParent();
            const oContext = oRow.getBindingContext();
            const aCells = oRow.getCells();
            const oInput = aCells.find(cell => cell.isA("sap.m.Input"));
            const sTotalAmt = oContext.getProperty("TotalAmt");

            if (bSelected) {
                oInput.setValue(sTotalAmt);
                oInput.setEditable(false);
                record.PayMethod = "X";
            } else {
                oInput.setEditable(true);
                oInput.setValue("0.00");
                record.PayMethod = "";
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
            var sFiltered = sValue.replace(/\D/g, "");
            oInput.setValue(sFiltered);
            var oContext = oInput.getBindingContext();
            const record = oContext.getObject();
            if (!record.OriginalTotalAmt) {
                record.OriginalTotalAmt = record.TotalAmt;
            }
            var oRow = oInput.getParent();
            var oCheckBox = oRow.getCells().find(cell => cell.isA("sap.m.CheckBox"));
            var iValue = parseInt(sValue, 10);
            var TotalAmount = parseInt(record.OriginalTotalAmt, 10) || 0;

            if (isNaN(iValue) || iValue < 0) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Add valid value");
            } else if (iValue > TotalAmount) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Payable amount exceeds Total Amount");
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
        formatVendor: function (sLifnr, oContext) {
            const sName1 = oContext.getProperty("Name1");
            return sLifnr + " - " + sName1;
        },


        onPayMethodPress: function (oEvent) {
            this._oButton = oEvent.getSource();
            this.rowContext = this._oButton.getParent();


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
            const oVendorData = this.mdl_zFilter.getProperty("/VendorDetails") || {};
            if (!oVendorData[sLifnr]) {
                oVendorData[sLifnr] = {
                    PayMethodSelectedKey: "OPTION_Full"
                };
                this.mdl_zFilter.setProperty("/VendorDetails", oVendorData);
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
            const oDialogState = oDialog.getModel("dialogState").getData();
            const isFullPayment = oDialogState.PayMethodSelectedKey === "OPTION_Full";

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
                        if (oData.results.length > 0) {
                            const aVenDetResults = oData.results[0].VenDet?.results || [];

                            if (isFullPayment) {
                                aVenDetResults.forEach(invoice => {
                                    invoice.ApprovalAmt = invoice.DocAmt;
                                    invoice.PayMethod = "X";
                                });
                            }


                            const oJSONModel = new JSONModel({ results: aVenDetResults });
                            oDialog.setModel(oJSONModel, "filtered");
                            if (!oVendorData[sLifnr]) {
                                oVendorData[sLifnr] = {};
                            }

                            oVendorData[sLifnr].Invoices = aVenDetResults;
                            this.mdl_zFilter.setProperty("/VendorDetails", oVendorData);
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
            var sNewText = "";
            let fTotalApprovalAmt = 0;
            const oDialog = oEvent.getSource().getParent();
            const oDialogState = oDialog.getModel("dialogState").getData();

            const sLifnr = this._oButton.getBindingContext().getProperty("Lifnr");
            const oVendorData = this.mdl_zFilter.getProperty("/VendorDetails");

            oVendorData[sLifnr] = oDialogState;
            const updatedInvoices = oDialog.getModel("filtered").getProperty("/results");
            if (updatedInvoices) {

                for (let invoice of updatedInvoices) {
                    if (parseFloat(invoice.ApprovalAmt) > parseFloat(invoice.DocAmt)) {
                        MessageBox.warning("Approval amount cannot be greater than Total Amount. Please enter a valid value.");
                        return;
                    }
                    if (oDialogState.PayMethodSelectedKey === "OPTION_Full") {

                        invoice.ApprovalAmt = invoice.DocAmt;
                        invoice.PayMethod = "X";
                    }

                    fTotalApprovalAmt += parseFloat(invoice.ApprovalAmt);
                }

                oVendorData[sLifnr].Invoices = updatedInvoices;
            }

            this.mdl_zFilter.setProperty("/VendorDetails", oVendorData);
            console.log("Total Amount:::" + fTotalApprovalAmt)
            this.rowContext.getCells()[3].setText(fTotalApprovalAmt);

            if (oDialogState.PayMethodSelectedKey === "OPTION_Full") {
                sNewText = "Full";
            }
            else if (oDialogState.PayMethodSelectedKey === "OPTION_Partial") {
                sNewText = "Partial";
            }

            this._oButton.setText(sNewText);

            oDialog.close();
        },
        onFullPaymentSelected: function (oEvent) {
            const bSelected = oEvent.getParameter("selected");
            const oContext = oEvent.getSource().getBindingContext("filtered");
            const record = oContext.getObject();
            if (bSelected) {
                record.ApprovalAmt = record.DocAmt;
                record.PayMethod = "X";
            } else {
                record.ApprovalAmt = "0.00";
                record.PayMethod = "";
            }
            const oModel = oContext.getModel();
            oModel.checkUpdate(true);

        },
        editableBasedOnPayMethod: function (sGlobalPayMethod, sRowPayMethod) {
            return sGlobalPayMethod === "OPTION_Partial" && sRowPayMethod !== "X";
        },

        onPayMethodChange: function (oEvent) {
            const sKey = oEvent.getSource().getSelectedKey();
            const sLifnr = this._oButton.getBindingContext().getProperty("Lifnr");
            const oDialog = this._dialogMap[sLifnr];
            const oFilteredModel = oDialog.getModel("filtered");
            const aInvoices = oFilteredModel.getProperty("/results");

            if (sKey === "OPTION_Full") {
                aInvoices.forEach(function (oInvoice) {
                    oInvoice.PayMethod = "X";
                    oInvoice.ApprovalAmt = oInvoice.DocAmt;
                });
            } else if (sKey === "OPTION_Partial") {
                aInvoices.forEach(function (oInvoice) {
                    oInvoice.PayMethod = "";
                    oInvoice.ApprovalAmt = "0.00";
                });
            }

            oFilteredModel.setProperty("/results", aInvoices);
            oFilteredModel.checkUpdate(true);
        },
        formatCategory: function (sCategory) {
            if (sCategory === "I") {
                return "Invoice";
            } else if (sCategory === "A") {
                return "Advance Request";
            } else if (sCategory === "R") {
                return "Retention";
            }
            return "";
        },


        onApprovalAmtChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sNewApprovalAmt = oInput.getValue();
            const approvalAmt = parseFloat(sNewApprovalAmt);

            const oContext = oInput.getBindingContext("filtered");
            const record = oContext.getObject();
            const docAmt = parseFloat(record.DocAmt);

            if (docAmt === approvalAmt) {
                record.PayMethod = "X";
            }
            else {
                record.PayMethod = "";
            }

            if (isNaN(sNewApprovalAmt) || approvalAmt < 0) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Add valid value");
            } else if (approvalAmt > docAmt) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Payable amount exceeds Total Amount");
            }
            else {
                oInput.setValueState("None");
                oInput.setValueStateText("");
            }

        },




        //FOOTER

        onSubmitPress: function (oEvent) {
            var othis = this;
            const oModel = this.getView().getModel();
            const oView = this.getView();

            const sSelectedKey = this.mdl_zFilter.getProperty("/VendorDetails/SelectedKey");
            oView.setBusy(true);

            const formatToODataDate = function (dateString) {
                const oDate = new Date(dateString);
                return `/Date(${oDate.getTime()})/`;
            };

            if (sSelectedKey === "Customers") {

                const oTable = oView.byId("customerTable");
                const aSelectedItems = oTable.getSelectedItems();
                const aCustReq = [];


                let bHasMissingPayMethod = false;
                if (!aSelectedItems.length) {
                    MessageToast.show("Please select at least one customer record.");
                    oView.setBusy(false);
                    return;
                }

                aSelectedItems.forEach(function (oItem1) {
                    const aCells = oItem1.getCells();
                    const sTextValue = aCells[8].getValue();
                    if (sTextValue.trim() === "0.00") {
                        bHasMissingPayMethod = true;
                    }
                });

                if (bHasMissingPayMethod) {
                    oView.setBusy(false);
                    MessageToast.show("Please add Payment Method in all selected records.");
                    return;
                }


                for (let oItem of aSelectedItems) {
                    const oData = oItem.getBindingContext().getObject();

                    const aCells = oItem.getCells();
                    const sApprovalAmt = aCells[8].getValue();

                    if (parseFloat(sApprovalAmt) > parseFloat(oData.TotalAmt)) {
                        oView.setBusy(false);
                        MessageBox.warning("Approval amount cannot be greater than Total Amount. Please enter a valid value.");
                        return;
                    }
                    const isFullPayment = parseFloat(sApprovalAmt) === parseFloat(oData.TotalAmt);

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
                        "PayMethod": isFullPayment ? "X" : "",
                        "ApprovalAmt": sApprovalAmt,
                        "Bankl": oData.Bankl || "",
                        "Buzei": oData.Buzei
                    });
                }

                const oPayload = {
                    RequestNo: "",
                    CustReq: aCustReq
                };


                oModel.create("/CustomerReqSet", oPayload, {
                    success: function () {
                        oView.setBusy(false);
                        MessageBox.success("Customer submission successful!");
                        othis.clearAllFields();
                        othis.onTableRefresh();
                    },
                    error: function (oError) {
                        oView.setBusy(false);
                        console.error("Error: ", oError);
                        MessageBox.error("Customer submission failed. Please try again.");
                    }
                });

            }
            else if (sSelectedKey === "Vendors") {
                const oVendorTable = oView.byId("vendorTable");
                const aSelectedVendors = oVendorTable.getSelectedItems();

                if (!aSelectedVendors.length) {
                    MessageToast.show("Please select at least one Vendor record.");
                    oView.setBusy(false);
                    return;
                }

                let bHasMissingPayMethod = false;
                aSelectedVendors.forEach(function (oItem1) {
                    const aCells = oItem1.getCells();
                    const oButton = aCells[4];
                    const sButtonText = oButton.getText();

                    if (!sButtonText.trim()) {
                        bHasMissingPayMethod = true;
                    }
                });

                if (bHasMissingPayMethod) {
                    oView.setBusy(false);
                    MessageToast.show("Please add Payment Method in all selected records.");
                    return;
                }


                const aVenReq = [];
                const oVendorData = this.mdl_zFilter.getProperty("/VendorDetails");

                aSelectedVendors.forEach(function (oItem) {
                    const oData = oItem.getBindingContext().getObject();

                    const sLifnr = oData.Lifnr;

                    const aInvoices = oVendorData[sLifnr]?.Invoices || [];

                    aInvoices.forEach(function (invoice) {
                        aVenReq.push({
                            "Lifnr": invoice.Lifnr,
                            "Category": invoice.Category,
                            "Docnr": invoice.Docnr,
                            "Bukrs": invoice.Bukrs,
                            "Gjahr": invoice.Gjahr,
                            "Budat": invoice.Budat,
                            "DocAmt": invoice.DocAmt,
                            "PayMethod": invoice.PayMethod,
                            "ApprovalAmt": invoice.ApprovalAmt,
                            "Project": invoice.Project || "",
                            "ProjectName": invoice.ProjectName || "",
                            "Buzei": invoice.Buzei,
                            "RequestNo": ""
                        });
                    });
                });
                console.log("aVenReq", aVenReq)

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
                        MessageBox.success("Vendor submission successful!");
                        othis.clearAllFields();
                        othis.onTableRefresh();
                    },
                    error: function (oError) {
                        oView.setBusy(false);
                        console.error("Error: ", oError);
                        MessageBox.error("Vendor submission failed. Please try again.");
                    }
                });

            }
        },
        clearAllFields: function () {
            const sSelectedKey = this.mdl_zFilter.getProperty("/VendorDetails/SelectedKey");
            var oSmartFilterBar;
            if (sSelectedKey === "Customers") {
                const oCustomerTable = this.getView().byId("customerTable");
                oSmartFilterBar = this.byId("customerFilterBar");
                var aItems = oCustomerTable.getItems();
                aItems.forEach(function (oRow) {
                    const aCells = oRow.getCells();
                    const oCheckBox = aCells[7];
                    if (oCheckBox && oCheckBox.isA("sap.m.CheckBox")) {
                        oCheckBox.setSelected(false);
                    }
                    const payableAmt = aCells[8];
                    payableAmt.setValue("0.00");
                });
                oCustomerTable.removeSelections(true);

            } else if (sSelectedKey === "Vendors") {
                const oVendorTable = this.getView().byId("vendorTable");
                oSmartFilterBar = this.byId("vendorFilterBar");
                var oData = this.mdl_zFilter.getData();
                oData.VendorDetails = models.getVendorBlank();
                this.mdl_zFilter.updateBindings();
                const aItems = oVendorTable.getItems();
                aItems.forEach(function (oItem1) {
                    const aCells = oItem1.getCells();
                    const approvalAmt = aCells[3];
                    const oButton = aCells[4];
                    approvalAmt.setText("0.00");
                    oButton.setText("");
                });
                oVendorTable.removeSelections(true);

            }
            var oFilterData = oSmartFilterBar.getFilterData();
            var oPreservedDate = oFilterData.DateAson;
            var oPreservedPaval = oFilterData.Paval;
            oSmartFilterBar.clear();
            oSmartFilterBar.setFilterData({
                DateAson: oPreservedDate,
                Paval: oPreservedPaval
            });
            oSmartFilterBar.search();
        },
        onTableRefresh: function () {

            const sSelectedKey = this.mdl_zFilter.getProperty("/VendorDetails/SelectedKey");
            const oSmartTable = this.getView().byId(sSelectedKey === "Customers" ? "customerTable" : "vendorTable");
            if (oSmartTable) {
                const oTableBinding = oSmartTable.getBinding("items");
                // oSmartTable.removeSelections(true); 
                oTableBinding.refresh();
            }
        },

        onCancelPress: function () {
            this.clearAllFields();
        }

    });
});