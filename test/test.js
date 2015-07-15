let assert = require("assert");
import { OTP2PModel } from "../src/index";

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
    model.remoteOp(model.getLastOp(), [2, {"d": 1}]);
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

  it("does export history", function() {
    model.insert(0, 'ab');
    assert.equal(model.exportHistory().length, 1);
    // TODO: check other attributes
  });

  it("does import history", function () {
    let history = {
      model: {
        faf6f19d3718f28e6800ed5ba8b92902eb037a7e: {
          data: [{"i": "ab"}], parent: null, child: null }
      },
      length: 1,
      head: "some id",
      tail: "some id"
    };
    model.importHistory(history);
    assert.equal(
      model.getFirstOp(),
      "some id"
    );
    assert.equal(
      model.getLastOp(),
      "some id"
    );
    assert.deepEqual(model.exportHistory(), history);
  });

  it("does emit resync event when unknown remote op is found", function (done) {
    var evOtp2p = new OTP2PModel();

    evOtp2p.on("resync", () => done());

    evOtp2p.remoteOp("youdontknowme", [{'i': "hi"}]);
  });
});
