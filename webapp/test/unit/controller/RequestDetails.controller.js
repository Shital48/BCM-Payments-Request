/*global QUnit*/

sap.ui.define([
	"bcmrequest/controller/RequestDetails.controller"
], function (Controller) {
	"use strict";

	QUnit.module("RequestDetails Controller");

	QUnit.test("I should test the RequestDetails controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
