sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "refunddetails/model/valuehelp",
    "sap/ui/comp/filterbar/FilterBar"
],
    function (Controller, valuehelp, FilterBar) {
        "use strict";

        return Controller.extend("refunddetails.Base", {

            onBusinessSegmentHelp: async function (oEvent) {
                var othis = this;
                if (!this._valueHelpDialogSegment) {
                    this._valueHelpDialogSegment = await valuehelp.createValueHelp({
                        title: "Business Segment",
                        model: this.getView().getModel(),
                        multiSelect: false,
                        keyField: "Bukrs",
                        keyDescField: "Paval",
                        basePath: "/BusinessSegmentSet",
                        preFilters: [],
                        aBindingFilter: [],
                        columns: [
                            {
                                label: "Bukrs",
                                path: 'Bukrs',
                                filterable: true
                            },
                            {
                                label: "Paval",
                                path: 'Paval',
                                filterable: true
                            }
                        ],
                        ok: function (oEvt) {

                            othis.mdl_zFilter.getData().Create.Segment = oEvt.Bukrs;
                            othis.mdl_zFilter.updateBindings();
                        }
                    });
                    this.getView().addDependent(this._valueHelpDialog);
                }

                this._valueHelpDialogSegment.setBasicSearchText('');
                this._valueHelpDialogSegment.open();
                var oFilterBar = this._valueHelpDialogSegment.getFilterBar();
                if (oFilterBar) {
                    var aFilterGroupItems = oFilterBar.getFilterGroupItems();
                    for (var i = 0; i < aFilterGroupItems.length; i++) {
                        var oFilterField = aFilterGroupItems[i].getControl();
                        if (oFilterField && oFilterField.setConditions) {
                            oFilterField.setConditions([]);
                        }
                    }
                }
                var oTable = this._valueHelpDialogSegment.getTable();
                if (oTable.getBinding('rows')) {
                    oTable.getBinding('rows').filter([]);
                    if (oTable.getBinding('rows').mParameters.custom &&
                        oTable.getBinding('rows').mParameters.custom.search) {
                        oTable.getBinding('rows').mParameters.custom.search = "";
                        oTable.getBinding('rows').sCustomParams = "";
                    }
                    oTable.getBinding('rows').refresh(true);
                }
            },

            onCompanyCodeHelp: async function (oEvent) {
                var othis = this;
                if (!this._valueHelpDialogCompany) {
                    this._valueHelpDialogCompany = await valuehelp.createValueHelp({
                        title: "Company Code",
                        model: this.getView().getModel(),
                        multiSelect: false,
                        keyField: "Bukrs",
                        keyDescField: "Ort01",
                        basePath: "/CompanyCodeSet",
                        preFilters: [],
                        aBindingFilter: [],
                        columns: [
                            {
                                label: "Ort01",
                                path: 'Ort01',
                                filterable: true
                            },
                            {
                                label: "Butxt",
                                path: 'Butxt',
                                filterable: true
                            }
                        ],
                        ok: function (oEvt) {

                            othis.mdl_zFilter.getData().Create.Company = oEvt.Ort01;
                            othis.mdl_zFilter.updateBindings();
                        }
                    });
                    this.getView().addDependent(this._valueHelpDialog);
                }

                this._valueHelpDialogCompany.setBasicSearchText('');
                this._valueHelpDialogCompany.open();
                var oFilterBar = this._valueHelpDialogCompany.getFilterBar();
                if (oFilterBar) {
                    var aFilterGroupItems = oFilterBar.getFilterGroupItems();
                    for (var i = 0; i < aFilterGroupItems.length; i++) {
                        var oFilterField = aFilterGroupItems[i].getControl();
                        if (oFilterField && oFilterField.setConditions) {
                            oFilterField.setConditions([]);
                        }
                    }
                }
                var oTable = this._valueHelpDialogCompany.getTable();
                if (oTable.getBinding('rows')) {
                    oTable.getBinding('rows').filter([]);
                    if (oTable.getBinding('rows').mParameters.custom &&
                        oTable.getBinding('rows').mParameters.custom.search) {
                        oTable.getBinding('rows').mParameters.custom.search = "";
                        oTable.getBinding('rows').sCustomParams = "";
                    }
                    oTable.getBinding('rows').refresh(true);
                }
            },

            onProjectHelp: async function (oEvent) {
                var othis = this;
                if (!this._valueHelpDialogProject) {
                    this._valueHelpDialogProject = await valuehelp.createValueHelp({
                        title: "Project",
                        model: this.getView().getModel(),
                        multiSelect: false,
                        keyField: "Pspid",
                        keyDescField: "Post1",
                        basePath: "/ProjectSet",
                        preFilters: [],
                        aBindingFilter: [],
                        columns: [
                            {
                                label: "Pspid",
                                path: 'Pspid',
                                filterable: true
                            },
                            {
                                label: "Post1",
                                path: 'Post1',
                                filterable: true
                            }
                        ],
                        ok: function (oEvt) {

                            othis.mdl_zFilter.getData().Create.Project = oEvt.Post1;
                            othis.mdl_zFilter.updateBindings();
                        }
                    });
                    this.getView().addDependent(this._valueHelpDialog);
                }

                this._valueHelpDialogProject.setBasicSearchText('');
                this._valueHelpDialogProject.open();
                var oFilterBar = this._valueHelpDialogProject.getFilterBar();
                if (oFilterBar) {
                    var aFilterGroupItems = oFilterBar.getFilterGroupItems();
                    for (var i = 0; i < aFilterGroupItems.length; i++) {
                        var oFilterField = aFilterGroupItems[i].getControl();
                        if (oFilterField && oFilterField.setConditions) {
                            oFilterField.setConditions([]);
                        }
                    }
                }
                var oTable = this._valueHelpDialogProject.getTable();
                if (oTable.getBinding('rows')) {
                    oTable.getBinding('rows').filter([]);
                    if (oTable.getBinding('rows').mParameters.custom &&
                        oTable.getBinding('rows').mParameters.custom.search) {
                        oTable.getBinding('rows').mParameters.custom.search = "";
                        oTable.getBinding('rows').sCustomParams = "";
                    }
                    oTable.getBinding('rows').refresh(true);
                }
            },

            onVendorHelp: async function (oEvent) {
                var othis = this;
                if (!this._valueHelpDialogVendor) {
                    this._valueHelpDialogVendor = await valuehelp.createValueHelp({
                        title: "Vendor",
                        model: this.getView().getModel(),
                        multiSelect: false,
                        keyField: "Lifnr",
                        keyDescField: "Pstlz",
                        basePath: "/VendorRefundSet",
                        preFilters: [],
                        aBindingFilter: [],
                        columns: [
                            {
                                label: "Lifnr",
                                path: 'Lifnr',
                                filterable: true
                            },
                            {
                                label: "Pstlz",
                                path: 'Pstlz',
                                filterable: true
                            },
                            {
                                label: "Ort01",
                                path: 'Ort01',
                                filterable: true
                            }
                        ],
                        ok: function (oEvt) {

                            othis.mdl_zFilter.getData().Create.Vendor = oEvt.Ort01;
                            othis.mdl_zFilter.updateBindings();
                        }
                    });
                    this.getView().addDependent(this._valueHelpDialog);
                }

                this._valueHelpDialogVendor.setBasicSearchText('');
                this._valueHelpDialogVendor.open();
                var oFilterBar = this._valueHelpDialogVendor.getFilterBar();
                if (oFilterBar) {
                    var aFilterGroupItems = oFilterBar.getFilterGroupItems();
                    for (var i = 0; i < aFilterGroupItems.length; i++) {
                        var oFilterField = aFilterGroupItems[i].getControl();
                        if (oFilterField && oFilterField.setConditions) {
                            oFilterField.setConditions([]);
                        }
                    }
                }
                var oTable = this._valueHelpDialogVendor.getTable();
                if (oTable.getBinding('rows')) {
                    oTable.getBinding('rows').filter([]);
                    if (oTable.getBinding('rows').mParameters.custom &&
                        oTable.getBinding('rows').mParameters.custom.search) {
                        oTable.getBinding('rows').mParameters.custom.search = "";
                        oTable.getBinding('rows').sCustomParams = "";
                    }
                    oTable.getBinding('rows').refresh(true);
                }
            },

            onCustomerHelp: async function (oEvent) {
                var othis = this;
                if (!this._valueHelpDialogCustomer) {
                    this._valueHelpDialogCustomer = await valuehelp.createValueHelp({
                        title: "Customer",
                        model: this.getView().getModel(),
                        multiSelect: false,
                        keyField: "Kunnr",
                        keyDescField: "Land1",
                        basePath: "/CustomerSet",
                        preFilters: [],
                        aBindingFilter: [],
                        columns: [
                            {
                                label: "Kunnr",
                                path: 'Kunnr',
                                filterable: true
                            },
                            {
                                label: "Land1",
                                path: 'Land1',
                                filterable: true
                            },
                            {
                                label: "Name1",
                                path: 'Name1',
                                filterable: true
                            },
                            {
                                label: "Ort01",
                                path: 'Ort01',
                                filterable: true
                            }
                        ],
                        ok: function (oEvt) {

                            othis.mdl_zFilter.getData().Create.Customer = oEvt.Name1;
                            othis.mdl_zFilter.updateBindings();
                        }
                    });
                    this.getView().addDependent(this._valueHelpDialog);
                }

                this._valueHelpDialogCustomer.setBasicSearchText('');
                this._valueHelpDialogCustomer.open();
                var oFilterBar = this._valueHelpDialogCustomer.getFilterBar();
                if (oFilterBar) {
                    var aFilterGroupItems = oFilterBar.getFilterGroupItems();
                    for (var i = 0; i < aFilterGroupItems.length; i++) {
                        var oFilterField = aFilterGroupItems[i].getControl();
                        if (oFilterField && oFilterField.setConditions) {
                            oFilterField.setConditions([]);
                        }
                    }
                }
                var oTable = this._valueHelpDialogCustomer.getTable();
                if (oTable.getBinding('rows')) {
                    oTable.getBinding('rows').filter([]);
                    if (oTable.getBinding('rows').mParameters.custom &&
                        oTable.getBinding('rows').mParameters.custom.search) {
                        oTable.getBinding('rows').mParameters.custom.search = "";
                        oTable.getBinding('rows').sCustomParams = "";
                    }
                    oTable.getBinding('rows').refresh(true);
                }
            }





        });
    });
