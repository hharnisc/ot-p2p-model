/*global describe*/
/*global beforeEach*/
/*global it*/

let assert = require("assert");
let OTP2PModel = require("../src/ot-p2p-model");

describe("OTP2PModel Tests", function () {
  let model;

  beforeEach(function () {
    model = new OTP2PModel();
  });

  it("does create an empty document", function () {
    assert.equal(model.get(), "");
  });

  it("does create a prefilled document", function () {
    let text = "hello";
    let prefilledModel = new OTP2PModel(text);
    assert.equal(prefilledModel.get(), text);
  });

  it("does insert text into a document", function () {
    let text = "new text";
    model.insert(0, text);
    assert.equal(model.get(), text);
  });

  it("does remove text from a document", function () {
    let text = "hello";
    let prefilledModel = new OTP2PModel(text);
    prefilledModel.delete(0, 5);
    assert.equal(prefilledModel.get(), "");
  });

  it("does emit broadcast event on insert", function (done) {
    var evOtp2p = new OTP2PModel();

    evOtp2p.on("broadcast", (data) => {
      assert.notEqual(data.revision, undefined);
      assert.deepEqual(data.op, [{i: "c"}]);
      done();
    });

    evOtp2p.insert(0, "c");
  });

  it("does emit broadcast event on delete", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.insert(0, "c");

    evOtp2p.on("broadcast", (data) => {
      assert.notEqual(data.revision, undefined);
      assert.deepEqual(data.op, [{d: 1}]);
      done();
    });

    evOtp2p.delete(0, 1);

  });
});
