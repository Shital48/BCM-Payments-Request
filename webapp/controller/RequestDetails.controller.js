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
            const encodedCity = encodeURIComponent(city || "");
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
                this.VendorsObj = this.projectModel.getProperty(vendorPath);

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
                        //NOW oVendorsById CONTAINS ALL VENDOR DETAILS ALONG WITH INVOICES IN VENDET
                        //SAVED THAT DATA TO const vendorPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${busSeg}/oCompanyById/${bukrs}/ProjectsById/${gsber}/VendorsById`;

                        this.projectModel.setProperty(vendorPath, oVendorsById);
                        // this._loadVendorDetails(gsber, vendorPath);

                        const oVendors = this.projectModel.getProperty(vendorPath) || {};
                        const aOrders = Object.values(oVendors);
                        this.getView().setModel(
                            new sap.ui.model.json.JSONModel({ vendors: aOrders }),
                            "ordersModel"
                        );
                        this.VendorsObj = this.projectModel.getProperty(vendorPath);

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
            const aOrders = Object.values(oVendors);

            //oVendors CONTAINS ALL DATA SAME AS ABOVE SAVED AT ./././VendorsById
            // const vendorDetails = this.projectModel.getProperty("/VendorDetails") || {};
            // const aOrders = Object.values(oVendors).map(vendor => {
            //     const sVendorId = vendor.Lifnr;
            //     const saved = vendorDetails[projectId]?.[sVendorId] || {};
            //     const merged = { ...vendor, ...saved };
            //     merged.ApprovalAmt = parseFloat(merged.ApprovalAmt || vendor.ApprovalAmt).toFixed(2);
            //     merged.PayType = saved.PayType || vendor.PayType || "Full";
            //     merged.isSelected = saved.isSelected || false; 
            //     return merged;
            // });

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
                else {
                    //TRY
                    const vendorId = oRowData.Lifnr;
                    this.VendorsObj[vendorId].VenDet.results = aMerged;

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
            const aInvoices = oRowData?.Invoices || oRowData?.VenDet?.results || [];
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
             this._pDialog = this._pDialog || Fragment.load({
                name: "bcmrequest.view.InvoiceDetail",
                controller: this
            }).then(dialog => {
                oView.addDependent(dialog);
                return dialog;
            });

            this._pDialog.then(dialog => {
                const dialogData = {
                    PayType: oRowData.PayType,
                    Invoices: aInvoices,
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
                // const oVendor = this.vendorData.Lifnr;
                // const sProjectId = this.currentProjectId;
                // const sVendorId = oVendor.Lifnr;
                // const oData = this.projectModel.getProperty("/VendorDetails") || {};

                // if (!oData[sProjectId]) oData[sProjectId] = {};
                // if (!oData[sProjectId][sVendorId]) oData[sProjectId][sVendorId] = {};

                // aDetails.forEach(item => {
                //     const sDocId = item.Ukey;
                //     if (!oData[sProjectId][sVendorId][sDocId]) oData[sProjectId][sVendorId][sDocId] = {};
                //     oData[sProjectId][sVendorId][sDocId].ApprovalAmt = item.ApprovalAmt;
                // });

                // oData[sProjectId][sVendorId].ApprovalAmt = total.toFixed(2);
                // oData[sProjectId][sVendorId].PayType = sPayType;

                // this.projectModel.setProperty("/VendorDetails", oData);

                // Update ordersModel row PayType
                const oOrdersModel = this.getView().getModel("ordersModel");
                const oVendorContext = this.oSource1.getBindingContext("ordersModel");
                const sPath = oVendorContext.getPath();
                oOrdersModel.setProperty(sPath + "/ApprovalAmt", total.toFixed(2));
                oOrdersModel.setProperty(sPath + "/PayType", sPayType);
                oOrdersModel.setProperty(sPath + "/Invoices", aDetails);

                oDialog.close();
            });
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
            const oTable = oEvent.getSource();
            const aSelectedItems = oTable.getSelectedItems();
            const oOrdersModel = this.getView().getModel("ordersModel");
            const allVendors = oOrdersModel.getProperty("/vendors") || [];

            if (!allVendors.length) return;

            const { Zzcity, BusSeg, Bukrs, Gsber } = allVendors[0];
            const normalizedCityKey = Zzcity && Zzcity.trim() !== "" ? Zzcity : "noncity";

            const selectedVendors = aSelectedItems.map(oItem => {
                const oProduct = oItem.getBindingContext("ordersModel").getObject();
                return this.VendorsObj[oProduct.Lifnr];
            });

            this.selectedVendorsModel.setProperty("/selectedProducts", selectedVendors);

            const total = selectedVendors.reduce((sum, vendor) => {
                const amt = parseFloat(vendor.ApprovalAmt || 0);
                return sum + (isNaN(amt) ? 0 : amt);
            }, 0);

            this._updateApprovalHierarchy(
                { normalizedCityKey, BusSeg, Bukrs, Gsber },
                total
            );
        },

        _updateApprovalHierarchy: function (projectDetails, approvalAmtTotal) {
            const oModel = this.projectModel;

            if (!projectDetails?.normalizedCityKey || !projectDetails.BusSeg || !projectDetails.Bukrs || !projectDetails.Gsber) {
                console.warn("Invalid project details for hierarchy update", projectDetails);
                return;
            }

            const { normalizedCityKey, BusSeg, Bukrs, Gsber } = projectDetails;

            const sumApproval = (list) =>
                Object.values(list || {}).reduce((sum, item) => {
                    const amt = parseFloat(item.ApprovalAmt || 0);
                    return sum + (isNaN(amt) ? 0 : amt);
                }, 0);

            // 1. Project level
            const vendorPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById/${Gsber}`;
            oModel.setProperty(`${vendorPath}/ApprovalAmt`, approvalAmtTotal);

            // 2. Company level
            const companyProjectsPath = `/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ProjectsById`;
            const totalCompany = sumApproval(oModel.getProperty(companyProjectsPath));
            oModel.setProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById/${Bukrs}/ApprovalAmt`, totalCompany.toFixed(2));

            // 3. Business Segment level
            const totalBusSeg = sumApproval(oModel.getProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/oCompanyById`));
            oModel.setProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById/${BusSeg}/ApprovalAmt`, totalBusSeg.toFixed(2));

            // 4. City level
            const totalCity = sumApproval(oModel.getProperty(`/CityProjectsById/${normalizedCityKey}/BusinessSegmentById`));
            oModel.setProperty(`/CityProjectsById/${normalizedCityKey}/ApprovalAmt`, totalCity.toFixed(2));

            const updateList = (path, key, value) => {
                const list = oModel.getProperty(path) || [];
                list.forEach(item => {
                    if (item[key] === value.id) {
                        item.ApprovalAmt = value.amount;
                    }
                });
                oModel.setProperty(path, list);
            };

            updateList("/CityProjectList", "Zzcity", { id: normalizedCityKey, amount: totalCity.toFixed(2) });
            updateList("/CompanyList", "Bukrs", { id: Bukrs, amount: totalCompany.toFixed(2) });
            updateList("/BusinessSegmentList", "BusSeg", { id: BusSeg, amount: totalBusSeg.toFixed(2) });
            updateList("/ProjectList", "Gsber", { id: Gsber, amount: approvalAmtTotal });
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