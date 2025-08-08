sap.ui.define([
    "bcmrequest/model/models",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"

], (models, Controller, JSONModel, DateFormat, Fragment, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("bcmrequest.controller.RequestDetails", {

        onInit() {
            this.byId("masterPage").setShowNavButton(false);
            sap.ui.core.BusyIndicator.show(0);
            this.selectedVendorsModel = new JSONModel({ selectedProducts: [] });
        },

        onBeforeRendering: function () {
            this.oModel = this.getView().getModel();
            this.oModel.metadataLoaded().then(function () {
                sap.ui.core.BusyIndicator.hide();
            });
            this.projectModel = this.getOwnerComponent().getModel('zRequestModel');
            this.getView().setModel(this.projectModel, "projectModel");
        },

        onSmartFilterBarInitialized: function (oEvent) {
            const oSmartFilterBar = oEvent.getSource();
            oSmartFilterBar.setFilterData({
                DateAson: {
                    items: [],
                    ranges: [{
                        exclude: false,
                        operation: "LE",
                        keyField: "DateAson",
                        value1: new Date()
                    }]
                }
            });
        },

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
            } else if (sCategory === "D") {
                return "AdHoc Amount";
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
        formatPayIcon: function (PayMethod) {
            if (PayMethod === "Full") {
                return "sap-icon://multiselect-all";
            } else {
                return "sap-icon://multi-select";
            }
        },
        formatInvoiceIcon: function (sInvno) {
            if (sInvno === "M") {
                return "sap-icon://documents";
            }
            return "-";
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
                    oInvoice.ApprovalAmt = 0.00;
                });
            }

            oFilteredModel.setProperty("/results", aInvoices);
            oFilteredModel.checkUpdate(true);
        },
        onApprovalAmtChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sNewApprovalAmt = oInput.getValue();
            const approvalAmt = parseFloat(sNewApprovalAmt).toFixed(2);

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
            this.clearModel();
            this._currentLevel = "city";
            this.onNavBack();
            this.byId("masterPage").setTitle("City");
            this.byId("masterPage").setVisible(true);
            this.byId("cityList").setVisible(true);
            var oSmartFilterBar = this.byId("vendorFilterBar");
            this.aFilters = oSmartFilterBar.getFilters();
            this.getView().setBusy(true);

            this.oModel.read("/CityLevelSet", {
                filters: this.aFilters,
                success: (oData) => {
                    const aCities = oData.results;
                    const oCitiesById = {};
                    aCities.forEach(city => {
                        const key = city.Zzcity && city.Zzcity.trim() !== "" ? city.Zzcity : "noncity";
                        oCitiesById[key] = city;
                    });                    
                    this.projectModel.setProperty("/CityProjectsById", oCitiesById);
                    this.projectModel.setProperty("/CityProjectList", aCities);
                    this.byId("fallbackPage").setVisible(false);
                    this.byId("splitContainer").setVisible(true);
                    const oDetailPage = this.byId("detailPage");
                    oDetailPage.setVisible(false);
                    this.getView().setBusy(false);
                },
                error: (oError) => {
                    this.getView().setBusy(false);
                    MessageToast.show("Error while fetching city data");
                    console.error("OData read failed", oError);
                }
            });
        },

        onCitySelect: function (oEvent) {
            let city = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject().Zzcity;
            const normalizedCityKey = city && city.trim() !== "" ? city : "noncity";
            this._currentLevel = "busSeg";
            this.byId("masterPage").setShowNavButton(true);
            this.byId("masterPage").setTitle("Business Segment");

            this.projectModel.setProperty("/BusinessSegmentList", []);
            this.byId("cityList").setVisible(false);
            this.byId("busSegList").setVisible(true); 
            const cachedSegments = this.projectModel.getProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById`);
            if (cachedSegments && Object.keys(cachedSegments).length) {
                const aBisSeg = Object.values(cachedSegments);
                this.projectModel.setProperty("/BusinessSegmentList", aBisSeg);
                this.byId("cityList").removeSelections();
                return;
            }
            this.getView().setBusy(true);
            const encodedCity = encodeURIComponent(city|| "");
            this.oModel.read(`/CityLevelSet('${encodedCity}')/CityBus`, {
                filters: this.aFilters,
                success: (oData) => {
                    const aBisSeg = oData.results;
                    const oBisSegById = {};
                    aBisSeg.forEach(seg => {
                        oBisSegById[seg.BusSeg] = seg;
                    });                    
                    this.projectModel.setProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById`, oBisSegById);
                    this.projectModel.setProperty("/BusinessSegmentList", aBisSeg);
                    this.getView().setBusy(false);
                },
                error: (oError) => {
                    this.getView().setBusy(false);
                    MessageToast.show("Error while fetching business segments");
                    console.error("OData read failed", oError);
                }
            });
            this.byId("cityList").removeSelections();

        },
        onBusSegSelect: function (oEvent) {
            const context = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject();
            const city = context.Zzcity;
            const normalizedCityKey = city && city.trim() !== "" ? city : "noncity";
            const busSeg = context.BusSeg;
            this._currentLevel = "busComp";
            this.byId("masterPage").setTitle("Company");
            this.projectModel.setProperty("/CompanyList", []);
            this.byId("busSegList").setVisible(false);
            this.byId("busCompList").setVisible(true);
            this.byId("busSegList").removeSelections();
            const cachePath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${busSeg}/oCompanyById`;
            const cachedCompanies = this.projectModel.getProperty(cachePath);
            if (cachedCompanies && Object.keys(cachedCompanies).length) {
                this.projectModel.setProperty("/CompanyList", Object.values(cachedCompanies));
                return;
            }
            this.getView().setBusy(true);
            const encodedCity = encodeURIComponent(city);
            const encodedBusSeg = encodeURIComponent(busSeg);
            this.oModel.read(`/BusSegLevelSet(Zzcity='${encodedCity}',BusSeg='${encodedBusSeg}')/BusComp`, {
                filters: this.aFilters,
                success: (oData) => {
                    const aCompany = oData.results;
                    const oCompanyById = {};
                    aCompany.forEach(company => {
                        oCompanyById[company.Bukrs] = company;
                    });                    
                    this.projectModel.setProperty(cachePath, oCompanyById);
                    this.projectModel.setProperty("/CompanyList", aCompany);
                    this.getView().setBusy(false);
                },
                error: (oError) => {
                    this.getView().setBusy(false);
                    MessageToast.show("Error while fetching Companies");
                    console.error("OData read failed", oError);
                }
            });
            this.byId("busSegList").removeSelections();

        },
        onBusCompSelect: function (oEvent) {
            const context = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject();
            const city = context.Zzcity;
            const normalizedCityKey = city && city.trim() !== "" ? city : "noncity";

            const busSeg = context.BusSeg;
            const bukrs = context.Bukrs;
            if (!bukrs || bukrs.trim() === "") {
                MessageToast.show("Company not found");
                return;
            }
            this._currentLevel = "project";
            this.projectModel.setProperty("/ProjectList", []);
            this.byId("busCompList").setVisible(false);
            this.byId("projectList").setVisible(true);
            this.byId("masterPage").setTitle("Project"); 
            const cachedProjects = this.projectModel.getProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${busSeg}/oCompanyById/${bukrs}/ProjectsById`);
            if (cachedProjects && Object.keys(cachedProjects).length) {
                const aProject = Object.values(cachedProjects);
                this.projectModel.setProperty("/ProjectList", aProject);
                this.byId("busCompList").removeSelections();

                return;
            }
            this.getView().setBusy(true);
            const encodedCity = encodeURIComponent(city);
            const encodedBusSeg = encodeURIComponent(busSeg);
            this.oModel.read(`/CompanyLevelSet(Zzcity='${encodedCity}',BusSeg='${encodedBusSeg}',Bukrs='${bukrs}')/CompProj`, {
                filters: this.aFilters,
                success: (oData) => {
                    const aProjects = oData.results;
                    const oProjectsById = Object.fromEntries(aProjects.map(project => [project.Gsber, project]));
                    this.projectModel.setProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${busSeg}/oCompanyById/${bukrs}/ProjectsById`, oProjectsById);
                    this.projectModel.setProperty("/ProjectList", aProjects);
                    this.getView().setBusy(false);
                },
                error: (oError) => {
                    this.getView().setBusy(false);
                    MessageToast.show("Error while fetching projects");
                    console.error("OData read failed", oError);
                }
            });
            this.byId("busCompList").removeSelections();

        },
        onProjectPress: function (oEvent) {
            var that = this;
            const context = oEvent.getSource().getSelectedItem().getBindingContext("projectModel").getObject();
            const { Zzcity: city, BusSeg: busSeg, Bukrs: bukrs, Gsber: gsber } = context;
            const normalizedCityKey = city && city.trim() !== "" ? city : "noncity";
            if (!gsber || gsber.trim() === "") {
                MessageToast.show("Project not found");
                return;
            }
            if (this.getView().getModel("ordersModel")) {
                this.getView().getModel("ordersModel").setProperty("/vendors", []);
                this.getView().getModel("ordersModel").updateBindings(true)
                this.byId("vendorsTable").getBinding("items").refresh();;

                this.byId("vendorsTable").getBinding("items").refresh();
            }
            const encodedCity = encodeURIComponent(city);
            const encodedBusSeg = encodeURIComponent(busSeg);
            const sPath = `/ProjLevelSet(Zzcity='${encodedCity}',BusSeg='${encodedBusSeg}',Bukrs='${bukrs}',Gsber='${gsber}')/ProjVen`;
            const vendorPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${busSeg}/oCompanyById/${bukrs}/ProjectsById/${gsber}/VendorsById`;
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
                this.byId("projectList").removeSelections();
            } else {
                this.getView().setBusy(true);
                this.getView().getModel().read(sPath, {
                    urlParameters: {
                        "$expand": "VenDet"
                    },
                    success: (oData) => {
                        this.getView().setBusy(false);
                        const aVendors = oData.results;
                        const oVendorsById = {};
                        aVendors.forEach(vendor => {
                            oVendorsById[vendor.Lifnr] = vendor;
                        });
                        this.projectModel.setProperty(vendorPath, oVendorsById);
                        this._loadVendorDetails(gsber, vendorPath);
                    },
                    error: (oError) => {
                        this.getView().setBusy(false);
                        MessageToast.show("Error while fetching Projects");
                        console.error("Error fetching vendors", oError);
                    }
                });
            }
            this.byId("projectList").removeSelections();
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
                merged.isSelected = saved.isSelected || false;
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
            const oOrdersModel = this.getView().getModel("ordersModel");
            const sField = oSource.getCustomData().find(d => d.getKey() === "field")?.getValue();
            const sProjectId = this.currentProjectId;
            if (!sField || !sProjectId) return;
            const oContext = oSource.getBindingContext("dialogModel") || oSource.getBindingContext("ordersModel");
            const oRowData = oContext?.getObject();
            const sVendorId = oRowData?.Lifnr;
            const sOrderId = oRowData?.Ukey;
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
                oRowData.ApprovalAmt = vValue;
                // SCENARIO 2: Update vendor-level ApprovalAmt
                const oDialogModel = oContext.getModel("dialogModel");
                const aDetails = oDialogModel.getData();
                const total = parseFloat(
                    (aDetails.Invoices || []).reduce((sum, row) => {
                        return sum + (parseFloat(row.ApprovalAmt) || 0);
                    }, 0).toFixed(2)
                );


                const aOrders = oOrdersModel.getProperty("/vendors");
                const oVendorOrder = aOrders.find(row => row.Lifnr === sVendorId);
                if (oVendorOrder) {
                    oVendorOrder.ApprovalAmt = total.toFixed(2);
                    oSavedData.ApprovalAmt = total.toFixed(2);
                    oSavedData.PayType = oOrdersModel.PayType;
                    oDialogModel.setProperty("/ApprovalAmount", total.toFixed(2));
                }
                this._checkIfAllInvoicesSelected(oDialogModel);

            } else {
                // ----------- Vendor Table Input Change ------------
                let sTotalAmt, oVenDet;

                if (sField === "ApprovalAmount") {
                    sTotalAmt = this.vendorData.TotalAmt;
                    oVenDet = this.vendorData.VenDet;
                } else {
                    sTotalAmt = parseFloat(oRowData?.TotalAmt || 0);
                    oVenDet = oRowData?.VenDet;
                }

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
                const approvalAmount = parseFloat(vValue || 0);
                let remaining = approvalAmount;
                const sortedDetails = oVenDet.results?.slice() || [];
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

                if (sField == "ApprovalAmount") {
                    const dialogModel = this.dialog.getModel("dialogModel");
                    dialogModel.setProperty("/Invoices", aMerged);
                }

                // const oSavedData = this.projectModel.getProperty(`/VendorDetails/${sProjectId}/${sVendorId}`) || {};

                // ------- PayType auto-detection -------

                const oOrdersModel = this.getView().getModel("ordersModel");
                const oVendorContext = oSource.getBindingContext("ordersModel");
                const sPath = oVendorContext.getPath();

                const totalAmt = sTotalAmt;
                const enteredAmt = vValue;
                let sPayType = "Partial";

                if (Math.abs(enteredAmt - totalAmt) < 0.01) {
                    sPayType = "Full";
                }

                oOrdersModel.setProperty(sPath + "/PayType", sPayType);
                oSavedData.PayType = sPayType;

            }
            this.projectModel.setProperty("/VendorDetails", oData);
        },
        onPayMethodPress: function (oEvent) {
            this.oSource1 = oEvent.getSource();
            const oSource = oEvent.getSource();
            const oContext = oSource.getBindingContext("ordersModel");
            this.Context = oContext;
            const oRowData = oContext?.getObject();
            this.vendorData = oRowData;

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
                return { ...doc, ApprovalAmt: saved.ApprovalAmt || 0.00 };
            });

            this._pDialog = this._pDialog || Fragment.load({
                name: "bcmrequest.view.InvoiceDetail",
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
                    Invoices: invoices,
                    TotalAmount: sTotalAmt,
                    ApprovalAmount: approvalAmt
                };

                dialog.setModel(new JSONModel(dialogData), "dialogModel");
                dialog.open();
                this.dialog = dialog;
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

                oDialogModel.setProperty("/ApprovalAmount", this.vendorData.TotalAmt);
                oDialogModel.setProperty("/Invoices", aInvoices);
            }
            else {
                aInvoices.forEach(row => {
                    row.ApprovalAmt = parseFloat(0).toFixed(2);
                });
                oDialogModel.setProperty("/ApprovalAmount", parseFloat(0).toFixed(2));
            }
            oDialogModel.setProperty("/Invoices", aInvoices);
        },
        onFullPaymentSelected: function (oEvent) {
            const bSelected = oEvent.getParameter("selected");
            const oContext = oEvent.getSource().getBindingContext("dialogModel");
            const oDialogModel = oContext.getModel("dialogModel");
            const aDetails = oDialogModel.getData();

            const record = oContext.getObject();
            if (bSelected) {
                record.ApprovalAmt = record.DocAmt;
                record.PayMethod = "X";
            } else {
                record.ApprovalAmt = parseFloat(0).toFixed(2);
                record.PayMethod = "";
            }
            const total = parseFloat(
                (aDetails.Invoices || []).reduce((sum, row) => {
                    return sum + (parseFloat(row.ApprovalAmt) || 0);
                }, 0).toFixed(2)
            );

            oDialogModel.setProperty("/ApprovalAmount", total);


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
        onCancelOrderDialog: function () {
            this._pDialog.then(oDialog => {
                const oVendor = this.sProduct;
                const sProjectId = this.currentProjectId;
                const sVendorId = oVendor.Lifnr;

                // Get previously saved data
                const oSavedData = this.projectModel.getProperty(`/VendorDetails/${sProjectId}/${sVendorId}`) || {};
                const aDetails = oVendor?.VenDet?.results || [];

                // Rebuild dialog model data with only saved values
                const aMerged = aDetails.map(doc => {
                    const saved = oSavedData[doc.Ukey] || {};
                    return {
                        ...doc,
                        ApprovalAmt: saved.ApprovalAmt || 0.00
                    };
                });

                const sPayType = oSavedData.PayType || "Partial";

                const oDialogModel = oDialog.getModel("dialogModel");
                oDialogModel.setProperty("/Invoices", aMerged);
                oDialogModel.setProperty("/PayType", sPayType);

                // Close dialog
                oDialog.close();
            });
            return;
        },

        onNavBack: function () {
            if (this._currentLevel === "project") {
                this._setListVisibility("busComp");
                this.byId("masterPage").setTitle("Company");
                this._currentLevel = "busComp";
                const oDetailPage = this.byId("detailPage");
                if (oDetailPage.getVisible()) {
                    oDetailPage.setVisible(false);
                }

                // this.getView().setModel(this.projectModel, "projectModel");

            } else if (this._currentLevel === "busComp") {
                this._setListVisibility("busSeg");
                this.byId("masterPage").setTitle("Business Segment");
                this._currentLevel = "busSeg";
            } else if (this._currentLevel === "busSeg") {
                this._setListVisibility("city");
                this.byId("masterPage").setTitle("City");
                this._currentLevel = "city";
            }
            else if (this._currentLevel === "city") {
                this._setListVisibility("city");
                this.byId("masterPage").setTitle("City");
            }


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
            const normalizedCityKey = Zzcity && Zzcity.trim() !== "" ? Zzcity : "noncity";


            const vendorPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById/${Gsber}/VendorsById`;
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
            const mSelectedData = {};

            aSelectedItems.forEach(oItem => {
                const oProduct = oItem.getBindingContext("ordersModel").getObject();
                const vendorId = oProduct.Lifnr;
                aSelectedVendorIds.push(vendorId);

                const oSavedOrderDetails = this.projectModel.getProperty(`/VendorDetails/${projectId}/${vendorId}`) || {};
                const aOriginalOrderDetails = oProduct.VenDet?.results || [];

                const aMergedOrderDetails = aOriginalOrderDetails.map(oOrder => {
                    const savedOrder = oSavedOrderDetails[oOrder.Ukey]; // or Docnr
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

                mSelectedData[vendorId] = {
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


            const existingSelectedData = this.selectedVendorsModel.getProperty("/selectedProducts") || {};
            // Remove deselected vendors from current project
            Object.keys(existingSelectedData).forEach(lifnr => {
                if (!aSelectedVendorIds.includes(lifnr) && existingSelectedData[lifnr].Gsber === Gsber) {
                    delete existingSelectedData[lifnr];
                }
            });

            // Merge: keep previous selections + update current
            const mergedSelectedData = {
                ...existingSelectedData,
                ...mSelectedData
            };

            this.selectedVendorsModel.setProperty("/selectedProducts", mergedSelectedData);

            this._updateApprovalHierarchy({
                normalizedCityKey,
                BusSeg,
                Bukrs,
                Gsber
            }, aSelectedVendorIds);
        },
        _updateApprovalHierarchy: function (projectDetails, selectedVendorIds = []) {
            const oModel = this.projectModel;

            if (!projectDetails || !projectDetails.normalizedCityKey || !projectDetails.BusSeg || !projectDetails.Bukrs || !projectDetails.Gsber) {
                console.warn("Invalid project details for hierarchy update", projectDetails);
                return;
            }

            const { normalizedCityKey, BusSeg, Bukrs, Gsber } = projectDetails;
            const vendorPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById/${Gsber}/VendorsById`;
            const allVendors = oModel.getProperty(vendorPath) || {};

            let totalVendor = 0;
            selectedVendorIds.forEach(vendorId => {
                const vendor = allVendors[vendorId];
                const amt = parseFloat(vendor?.ApprovalAmt || 0);
                totalVendor += isNaN(amt) ? 0 : amt;
            });

            const projectPath = vendorPath.replace("/VendorsById", "");
            oModel.setProperty(`${projectPath}/ApprovalAmt`, totalVendor.toFixed(2));
            const companyProjectsPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById`;
            const allProjects = oModel.getProperty(companyProjectsPath) || {};

            let totalCompany = 0;
            Object.values(allProjects).forEach(proj => {
                const amt = parseFloat(proj.ApprovalAmt || 0);
                totalCompany += isNaN(amt) ? 0 : amt;
            });

            const companyPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}`;
            oModel.setProperty(`${companyPath}/ApprovalAmt`, totalCompany.toFixed(2));

            // ---------------- BUSINESS SEGMENT LEVEL ----------------
            const allCompanies = oModel.getProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById`) || {};

            let totalBusSeg = 0;
            Object.values(allCompanies).forEach(company => {
                const amt = parseFloat(company.ApprovalAmt || 0);
                totalBusSeg += isNaN(amt) ? 0 : amt;
            });

            const segmentPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}`;
            oModel.setProperty(`${segmentPath}/ApprovalAmt`, totalBusSeg.toFixed(2));
            const allSegments = oModel.getProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById`) || {};

            let totalCity = 0;
            Object.values(allSegments).forEach(segment => {
                const amt = parseFloat(segment.ApprovalAmt || 0);
                totalCity += isNaN(amt) ? 0 : amt;
            });

            const cityPath = `/CityProjectsById/${normalizedCityKey}`;
            oModel.setProperty(`${cityPath}/ApprovalAmt`, totalCity.toFixed(2));
            const cityList = oModel.getProperty("/CityProjectList") || [];
            cityList.forEach(city => {
                if (city.Zzcity === normalizedCityKey) {
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
            const oView = this.getView();

            const sSelectedKey = this.projectModel.getProperty("/SelectedKey");

            const formatToODataDate = function (dateString) {
                const oDate = new Date(dateString);
                return `/Date(${oDate.getTime()})/`;
            };

            if (sSelectedKey === "Customers") {

            }
            else if (sSelectedKey === "Vendors") {
                const aVenReq = [];
                const oVendorData = this.selectedVendorsModel.getProperty("/selectedProducts");

                if (!oVendorData || Object.keys(oVendorData).length === 0) {
                    MessageToast.show("Please select at least one vendor record.");
                    return;
                }

                Object.values(oVendorData).forEach(oVendor => {
                    // if (!oVendor.isSelected) return;  
                    const aInvoices = oVendor.Order_Details || [];
                    aInvoices.forEach(function (invoice) {
                        if (parseFloat(invoice.ApprovalAmt) !== 0) {
                            aVenReq.push({
                                "Lifnr": invoice.Lifnr,
                                "Gsber": invoice.Gsber,
                                "Category": invoice.Category,
                                "Docnr": invoice.Docnr,
                                "Bukrs": invoice.Bukrs,
                                "Gjahr": invoice.Gjahr,
                                "Budat": invoice.Budat,
                                "DocAmt": invoice.DocAmt,
                                "PayMethod": parseFloat(invoice.DocAmt) === parseFloat(invoice.ApprovalAmt) ? "X" : "",
                                "ApprovalAmt": invoice.ApprovalAmt,
                                "Project": invoice.Project || "",
                                "ProjectName": invoice.ProjectName || "",
                                "RequestNo": "",
                                "Zzcity": invoice.Zzcity,
                                "BusSeg": invoice.BusSeg,
                                "Buzei": invoice.Buzei,
                            });
                        }
                    });
                });

                oView.setBusy(true);

                const oPayload = {
                    RequestNo: "",
                    VenReq: aVenReq
                };

                this.oModel.create("/VendorReqSet", oPayload, {
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
            const sSelectedKey = this.projectModel.getProperty("/SelectedKey");
            this.byId("cityList").removeSelections();
            this.byId("projectList").setVisible(false);
            this._currentLevel = "city";

            // var oSmartFilterBar;
            if (sSelectedKey === "Customers") {                

            } else if (sSelectedKey === "Vendors") {
                MessageToast.show("Refreshed!");

                this.byId("fallbackPage").setVisible(true);
                this.byId("splitContainer").setVisible(false);

                this.clearModel();

            }
            // var oFilterData = oSmartFilterBar.getFilterData();
            // var oPreservedDate = oFilterData.DateAson;
            // var oPreservedPaval = oFilterData.Paval;
            // oSmartFilterBar.clear();
            // oSmartFilterBar.setFilterData({
            //     DateAson: oPreservedDate,
            //     Paval: oPreservedPaval
            // });
            // oSmartFilterBar.search();
        },
        clearModel: function () {
            this.selectedVendorsModel.setData({});
            this.projectModel.setProperty("/VendorDetails", {});
            this.projectModel.setProperty("/CustomerDetails", {});
            this.projectModel.setProperty("/BusinessSegmentList", []);
            this.projectModel.setProperty("/CityProjectList", []);
            this.projectModel.setProperty("/CompanyList", []);
            this.projectModel.setProperty("/ProjectList", []);
            this.projectModel.setProperty("/SelectedKey", "Vendors");
            if (this.getView().getModel("ordersModel")) {
                this.getView().getModel("ordersModel").setProperty("/vendors", []);

                this.getView().getModel("ordersModel").updateBindings(true)
                this.byId("vendorsTable").getBinding("items").refresh();;
                this.byId("vendorsTable").getBinding("items").refresh();
            }
            this.getView().getModel("projectModel").updateBindings(true);
            this.byId("cityList").getBinding("items").refresh();
            this.byId("busSegList").getBinding("items").refresh();
            this.byId("busCompList").getBinding("items").refresh();
            this.byId("projectList").getBinding("items").refresh();


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