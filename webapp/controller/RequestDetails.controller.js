sap.ui.define([
    "refunddetails/model/models",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat", 
    "sap/ui/core/Fragment", 
    "sap/m/MessageToast",
    "sap/m/MessageBox"

], (models, Controller, JSONModel, DateFormat, Fragment, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("refunddetails.controller.RequestDetails", {
        onInit() {
            this.byId("masterPage").setShowNavButton(false);
            sap.ui.core.BusyIndicator.show(0);
            this.selectedOrdersModel = new JSONModel({ selectedProducts: [] });
            this.getView().setModel(this.selectedOrdersModel, "selectedOrdersModel");
        },
        formatAmount: function (value) {
            if (!value) return "";
            return parseFloat(value).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        onBeforeRendering: function () {
            var oModel1 = this.getView().getModel();
            oModel1.metadataLoaded().then(function () {
                sap.ui.core.BusyIndicator.hide();
            });
            this.projectModel = this.getOwnerComponent().getModel('zRequestModel');
            this.getView().setModel(this.projectModel, "projectModel");
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

            // var oSmartFilterBar2 = this.byId("customerFilterBar");
            // if (oSmartFilterBar2) {
            //     oSmartFilterBar2.attachInitialized(function () {
            //         oSmartFilterBar2.setFilterData({
            //             DateAson: {
            //                 items: [],
            //                 ranges: [{
            //                     exclude: false,
            //                     operation: "LE",
            //                     keyField: "DateAson",
            //                     value1: new Date(),
            //                     value2: null
            //                 }]
            //             }
            //         });
            //     });

            // }
        },


        //Header 

        onSelectionChange: function (oEvent) {
            var selectedKey = oEvent.getSource().getSelectedKey();
            this._selectedPayMethodText = oEvent.getSource().getSelectedItem().getText();

            // var oView = this.getView();

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

        //FORMATTER

        formatDate: function (sDate) {
            if (!sDate) {
                return "";
            }
            var oDate = new Date(sDate);
            return DateFormat.getDateTimeInstance({ pattern: "dd/MM/yyyy" }).format(oDate);
        },

        formatVendor: function (sLifnr, oContext) {
            const sName1 = oContext.getProperty("Name1");
            return sLifnr + " - " + sName1;
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
        formatAmount: function (Amt) {
            if (!Amt) return "";
            return parseFloat(Amt).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },
        // onCheckboxSelect1: function (oEvent) {
        //     const bSelected = oEvent.getParameter("selected");
        //     const oCheckBox = oEvent.getSource();
        //     const oContext1 = oCheckBox.getBindingContext();
        //     const record = oContext1.getObject();
        //     const oRow = oCheckBox.getParent();
        //     const oContext = oRow.getBindingContext();
        //     const aCells = oRow.getCells();
        //     const oInput = aCells.find(cell => cell.isA("sap.m.Input"));
        //     const sTotalAmt = oContext.getProperty("TotalAmt");

        //     if (bSelected) {
        //         oInput.setValue(sTotalAmt);
        //         oInput.setEditable(false);
        //         record.PayMethod = "X";
        //     } else {
        //         oInput.setEditable(true);
        //         oInput.setValue("0.00");
        //         record.PayMethod = "";
        //     }
        // },

        // formatAmount: function (value) {
        //     if (value === undefined || value === null) {
        //         return "0.00";
        //     }
        //     return parseFloat(value).toFixed(2);
        // }, 


        // CAN REMOVE 

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
        },


        onVendorFilterSearch: function (oEvent) { 
            var that = this;
            this._currentLevel = "city";
            this.byId("masterPage").setTitle("City");
            this.byId("masterPage").setVisible(true);
            this.byId("cityList").setVisible(true);
            var oSmartFilterBar = this.byId("vendorFilterBar");
            var aFilters = oSmartFilterBar.getFilters(); 
            const oModel = this.getView().getModel();
            this.getView().setBusy(true);

            oModel.read("/CityLevelSet", {
                filters: aFilters,
                success: function (oData) {
                    const aCities = oData.results;
                    const oCitiesById = {};
                    aCities.forEach(city => {
                        oCitiesById[city.Zzcity] = city;
                    });
                    that.projectModel.setProperty("/CityProjectsById", oCitiesById);
                    that.projectModel.setProperty("/CityProjectList", aCities);
                    that.getView().setBusy(false);
                }.bind(that),
                error: function (oError) {
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show("Error while fetching city data");
                    console.error("OData read failed", oError);
                }.bind(that)
            });
        },

        onCitySelect: function (oEvent) {
            var that = this;
            this._currentLevel = "busSeg";
            this.byId("masterPage").setShowNavButton(true);
            this.byId("masterPage").setTitle("Business Segment");
            const city = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject().Zzcity; 
            this.byId("cityList").setVisible(false);
            this.byId("busSegList").setVisible(true);
            const cachedSegments = this.projectModel.getProperty(`/CityProjectsById/${city}/BusinessSegmentById`);
            if (cachedSegments && Object.keys(cachedSegments).length) {
                return;
            }
            const oModel = this.getView().getModel();
            this.getView().setBusy(true);
            oModel.read(`/CityLevelSet('${city}')/CityBus`, {
                success: function (oData) {
                    const aBisSeg = oData.results;
                    const oBisSegById = {};
                    aBisSeg.forEach(seg => {
                        oBisSegById[seg.BusSeg] = seg;
                    });
                    that.projectModel.setProperty(`/CityProjectsById/${city}/BusinessSegmentById`, oBisSegById);
                    that.projectModel.setProperty("/BusinessSegmentList", aBisSeg);
                    that.getView().setBusy(false);
                }.bind(that),
                error: function (oError) {
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show("Error while fetching business segments");
                    console.error("OData read failed", oError);
                }.bind(that)
            });
        },
        onBusSegSelect: function (oEvent) {
            var that = this;
            this._currentLevel = "busComp";
            this.byId("masterPage").setTitle("Company");
            const context = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject();
            const city = context.Zzcity;
            const busSeg = context.BusSeg;
            this.byId("busSegList").setVisible(false);
            this.byId("busCompList").setVisible(true); 
            const oModel = this.getView().getModel();
            const cachedCompanies = this.projectModel.getProperty(`/CityProjectsById/${city}/BusinessSegmentById/${busSeg}/oCompanyById`);
            if (cachedCompanies && Object.keys(cachedCompanies).length) return;
            this.getView().setBusy(true);
            oModel.read(`/BusSegLevelSet(Zzcity='${city}',BusSeg='${busSeg}')/BusComp`, {
                success: function (oData) {
                    const aCompany = oData.results;
                    const oCompanyById = {};
                    aCompany.forEach(company => {
                        oCompanyById[company.Bukrs] = company;
                    });
                    that.projectModel.setProperty(`/CityProjectsById/${city}/BusinessSegmentById/${busSeg}/oCompanyById`, oCompanyById);
                    that.projectModel.setProperty("/CompanyList", aCompany);
                    that.getView().setBusy(false);
                }.bind(that),
                error: function (oError) {
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show("Error while fetching Companies");
                    console.error("OData read failed", oError);
                }.bind(that)
            });
        },
        onBusCompSelect: function (oEvent) {
            var that = this;
            this._currentLevel = "project";
            this.byId("masterPage").setTitle("Project");
            const context = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject();
            const city = context.Zzcity;
            const busSeg = context.BusSeg;
            const bukrs = context.Bukrs;
            this.byId("busCompList").setVisible(false);
            this.byId("projectList").setVisible(true);
            const cachedProjects = this.projectModel.getProperty(`/CityProjectsById/${city}/BusinessSegmentById/${busSeg}/oCompanyById/${bukrs}/ProjectsById`);
            if (cachedProjects && Object.keys(cachedProjects).length) return;
            const oModel = this.getView().getModel();
            this.getView().setBusy(true);
            oModel.read(`/CompanyLevelSet(Zzcity='${city}',BusSeg='${busSeg}',Bukrs='${bukrs}')/CompProj`, {
                success: function (oData) {
                    const aProjects = oData.results;
                    const oProjectsById = {};
                    aProjects.forEach(project => {
                        oProjectsById[project.Gsber] = project;
                    });
                    that.projectModel.setProperty(`/CityProjectsById/${city}/BusinessSegmentById/${busSeg}/oCompanyById/${bukrs}/ProjectsById`, oProjectsById);
                    that.projectModel.setProperty("/ProjectList", aProjects);
                    that.getView().setBusy(false);
                }.bind(that),
                error: function (oError) {
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show("Error while fetching projects");
                    console.error("OData read failed", oError);
                }.bind(that)
            });
        },
        onProjectPress: function (oEvent) {
            var that=this;
            const context = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject();
            this.projectData = context;
            const { Zzcity: city, BusSeg: busSeg, Bukrs: bukrs, Gsber: gsber } = context;
            const sPath = `/ProjLevelSet(Zzcity='${city}',BusSeg='${busSeg}',Bukrs='${bukrs}',Gsber='${gsber}')/ProjVen`;
            const vendorPath = `/CityProjectsById/${city}/BusinessSegmentById/${busSeg}/oCompanyById/${bukrs}/ProjectsById/${gsber}/VendorsById`;
            this.currentProjectId = gsber; 
            const oDetailPage = this.byId("detailPage"); 
            if (!oDetailPage.getVisible()) {
                oDetailPage.setVisible(true);
            } 
            const vendorDetails = this.projectModel.getProperty("/VendorDetails") || {};
            if (!vendorDetails[gsber]) {
                vendorDetails[gsber] = { CompanyName: bukrs };
                this.projectModel.setProperty("/VendorDetails", vendorDetails);
            } 
            const cachedVendors = this.projectModel.getProperty(vendorPath);
            if (cachedVendors && Object.keys(cachedVendors).length) {
                this._loadVendorDetails(gsber, vendorPath);
            } else { 
                this.getView().setBusy(true);
                this.getView().getModel().read(sPath, {
                    urlParameters: {
                        "$expand": "VenDet"
                    },
                    success: function (oData) {
                        that.getView().setBusy(false);
                        const aVendors = oData.results;
                        const oVendorsById = {};
                        aVendors.forEach(vendor => {
                            oVendorsById[vendor.Lifnr] = vendor;
                        });
                        that.projectModel.setProperty(vendorPath, oVendorsById);
                        that._loadVendorDetails(gsber, vendorPath);
                    },
                    error: function (oError) {
                        that.getView().setBusy(false);
                        console.error("Error fetching vendors", oError);
                    } 
                });
            }
        },
        _loadVendorDetails: function (projectId, vendorPath) {
            const oVendors = this.projectModel.getProperty(vendorPath) || {};
            const vendorDetails = this.projectModel.getProperty("/VendorDetails") || {};

            const aOrders = Object.values(oVendors).map(vendor => {
                const sVendorId = vendor.Lifnr;
                const saved = vendorDetails[projectId]?.[sVendorId] || {};
                const merged = { ...vendor, ...saved };
                merged.ApprovalAmt = parseFloat(merged.ApprovalAmt || vendor.ApprovalAmt).toFixed(2);
                merged.PayType = saved.PayType || vendor.PayType || "Full";
                merged.isSelected = saved.isSelected|| false;
                return merged;
            });

            this.getView().setModel(new sap.ui.model.json.JSONModel({ vendors: aOrders }), "ordersModel");
        },
        onVendorsTableUpdateFinished: function () {
    const oTable = this.byId("vendorsTable");
    if (!oTable) return;

    oTable.getItems().forEach(item => {
        const ctx = item.getBindingContext("ordersModel");
        if (ctx?.getObject()?.isSelected) {
            oTable.setSelectedItem(item, true);
        }
    });
},

        onFieldValueChange: function (oEvent) {
            const oSource = oEvent.getSource();
            const sField = oSource.getCustomData().find(d => d.getKey() === "field")?.getValue();
            const sProjectId = this.currentProjectId;
            if (!sField || !sProjectId) return;
            const oContext = oSource.getBindingContext("dialogModel") || oSource.getBindingContext("ordersModel");
            const oRowData = oContext?.getObject();
            const sVendorId = oRowData?.Lifnr; 
            const sOrderId = oRowData?.Ukey;
            if (!sVendorId || !oRowData) return;
            let vValue = oEvent.getParameter("value");
            const approvalAmt = parseFloat(vValue || 0);
            const oData = this.projectModel.getProperty("/VendorDetails") || {};
            if (!oData[sProjectId])
                oData[sProjectId] = {};
            if (!oData[sProjectId][sVendorId])
                oData[sProjectId][sVendorId] = {};
            const oSavedData = oData[sProjectId][sVendorId];


            // Invoice Dialog Input Change
            if (sOrderId) {
                if (!oSavedData[sOrderId]) oSavedData[sOrderId] = {};
                oSavedData[sOrderId][sField] = vValue; 
                const sDocAmt = parseFloat(oRowData?.DocAmt || 0);
                if (isNaN(approvalAmt) || approvalAmt < 0) {
                    oSource.setValueState("Error");
                    oSource.setValueStateText("Enter valid amount");
                } else if (approvalAmt > sDocAmt) {
                    oSource.setValueState("Error");
                    oSource.setValueStateText("Exceeds Doc Amount");
                } else {
                    oSource.setValueState("None");
                }

                // SCENARIO 2: Update vendor-level ApprovalAmt
                const oDialogModel = oContext.getModel("dialogModel");
                const aDetails = oDialogModel.getData();
                const total = (aDetails.Invoices || []).reduce((sum, row) => {
                    return sum + parseFloat(row.ApprovalAmt || 0);
                }, 0);

                const oOrdersModel = this.getView().getModel("ordersModel");
                const aOrders = oOrdersModel.getProperty("/vendors"); // Adjust path as needed
                const oVendorOrder = aOrders.find(row => row.Lifnr === sVendorId);
                if (oVendorOrder) {
                    oVendorOrder.ApprovalAmt = total.toFixed(2);
                    oSavedData.ApprovalAmt = total.toFixed(2);
                }
                this._checkIfAllInvoicesSelected(oDialogModel);

            } else {
                // ----------- Vendor Table Input Change ------------

                const sTotalAmt = parseFloat(oRowData?.TotalAmt || 0);
                if (isNaN(approvalAmt) || approvalAmt < 0) {
                    oSource.setValueState("Error");
                    oSource.setValueStateText("Enter valid amount");
                } else if (approvalAmt > sTotalAmt) {
                    oSource.setValueState("Error");
                    oSource.setValueStateText("Exceeds Total Amount");
                } else {
                    oSource.setValueState("None");
                }
                oSavedData[sField] = vValue;
                const oVenDet = oRowData?.VenDet;
                const approvalAmount = parseFloat(vValue || 0);
                let remaining = approvalAmount;
                const sortedDetails = oVenDet.results?.slice().sort((a, b) => parseFloat(b.DocAmt) - parseFloat(a.DocAmt)) || [];
                const aMerged = sortedDetails.map(doc => {
                    const distAmt = Math.min(remaining, parseFloat(doc.DocAmt));
                    remaining -= distAmt;
                    if (!oSavedData[doc.Ukey]) oSavedData[doc.Ukey] = {};
                    oSavedData[doc.Ukey].ApprovalAmt = distAmt.toFixed(2);
                    return { ...doc, ApprovalAmt: distAmt.toFixed(2) };
                });

                // Save data into dialog model for later use
                this.dialogModelCache = this.dialogModelCache || {};
                this.dialogModelCache[`${sProjectId}_${sVendorId}`] = aMerged;

                // ------- PayType auto-detection -------
                const oOrdersModel = this.getView().getModel("ordersModel");
                const oVendorContext = oSource.getBindingContext("ordersModel");
                const sPath = oVendorContext.getPath();
                const oVendorRow = oOrdersModel.getProperty(sPath);

                const totalAmt = parseFloat(oVendorRow.TotalAmt || 0);
                const enteredAmt = parseFloat(vValue || 0);
                let sPayType = "Partial";

                if (Math.abs(enteredAmt - totalAmt) < 0.01) {
                    sPayType = "Full";
                }

                oOrdersModel.setProperty(sPath + "/PayType", sPayType);

                // Optional: update button text if already rendered
                const aButtons = oSource.getParent().findAggregatedObjects(true, c => c.isA("sap.m.Button"));
                const oPayBtn = aButtons?.find(b => b.hasStyleClass("fullButtonStyle"));
                if (oPayBtn) {
                    oPayBtn.setText(sPayType);
                }
            }
            this.projectModel.setProperty("/VendorDetails", oData);
        },
        onPayMethodPress: function (oEvent) {
            this.oSource1 = oEvent.getSource();

            const oSource = oEvent.getSource();
            const oContext = oSource.getBindingContext("ordersModel");
            const oRowData = oContext?.getObject(); 
            const approvalAmt = parseFloat(oRowData?.ApprovalAmt || 0);
            const sTotalAmt = parseFloat(oRowData?.TotalAmt || 0);
            if (isNaN(approvalAmt) || approvalAmt < 0) {
                MessageBox.warning("Enter valid amount");
                return;
            } else if (approvalAmt > sTotalAmt) {
                MessageBox.warning("Exceeds Total Amount");
                return;
            }
            const pProduct = this.sProduct = oEvent.getSource().getBindingContext("ordersModel").getObject();
            const sProjectId = this.currentProjectId;
            const sVendorId = pProduct.Lifnr; 
            const aInputs = oEvent.getSource().getParent().findAggregatedObjects(true, control => {
                return control.isA("sap.m.Input") &&
                    control.getCustomData().some(data => data.getKey() === "field" && data.getValue() === "ApprovalAmt");
            });
            const oApprovalInput = aInputs[0];
            if (oApprovalInput?.getValueState() === "Error") {
                MessageBox.warning("Please correct the Approval Amount before proceeding.");
                return;
            }

            const oView = this.getView();
            const oSavedData = this.projectModel.getProperty(`/VendorDetails/${sProjectId}/${sVendorId}`) || {};
            const aDetails = pProduct?.VenDet?.results || [];
            // const sPayType = oSavedData.PayType || pProduct.PayType || "Full";

            const aMerged = aDetails.map(doc => {
                const docId = doc.Ukey;
                const saved = oSavedData[docId] || {};
                return { ...doc, ApprovalAmt: saved.ApprovalAmt || "0.00" };
            });

            this._pDialog = this._pDialog || Fragment.load({
                name: "refunddetails.view.InvoiceDetail",
                controller: this
            }).then(dialog => {
                oView.addDependent(dialog);
                return dialog;
            });

            this._pDialog.then(dialog => {
                const invoices = this.dialogModelCache?.[`${sProjectId}_${sVendorId}`] || aMerged;

                // Set default logic if PayType is Full
                const sPayType = oSavedData.PayType || pProduct.PayType || "Full";

                if (sPayType === "Full") {
                    invoices.forEach(row => {
                        row.ApprovalAmt = parseFloat(row.DocAmt).toFixed(2);
                        row.PayMethod = "X";
                    });
                }

                const dialogData = {
                    PayType: sPayType,
                    Invoices: invoices
                };

                dialog.setModel(new JSONModel(dialogData), "dialogModel");
                dialog.open();
            });
        },
        onDialogPayTypeChange: function (oEvent) {
            const sSelected = oEvent.getSource().getSelectedKey();
            const oDialog = oEvent.getSource().getParent();
            const oDialogModel = oDialog.getModel("dialogModel");
            oDialogModel.setProperty("/PayType", sSelected);

            const aInvoices = oDialogModel.getProperty("/Invoices") || [];

            if (sSelected === "Full") {
                aInvoices.forEach(row => {
                    row.ApprovalAmt = parseFloat(row.DocAmt).toFixed(2);
                    row.FullSelected = true;
                });
                oDialogModel.setProperty("/Invoices", aInvoices);
            }
            else {
                aInvoices.forEach(row => {
                    row.ApprovalAmt = 0.00;
                });

            }
            oDialogModel.setProperty("/Invoices", aInvoices);
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

            this._checkIfAllInvoicesSelected(oModel);
        },
        _checkIfAllInvoicesSelected: function (oDialog) {
            const aInvoices = oDialog.getProperty("/Invoices") || [];

            const bAllSelected = aInvoices.every(invoice => {
                const docAmt = parseFloat(invoice.DocAmt || 0).toFixed(2);
                const approvalAmt = parseFloat(invoice.ApprovalAmt || 0).toFixed(2);
                return docAmt === approvalAmt;
            });

            if (bAllSelected) {
                oDialog.setProperty("/PayType", "Full");
            }
        },

        onCloseOrderDialog: function () {
            this._pDialog.then(oDialog => {
                const aInputs = oDialog.findElements(true).filter(c => c.isA("sap.m.Input"));
                const hasError = aInputs.some(input => input.getValueState() === "Error");

                if (hasError) {
                    MessageBox.warning("Please correct all input errors before closing.");
                    return;
                }

                const oDialogModel = oDialog.getModel("dialogModel");
                const aDetails = oDialogModel.getProperty("/Invoices") || [];
                const sPayType = oDialogModel.getProperty("/PayType") || "Full";
                const total = aDetails.reduce((sum, row) => sum + parseFloat(row.ApprovalAmt || 0), 0);
                const oVendor = this.sProduct;
                const sProjectId = this.currentProjectId;
                const sVendorId = oVendor.Lifnr;
                const oData = this.projectModel.getProperty("/VendorDetails") || {};

                if (!oData[sProjectId]) oData[sProjectId] = {};
                if (!oData[sProjectId][sVendorId]) oData[sProjectId][sVendorId] = {};

                aDetails.forEach(item => {
                    const sDocId = item.Ukey;
                    if (!oData[sProjectId][sVendorId][sDocId]) oData[sProjectId][sVendorId][sDocId] = {};
                    oData[sProjectId][sVendorId][sDocId].ApprovalAmt = item.ApprovalAmt;
                });

                oData[sProjectId][sVendorId].ApprovalAmt = total.toFixed(2);
                oData[sProjectId][sVendorId].PayType = sPayType;  

                this.projectModel.setProperty("/VendorDetails", oData);

                // Update ordersModel row PayType
                const oOrdersModel = this.getView().getModel("ordersModel");
                const oVendorContext = this.oSource1.getBindingContext("ordersModel");
                const sPath = oVendorContext.getPath();
                oOrdersModel.setProperty(sPath + "/ApprovalAmt", total.toFixed(2));
                oOrdersModel.setProperty(sPath + "/PayType", sPayType);

                oDialog.close();
            });
        },

        onNavBack: function () {
            if (this._currentLevel === "project") {
                this._setListVisibility("busComp");
                this.byId("projectList").removeSelections();
                this.byId("busCompList").removeSelections();
                this.byId("masterPage").setTitle("Company");
                this._currentLevel = "busComp";
                const oDetailPage = this.byId("detailPage"); 
                if (oDetailPage.getVisible()) {
                    oDetailPage.setVisible(false);
                }

                // this.getView().setModel(this.projectModel, "projectModel");

            } else if (this._currentLevel === "busComp") {
                this._setListVisibility("busSeg");
                this.byId("busSegList").removeSelections();
                this.byId("masterPage").setTitle("Business Segment");
                this._currentLevel = "busSeg";
            } else if (this._currentLevel === "busSeg") {
                this._setListVisibility("city");
                this.byId("cityList").removeSelections();
                this.byId("masterPage").setTitle("City");
                this._currentLevel = "city";
            }
            // else if(this._currentLevel === "city"){
            //     this._setListVisibility("city");
            //     this._currentLevel = "city";
            // }


        },
        _setListVisibility: function (level) {
            this.byId("cityList").setVisible(level === "city");
            this.byId("busSegList").setVisible(level === "busSeg");
            this.byId("busCompList").setVisible(level === "busComp");
            this.byId("projectList").setVisible(level === "project");

            const oPage = this.byId("masterPage");
            if (level === "city") {
                oPage.setShowNavButton(false);
            } else {
                oPage.setShowNavButton(true);
            }
        },

        // PAYLOAD

        onVendorSelection: function (oEvent) {
            const projectId = this.currentProjectId;
            const oTable = oEvent.getSource();
            const aSelectedItems = oTable.getSelectedItems();
            const oOrdersModel = this.getView().getModel("ordersModel");
            const allVendors = oOrdersModel.getProperty("/vendors") || [];

            const projectRef = allVendors[0];
            if (!projectRef) return;
            const {
                Zzcity, BusSeg, Bukrs, Gsber
            } = projectRef;

            const vendorPath = `/CityProjectsById/${Zzcity}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById/${Gsber}/VendorsById`;
            const vendorsById = this.projectModel.getProperty(vendorPath) || {};



            // Persist isSelected in VendorDetails
            const vendorDetails = this.projectModel.getProperty("/VendorDetails") || {};
            if (!vendorDetails[projectId]) {
                vendorDetails[projectId] = {};
            }

            Object.keys(vendorsById).forEach(vendorId => { 
                vendorsById[vendorId].isSelected = false;

                if (!vendorDetails[projectId][vendorId]) vendorDetails[projectId][vendorId] = {};
                vendorDetails[projectId][vendorId].isSelected = false;
            });



            const aSelectedVendorIds = [];
            const aSelectedData = aSelectedItems.map(oItem => {
                const oProduct = oItem.getBindingContext("ordersModel").getObject();
                const vendorId = oProduct.Lifnr;
                aSelectedVendorIds.push(vendorId);

                const oSavedOrderDetails = this.projectModel.getProperty(`/VendorDetails/${projectId}/${vendorId}`) || {};
                const aOriginalOrderDetails = oProduct.VenDet?.results || [];

                const aMergedOrderDetails = aOriginalOrderDetails.map(oOrder => {
                    const savedOrder = oSavedOrderDetails[oOrder.Ukey]; // match using Docnr
                    return {
                        ...oOrder,
                        ...(savedOrder || {})
                    };
                });

                const total = aMergedOrderDetails.reduce((sum, row) => {
                    return sum + parseFloat(row.ApprovalAmt || 0);
                }, 0);

                if (vendorsById[vendorId]) {
                    vendorsById[vendorId].ApprovalAmt = total.toFixed(2);
                    vendorsById[vendorId].isSelected = true;
                }
                vendorDetails[projectId][vendorId].isSelected = true;


                return {
                    ...oProduct,
                    Order_Details: aMergedOrderDetails
                };
            });

            const updatedVendors = allVendors.map(vendor => {
                return {
                    ...vendor,
                    isSelected: aSelectedVendorIds.includes(vendor.Lifnr)
                };
            });
            oOrdersModel.setProperty("/vendors", updatedVendors);


            this.projectModel.setProperty(vendorPath, vendorsById);
            this.projectModel.setProperty("/VendorDetails", vendorDetails);


            this.selectedOrdersModel.setProperty("/selectedProducts", aSelectedData);

            this._updateApprovalHierarchy({
                Zzcity,
                BusSeg,
                Bukrs,
                Gsber
            }, aSelectedVendorIds);
        },
        _updateApprovalHierarchy: function (projectDetails, selectedVendorIds = []) {
            const oModel = this.projectModel;

            if (!projectDetails || !projectDetails.Zzcity || !projectDetails.BusSeg || !projectDetails.Bukrs || !projectDetails.Gsber) {
                console.warn("Invalid project details for hierarchy update", projectDetails);
                return;
            }

            const { Zzcity, BusSeg, Bukrs, Gsber } = projectDetails; 
            const vendorPath = `/CityProjectsById/${Zzcity}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById/${Gsber}/VendorsById`;
            const allVendors = oModel.getProperty(vendorPath) || {};

            let totalVendor = 0;
            selectedVendorIds.forEach(vendorId => {
                const vendor = allVendors[vendorId];
                const amt = parseFloat(vendor?.ApprovalAmt || 0);
                totalVendor += isNaN(amt) ? 0 : amt;
            });

            const projectPath = vendorPath.replace("/VendorsById", "");
            oModel.setProperty(`${projectPath}/ApprovalAmt`, totalVendor.toFixed(2)); 
            const companyProjectsPath = `/CityProjectsById/${Zzcity}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById`;
            const allProjects = oModel.getProperty(companyProjectsPath) || {};

            let totalCompany = 0;
            Object.values(allProjects).forEach(proj => {
                const amt = parseFloat(proj.ApprovalAmt || 0);
                totalCompany += isNaN(amt) ? 0 : amt;
            });

            const companyPath = `/CityProjectsById/${Zzcity}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}`;
            oModel.setProperty(`${companyPath}/ApprovalAmt`, totalCompany.toFixed(2));

            // ---------------- BUSINESS SEGMENT LEVEL ----------------
            const allCompanies = oModel.getProperty(`/CityProjectsById/${Zzcity}/BusinessSegmentById/${BusSeg}/oCompanyById`) || {};

            let totalBusSeg = 0;
            Object.values(allCompanies).forEach(company => {
                const amt = parseFloat(company.ApprovalAmt || 0);
                totalBusSeg += isNaN(amt) ? 0 : amt;
            });

            const segmentPath = `/CityProjectsById/${Zzcity}/BusinessSegmentById/${BusSeg}`;
            oModel.setProperty(`${segmentPath}/ApprovalAmt`, totalBusSeg.toFixed(2)); 
            const allSegments = oModel.getProperty(`/CityProjectsById/${Zzcity}/BusinessSegmentById`) || {};

            let totalCity = 0;
            Object.values(allSegments).forEach(segment => {
                const amt = parseFloat(segment.ApprovalAmt || 0);
                totalCity += isNaN(amt) ? 0 : amt;
            });

            const cityPath = `/CityProjectsById/${Zzcity}`;
            oModel.setProperty(`${cityPath}/ApprovalAmt`, totalCity.toFixed(2)); 
            const cityList = oModel.getProperty("/CityProjectList") || [];
            cityList.forEach(city => {
                if (city.Zzcity === Zzcity) {
                    city.ApprovalAmt = totalCity.toFixed(2);
                }
            });
            oModel.setProperty("/CityProjectList", cityList); 
            const companyList = oModel.getProperty("/CompanyList") || [];
            companyList.forEach(company => {
                if (company.Bukrs === Bukrs) {
                    company.ApprovalAmt = totalCompany.toFixed(2);
                }
            });
            oModel.setProperty("/CompanyList", companyList); 
            const busSegList = oModel.getProperty("/BusinessSegmentList") || [];
            busSegList.forEach(seg => {
                if (seg.BusSeg === BusSeg) {
                    seg.ApprovalAmt = totalBusSeg.toFixed(2);
                }
            });
            oModel.setProperty("/BusinessSegmentList", busSegList);

            // 4. ProjectList
            const projectList = oModel.getProperty("/ProjectList") || [];
            projectList.forEach(proj => {
                if (proj.Gsber === Gsber) {
                    proj.ApprovalAmt = totalVendor.toFixed(2);
                }
            });
            oModel.setProperty("/ProjectList", projectList);
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
                const bHasError = aInputs.some(input => input.getValueState() === "Error");

                if (bHasError) {
                    MessageBox.warning("Please correct all input errors before submitting.");
                    return; 
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
        },

    });
});