/*global describe*/
/*global beforeEach*/
/*global it*/

let assert = require("assert");
import { OTP2PModel } from "../src/ot-p2p-model";

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
      assert.equal(data.revision, null);
      assert.deepEqual(data.op, [{i: "c"}]);
      done();
    });

    evOtp2p.insert(0, "c");
  });

  it("does emit broadcast event on delete", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.insert(0, "c");

    evOtp2p.on("broadcast", (data) => {
      assert.notEqual(data.revision, null);
      assert.deepEqual(data.op, [{d: 1}]);
      done();
    });

    evOtp2p.delete(0, 1);

  });

  it("does apply remote ops on frontier", function () {
    model.insert(0, "abc");
    model.remoteOp(model.getLastOp(), [2, {"d": 1}])
    assert.equal(model.get(), "ab");
  });

  it("does apply remote ops retroactively", function () {
    model.insert(0, "abc");
    model.insert(3, "hij");

    model.remoteOp(model.getFirstOp(), [3, {"i": "def"}]);
    assert.equal(model.get(), "abcdefhij");
  });

  it("does apply remote mixed ops retroactively", function () {
    model.insert(0, "abc");
    model.delete(0, 3);
    model.remoteOp(model.getFirstOp(), [3, {"i": "def"}]);
    assert.equal(model.get(), "def");
  });

  it("does apply remote op as first op", function () {
    // do a delete
    model.remoteOp(null, [{"i": "def"}]);
    assert.equal(model.get(), "def");
  });

  it("does import model", function () {
    model.importModel(["abc"]);
    assert.equal(model.get(), "abc");
  });

  it("does export model", function () {
    model.insert(0, 'ab');
    model.insert(2, 'c');
    assert.equal(model.exportModel(), 'abc');
  });

});
