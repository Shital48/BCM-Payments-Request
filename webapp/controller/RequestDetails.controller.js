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

            sap.ui.core.BusyIndicator.show(0);
            this.selectedOrdersModel = new JSONModel({ selectedProducts: [] });
            this.getView().setModel(this.selectedOrdersModel, "selectedOrdersModel");
        },

        onBeforeRendering: function () {
            var oModel1 = this.getView().getModel();
            oModel1.metadataLoaded().then(function () {
                sap.ui.core.BusyIndicator.hide();
            });
            this.projectModel = this.getOwnerComponent().getModel('zRequestModel');
        },

        onAfterRendering: function () {
            var oSmartFilterBar1 = this.byId("vendorFilterBar");
            if (oSmartFilterBar1) {
                oSmartFilterBar1.attachInitialized(function () {
                    oSmartFilterBar1.setFilterData({
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

            var oSmartFilterBar2 = this.byId("customerFilterBar");
            if (oSmartFilterBar2) {
                oSmartFilterBar2.attachInitialized(function () {
                    oSmartFilterBar2.setFilterData({
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
                this.projectModel.setProperty("/SelectedKey", "Vendors");
                // oView.byId("vendorsSection").setVisible(true);
                // oView.byId("customersSection").setVisible(false);
                // this.clearAllFields();
            } else if (selectedKey === "OPTION_CUSTOMER") {
                this.projectModel.setProperty("/SelectedKey", "Customers");
                // oView.byId("customersSection").setVisible(true);
                // oView.byId("vendorsSection").setVisible(false);
                // this.clearAllFields();
            }
        },

        //  CAN DIRECTLY BIND WITHOUT STORING IN JSON

        onVendorFilterSearch: function (oEvent) {
            var that = this;
            const oModel = this.getOwnerComponent().getModel();
            var oSmartFilterBar = this.byId("vendorFilterBar");
            this.aFilters = oSmartFilterBar.getFilters();

            this.getView().setBusy(true);
            oModel.read("/VendorInvSet", {
                // urlParameters: {
                //     // "$expand": "VenDet",
                //     "$filter":  aFilters
                // },
                filters: that.aFilters,
                success: function (oData) {
                    that.projectModel.setProperty("/filteredVendors", oData.results);
                    that.getView().setBusy(false);
                },
                error: function () {
                    that.projectModel.setProperty("/filteredVendors", []);
                    that.getView().setBusy(false);
                }
            });

        },


        // BIND ENTITYSET DEIRECTLY


        onProjectPress: function (oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("zRequestModel");
            var oProject = oContext.getObject();
            //GET PROJECT OR COMPANY CODE OR GSBER
            var ProjectId = oProject.HierarchyNode;
            // const oProjData = this.projectModel.getData().ProjectDetails || {};
            const oProjData = this.projectModel.getProperty("/VendorDetails") || {};
            if (!oProjData[ProjectId]) {
                oProjData[ProjectId] = { CompanyName: oProject.Bukrs };
            }
            this.projectModel.setProperty("/VendorDetails", oProjData);
            this.currentProjectId = ProjectId;
            this._loadVendorDetails(ProjectId);
        },

        _loadVendorDetails: function (oProjectId) {
            var that = this;
            const oModel = this.getView().getModel();
            const sProjectId = oProjectId;
            // APPLY FILTER ON PROJECT TO GET PROJECT VENDORS
            var aCombinedFilters = this.aFilters.concat([
                new Filter("HierarchyNode", FilterOperator.EQ, oProjectId)
            ]);

            that.getView().setBusy(true);
            oModel.read("/VendorInvSet", {
                urlParameters: {
                    "$expand": "VenDet"
                },
                filters: aCombinedFilters,
                success: function (oData) {
                    that.getView().setBusy(false);
                    const aOrders = oData.results.map(vendors => {
                        const sVendorId = vendors.Lifnr;
                        const oSavedData = this.projectModel.getProperty(`/VendorDetails/${sProjectId}/${sVendorId}`) || {};
                        return { ...vendors, ...oSavedData };
                    });
                    this.getView().setModel(new JSONModel({ vendors: aOrders }), "ordersModel");
                }.bind(this),
                error: function (oError) {
                    // oDialog.setBusy(false);
                    that.getView().setBusy(false);
                    console.error("Error fetching filtered data", oError);
                }


            });
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

        formatAmount: function (value) {
            if (value === undefined || value === null) {
                return "0.00";
            }
            return parseFloat(value).toFixed(2);
        },
        onFieldValueChange: function (oEvent) {
            const oSource = oEvent.getSource();
            const sField = oSource.getCustomData().find(d => d.getKey() === "field")?.getValue();
            const sProjectId = this.currentProjectId;

            if (!sField || !sProjectId) return;

            const oContext = oSource.getBindingContext("dialogModel") || oSource.getBindingContext("ordersModel");
            const oRowData = oContext?.getObject();

            const sVendorId = oRowData?.Lifnr;
            const sOrderId = oRowData?.Docnr;
            const sTotalAmt = parseFloat(oRowData?.TotalAmt);
            const sDocumentAmt = parseFloat(oRowData?.DocAmt);

            if (!sVendorId || !oRowData) return;

            let vValue;

            if (oSource.isA("sap.m.Input")) {
                vValue = oEvent.getParameter("value");
            } else {
                vValue = oSource.getProperty("value") || oSource.getText();
            }

            const oData = this.projectModel.getProperty("/VendorDetails") || {};

            if (!oData[sProjectId])
                oData[sProjectId] = {};
            if (!oData[sProjectId][sVendorId])
                oData[sProjectId][sVendorId] = {};

            const approvalAmt = parseFloat(vValue);

            // Check if it's an order detail row (popup)
            if (sOrderId) {
                if (!oData[sProjectId][sVendorId][sOrderId]) {
                    oData[sProjectId][sVendorId][sOrderId] = {};
                }
                oData[sProjectId][sVendorId][sOrderId][sField] = vValue;

                if (sField === "ApprovalAmt") {
                    if (sDocumentAmt === approvalAmt) {
                        oRowData.PayMethod = "X";
                    } else {
                        oRowData.PayMethod = "";
                    }

                    if (isNaN(approvalAmt) || approvalAmt < 0) {
                        oSource.setValueState("Error");
                        oSource.setValueStateText("Add valid value");
                    } else if (approvalAmt > sDocumentAmt) {
                        oSource.setValueState("Error");
                        oSource.setValueStateText("Payable amount exceeds Document Amount");
                    } else {
                        oSource.setValueState("None");
                        oSource.setValueStateText("");
                    }
                }

            } else {
                // Else it's product-level field (main table)
                oData[sProjectId][sVendorId][sField] = vValue;

                if (sField === "ApprovalAmt") {
                    // if (sTotalAmt === approvalAmt) {
                    //     oRowData.PayMethod = "X";
                    // } else {
                    //     oRowData.PayMethod = "";
                    // }

                    if (isNaN(approvalAmt) || approvalAmt < 0) {
                        oSource.setValueState("Error");
                        oSource.setValueStateText("Add valid value");
                    } else if (approvalAmt > sTotalAmt) {
                        oSource.setValueState("Error");
                        oSource.setValueStateText("Payable amount exceeds Total Amount");
                    } else {
                        oSource.setValueState("None");
                        oSource.setValueStateText("");
                    }

                    const oView = this.getView();
                    const sProjectId = this.currentProjectId;
        
                    //ADD VENDOR ID
                    const pProduct = oEvent.getSource().getBindingContext("ordersModel").getObject();
                    const oVenDet = pProduct.VenDet;
                    const sVendorId = oVenDet.results?.[0]?.Lifnr;
                    const oSavedData = this.projectModel.getProperty(`/VendorDetails/${sProjectId}/${sVendorId}`) || {};
                    const approvalAmount = parseFloat(oSavedData.ApprovalAmt || 0);
                    let remainingApproval = approvalAmount;
        
                    const aMergedDetails = oVenDet.results.map(oDetail => {
                        const sDocId = oDetail.Docnr;
                        const savedDetail = oSavedData[sDocId] || {};
                        const docAmt = parseFloat(oDetail.DocAmt || 0);
        
                        let distributedAmt = 0;
                        if (remainingApproval > 0) {
                            distributedAmt = Math.min(docAmt, remainingApproval);
                            remainingApproval -= distributedAmt;
                        }
                        return { ...oDetail, ApprovalAmt: distributedAmt.toFixed(2) };
                    });

                    // this.projectModel.setProperty(`/VendorDetails/${sProjectId}/${sVendorId}`, oSavedData);

        
                    if (!this._pDialog) {
                        this._pDialog = Fragment.load({
                            name: "refunddetails.view.InvoiceDetail",
                            controller: this
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            return oDialog;
                        });
                    }
        
                    this._pDialog.then(function (oDialog) {
                        const oDialogModel = new JSONModel(aMergedDetails);
                        oDialog.setModel(oDialogModel, "dialogModel"); 
                    });
                }
            }

            this.projectModel.setProperty("/VendorDetails", oData);
        },

        formatVendor: function (sLifnr, oContext) {
            const sName1 = oContext.getProperty("Name1");
            return sLifnr + " - " + sName1;
        },


        onPayMethodPress: function (oEvent) {
            this.oSource1 = oEvent.getSource();
            const pProduct = oEvent.getSource().getBindingContext("ordersModel").getObject();
            this.sProduct=pProduct;
            const oRowElement = oEvent.getSource().getParent(); // Assuming Button is in the row's cell (HBox or VBox)

            // Find ApprovalAmt Input inside the same row
            const aInputs = oRowElement.findAggregatedObjects(true, (control) => {
                return control.isA("sap.m.Input") &&
                    control.getCustomData().some(data => data.getKey() === "field" && data.getValue() === "ApprovalAmt");
            });

            const oApprovalInput = aInputs[0];

            // Check for input error
            if (oApprovalInput && oApprovalInput.getValueState() === "Error") {
                MessageBox.warning("Please correct the Approval Amount before proceeding.");
                return; // Prevent opening the dialog
            }

            const oVenDet = pProduct.VenDet;
            this._openOrderDetailDialog(oVenDet.results);

        },

        _openOrderDetailDialog: function (aDetails) {
            const oView = this.getView();
            const sProjectId = this.currentProjectId;
            const pProduct = this.sProduct;

            //ADD VENDOR ID
            const sVendorId = aDetails?.[0]?.Lifnr;
            const oSavedData = this.projectModel.getProperty(`/VendorDetails/${sProjectId}/${sVendorId}`) || {};
             
            const aMergedDetails = aDetails.map(oDetail => {
                const sDocId = oDetail.Docnr;
                const savedDetail = oSavedData[sDocId] || {}; 
 
                return { ...oDetail, ...savedDetail};
            });

            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    name: "refunddetails.view.InvoiceDetail",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pDialog.then(function (oDialog) {
                if(parseFloat(pProduct.ApprovalAmt) === 0)
                {
                    const oDialogModel = new JSONModel(aMergedDetails);
                oDialog.setModel(oDialogModel, "dialogModel");
                }                
                oDialog.open();
            });
        },
        onCloseOrderDialog: function () {
            this._pDialog.then((oDialog) => {
                const aInputs = oDialog.findElements(true).filter(control => control.isA("sap.m.Input"));

                let bHasError = false;

                aInputs.forEach(input => {
                    if (input.getValueState() === "Error") {
                        bHasError = true;
                    }
                });

                if (bHasError) {
                    MessageBox.warning("Please correct all input errors before closing the dialog.");
                    return;
                }

                const oDialogModel = oDialog.getModel("dialogModel");
                const aInvoiceDetails = oDialogModel.getData();

                const totalDistributed = aInvoiceDetails.reduce((sum, item) => {
                    return sum + parseFloat(item.ApprovalAmt || 0);
                }, 0);
                const oOrdersModel = this.getView().getModel("ordersModel");
                const oVendorContext = this.oSource1.getBindingContext("ordersModel");
                const sVendorPath = oVendorContext.getPath();
                oOrdersModel.setProperty(sVendorPath + "/ApprovalAmt", totalDistributed.toFixed(2));
                oDialog.close();
            });
        },

        onVendorSelection: function (oEvent) {
            const oTable = oEvent.getSource();
            const aSelectedItems = oTable.getSelectedItems();
            const projectId = this.currentProjectId;

            const aSelectedData = aSelectedItems.map(oItem => {
                const oProduct = oItem.getBindingContext("ordersModel").getObject();
                const productId = oProduct.ProductID;
                const oSavedOrderDetails = this.projectModel.getProperty(`/VendorDetails/${projectId}/${productId}`) || {};
                let aOriginalOrderDetails = oProduct.VenDet?.results;

                let aMergedOrderDetails = [];
                aMergedOrderDetails = aOriginalOrderDetails.map(oOrder => {
                    const savedOrder = oSavedOrderDetails[oOrder.OrderID];
                    return {
                        ...oOrder,
                        ...(savedOrder || {})
                    };
                });
                return {
                    ...oProduct,
                    Order_Details: aMergedOrderDetails
                };
            });
            this.selectedOrdersModel.setProperty("/selectedProducts", aSelectedData);
            console.log("✅ Selected Rows Saved:", aSelectedData);
        },

        onFullPaymentSelected: function (oEvent) {
            const bSelected = oEvent.getParameter("selected");
            const oContext = oEvent.getSource().getBindingContext("dialogModel");
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
            const oFilteredModel = oDialog.getModel("dialogModel");
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

            const oContext = oInput.getBindingContext("dialogModel");
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

            const sSelectedKey = this.projectModel.getProperty("/VendorDetails/SelectedKey");
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
                        "Gsber": oData.Gsber,
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

                const aInputs = oTable.findAggregatedObjects(true, control => control.isA("sap.m.Input"));

                // Check if any input has an error
                const bHasError = aInputs.some(input => input.getValueState() === "Error");

                if (bHasError) {
                    MessageBox.warning("Please correct all input errors before submitting.");
                    return; // Stop submission
                }



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
                const oVendorData = this.projectModel.getProperty("/VendorDetails");

                aSelectedVendors.forEach(function (oItem) {
                    const oData = oItem.getBindingContext().getObject();

                    const sLifnr = oData.Lifnr;

                    const aInvoices = oVendorData[sLifnr]?.Invoices || [];

                    aInvoices.forEach(function (invoice) {
                        aVenReq.push({
                            "Lifnr": invoice.Lifnr,
                            "Gsber": invoice.Gsber,
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
            const sSelectedKey = this.projectModel.getProperty("/VendorDetails/SelectedKey");
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
                var oData = this.projectModel.getData();
                oData.VendorDetails = models.getVendorBlank();
                this.projectModel.updateBindings();
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

            const sSelectedKey = this.projectModel.getProperty("/VendorDetails/SelectedKey");
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