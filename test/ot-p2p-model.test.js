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

  it("does apply remote ops on frontier", function () {
    var evOtp2p = new OTP2PModel();
    evOtp2p.insert(0, "abc");

    evOtp2p.on("broadcast", (data) => {
      // wait for the insert to be applied
      setTimeout(() => {
        // do a delete
        remoteOp(data.revision, [2, {"d": 1}]);
        assert.equal(prefilledModel.get(), "ab");
        done();
      })
    });
  });

  it("does apply remote ops retroactively", function () {
    var evOtp2p = new OTP2PModel();
    let revision;
    evOtp2p.insert(0, "abc");
    evOtp2p.insert(3, "hij");

    evOtp2p.on("broadcast", (data) => {
      if (!revision) {
        revision = data.revision;
      } else {
        // wait for the 2nd insert to be applied
        setTimeout(() => {
          // do a delete
          remoteOp(data.revision, [3, {"i": "def"}]);
          assert.equal(prefilledModel.get(), "abcdefhij");
          done();
        })
      }
    });
  });

  it("does apply remote mixed ops retroactively", function () {
    var evOtp2p = new OTP2PModel();
    let revision;
    evOtp2p.insert(0, "abc");
    evOtp2p.delete(0, 3);

    evOtp2p.on("broadcast", (data) => {
      if (!revision) {
        revision = data.revision;
      } else {
        // wait for the 2nd insert to be applied
        setTimeout(() => {
          // do a delete
          remoteOp(data.revision, [3, {"i": "def"}]);
          assert.equal(prefilledModel.get(), "def");
          done();
        })
      }
    });
  });

});
