/*global describe*/
/*global beforeEach*/
/*global it*/

var assert = require("assert");
var OTP2PModel = require("../src/ot-p2p-model");

describe("OTP2PModel Tests", function () {
  let otp2pModel;

  beforeEach(function () {
    otp2pModel = new OTP2PModel();
  });

  it("does have an empty string upon initialization", function () {
    assert.equal(otp2pModel.text(), "");
  });

  it("does detect a tombstone", function () {
    assert.equal(otp2pModel.isTombstone(2), true);
    assert.equal(otp2pModel.isTombstone("a"), false);
  });

  it("does handle initialized strings", function () {
    var strings = ["help!!!", "😩😩"];
    for (var string in strings) {
      otp2pModel = new OTP2PModel(strings[string]);
      assert.equal(otp2pModel.text(), strings[string]);
    }
  });

  it("does convert model to view", function () {
    assert.equal(otp2pModel.modelItemsToView(["ab ", 1, "c"]), "ab c");
  });

  it("does calculate last visible character index", function () {
    assert.equal(otp2pModel.lastVisibleCharacterIndex([]), -1);
    assert.equal(otp2pModel.lastVisibleCharacterIndex([1]), -1);
    assert.equal(otp2pModel.lastVisibleCharacterIndex(["a"]), 0);
    assert.equal(otp2pModel.lastVisibleCharacterIndex([1, "a", 1]), 1);
    assert.equal(otp2pModel.lastVisibleCharacterIndex([1, "a", 50]), 1);
    assert.equal(otp2pModel.lastVisibleCharacterIndex([1, "ab", 50]), 2);
    assert.equal(otp2pModel.lastVisibleCharacterIndex([1, "a", 1]), 1);
  });

  it("does convert view index to model index", function () {
    // first char not tombstone
    assert.equal(
      otp2pModel.viewToModelIndex(0, "abc", ["a", 2, "bc"]),
      0
    );
    // first char
    assert.equal(
      otp2pModel.viewToModelIndex(0, "abc", [1, "a", 2, "bc"]),
      1
    );
    // middle
    assert.equal(
      otp2pModel.viewToModelIndex(1, "abc", [1, "a", 2, "bc"]),
      4
    );
    // last char
    assert.equal(
      otp2pModel.viewToModelIndex(2, "abc", [1, "a", 2, "bc"]),
      5
    );
    // what?
    assert.equal(
      otp2pModel.viewToModelIndex(2, "abc", [1, "a", 1, "b", 1, "c", 1]),
      5
    );
    // empty
    assert.equal(otp2pModel.viewToModelIndex(0, "", []), 0);

    // between tombstones
    assert.equal(
      otp2pModel.viewToModelIndex(1, "a", [1, "a", 1]),
      2
    );

    // between more tombstones
    assert.equal(
      otp2pModel.viewToModelIndex(1, "a", [1, "a", 5]),
      2
    );

    // second level of tombstones
    assert.equal(
      otp2pModel.viewToModelIndex(1, "ab", [1, "a", 5, "b"]),
      7
    );

  });

  it("does calculate model length", function () {
    assert.equal(otp2pModel.modelLength([1, "a", 2, "bc"]), 6);
    assert.equal(otp2pModel.modelLength([100]), 100);
    assert.equal(otp2pModel.modelLength([100, "a"]), 101);
    assert.equal(otp2pModel.modelLength(["a", 100, "a"]), 102);
    assert.equal(otp2pModel.modelLength([]), 0);
  });

  it("does generate correct ops", function () {
    // delete first char
    assert.deepEqual(
      otp2pModel.generateOp({"d": 1}, 0, "a", ["a"] ),
      [{"d": 1}]
    );

    // insert first char
    assert.deepEqual(
      otp2pModel.generateOp({"i": "a"}, 0, "", [] ),
      [{"i": "a"}]
    );

    // delete second char
    assert.deepEqual(
      otp2pModel.generateOp({"d": 1}, 1, "ab", ["ab"] ),
      [1, {"d": 1}]
    );

    // insert second char
    assert.deepEqual(
      otp2pModel.generateOp({"i": "b"}, 1, "a", ["a"] ),
      [1, {"i": "b"}]
    );

    // delete middle char
    assert.deepEqual(
      otp2pModel.generateOp({"d": 1}, 1, "abc", ["abc"] ),
      [1, {"d": 1}, 1]
    );

    // insert middle char
    assert.deepEqual(
      otp2pModel.generateOp({"i": "b"}, 1, "ac", ["ac"] ),
      [1, {"i": "b"}, 1]
    );

    // delete with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"d": 1}, 0, "a", ["a", 1] ),
      [{"d": 1}, 1]
    );

    // insert with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"i": "a"}, 0, "a", ["a", 1] ),
      [{"i": "a"}, 2]
    );

    // delete with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"d": 1}, 0, "a", [1, "a"] ),
      [1, {"d": 1}]
    );

    // insert with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"i": "b"}, 1, "a", [1, "a"] ),
      [2, {"i": "b"}]
    );

    // delete with preceding and trailing tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"d": 1}, 0, "a", [1, "a", 1] ),
      [1, {"d": 1}, 1]
    );

    // insert with preceding and trailing tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"i": "b"}, 1, "a", [1, "a", 1] ),
      [2, {"i": "b"}, 1]
    );
  });

  it("does generate ops with changing multiple characters", function () {
    // deletes first two characters
    assert.deepEqual(otp2pModel.generateOp({"d": 2}, 0, "ab", ["ab"] ), [{"d": 2}]);

    // inserts first two characters
    assert.deepEqual(otp2pModel.generateOp({"i": "aa"}, 0, "", []), [{"i": "aa"}]);

    // deletes first two characters with trailing characters
    assert.deepEqual(
      otp2pModel.generateOp({"d": 2}, 0, "abc", ["abc"] ),
      [{"d": 2}, 1]
    );

    // inserts first two characters with trailing characters
    assert.deepEqual(
      otp2pModel.generateOp({"i": "ab"}, 0, "c", ["c"] ),
      [{"i": "ab"}, 1]
    );

    // deletes last two characters with preceding characters
    assert.deepEqual(
      otp2pModel.generateOp({"d": 2}, 1, "abc", ["abc"] ),
      [1, {"d": 2}]
    );

    // inserts last two characters with preceding characters
    assert.deepEqual(
      otp2pModel.generateOp({"i": "bc"}, 1, "a", ["a"] ),
      [1, {"i": "bc"}]
    );

    // deletes first two characters with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"d": 2}, 0, "ab", ["ab", 1] ),
      [{"d": 2}, 1]
    );

    // inserts first two characters with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"i": "ab"}, 0, "", [1] ),
      [{"i": "ab"}, 1]
    );

    // deletes last two characters with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"d": 2}, 0, "bc", [1, "bc"] ),
      [1, {"d": 2}]
    );

    // inserts last two characters with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateOp({"i": "bc"}, 1, "a", [1, "a"] ),
      [2, {"i": "bc"}]
    );

    // deletes middle two characters
    assert.deepEqual(
      otp2pModel.generateOp({"d": 2}, 1, "abcd", ["abcd"] ),
      [1, {"d": 2}, 1]
    );

    // inserts middle two characters
    assert.deepEqual(
      otp2pModel.generateOp({"i": "bc"}, 1, "ad", ["ad"] ),
      [1, {"i": "bc"}, 1]
    );

    // deletes middle two characters surrounded by tombstones
    assert.deepEqual(
      otp2pModel.generateOp({"d": 2}, 0, "bc", [1, "bc", 1] ),
      [1, {"d": 2}, 1]
    );

    // inserts middle two characters surrounded by tombstones
    assert.deepEqual(
      otp2pModel.generateOp({"i": "bc"}, 1, "ad", [1, "ad", 1] ),
      [2, {"i": "bc"}, 2]
    );

    // deletes with tombstones in between
    assert.deepEqual(
      otp2pModel.generateOp({"d": 2}, 0, "abc", [1, "a", 1, "b", 1, "c", 1] ),
      [1, {"d": 3}, 3]
    );

    // inserts with tombstones in between
    assert.deepEqual(
      otp2pModel.generateOp({"i": "bc"}, 1, "ad", [1, "a", 1, "d", 1] ),
      [3, {"i": "bc"}, 2]
    );
  });

  it("does convert view index to model index (empty)", function () {
    assert.equal(otp2pModel.viewToModelIndex(0, "", []), 0);
    assert.equal(otp2pModel.viewToModelIndex(0, "", [10]), 0);
  });

  it("does throw an error if view does not match model", function () {
    assert.throws(
      () => otp2pModel.viewToModelIndex(1, "a", []),
      "Model and view don't match"
    );

    assert.throws(
      () => otp2pModel.viewToModelIndex(1, "", ["a"]),
      "Model and view don't match"
    );
  });

  it("does insert in both view and model", function () {
    // insert first char
    otp2pModel.insert(0, "a");
    assert.equal(otp2pModel.text(), "a");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 1, "totalLength": 1, "data": ["a"]}
    );

    // insert second char
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 1, "data": ["a"]};

    otp2pModel.insert(1, "b");

    assert.equal(otp2pModel.text(), "ab");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 2, "totalLength": 2, "data": ["ab"]}
    );

    // insert middle char
    otp2pModel.view = "ac";
    otp2pModel.typeModel = {"charLength": 2, "totalLength": 2, "data": ["ac"]};

    otp2pModel.insert(1, "b");

    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 3, "totalLength": 3, "data": ["abc"]}
    );

    // insert with trailing tombstone
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 2, "data": ["a", 1]};

    otp2pModel.insert(0, "a");

    assert.equal(otp2pModel.text(), "aa");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 2, "totalLength": 3, "data": ["aa", 1]}
    );

    // insert with preceding tombstone
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 2, "data": [1, "a"]};

    otp2pModel.insert(1, "b");

    assert.equal(otp2pModel.text(), "ab");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 2, "totalLength": 3, "data": [1, "ab"]}
    );

    // insert with preceding and trailing tombstone
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 3, "data": [1, "a", 1]};

    otp2pModel.insert(1, "b");

    assert.equal(otp2pModel.text(), "ab");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 2, "totalLength": 4, "data": [1, "ab", 1]}
    );

  });

  it("does throw an error if the index is out of range on insert", function () {
    assert.throws(
      () => otp2pModel.insert("a", -1),
      "Index is out of range"
    );

    assert.throws(
      () => otp2pModel.insert("a", 2),
      "Index is out of range"
    );
  });

  it("does delete in both view and model", function () {
    // delete first char
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 1, "data": ["a"]};

    otp2pModel.delete(0);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 0, "totalLength": 1, "data": [1]}
    );

    // delete second char
    otp2pModel.view = "ab";
    otp2pModel.typeModel = {"charLength": 2, "totalLength": 2, "data": ["ab"]};

    otp2pModel.delete(1);

    assert.equal(otp2pModel.text(), "a");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 1, "totalLength": 2, "data": ["a", 1]}
    );

    // delete middle char
    otp2pModel.view = "abc";
    otp2pModel.typeModel = {"charLength": 3, "totalLength": 3, "data": ["abc"]};

    otp2pModel.delete(1);

    assert.equal(otp2pModel.text(), "ac");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 2, "totalLength": 3, "data": ["a", 1, "c"]}
    );

    // delete with trailing tombstone
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 2, "data": ["a", 1]};

    otp2pModel.delete(0);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 0, "totalLength": 2, "data": [2]}
    );

    // delete with preceding tombstone
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 1, "data": [1, "a"]};

    otp2pModel.delete(0);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 0, "totalLength": 2, "data": [2]}
    );

    // delete with preceding and trailing tombstone
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 1, "data": [1, "a", 1]};

    otp2pModel.delete(0);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 0, "totalLength": 3, "data": [3]}
    );
  });

  it("does add multiple characters", function () {
    // inserts first two characters
    otp2pModel.insert(0, "aa");
    assert.equal(otp2pModel.text(), "aa");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 2, "totalLength": 2, "data": ["aa"]}
    );

    // inserts first two characters with trailing characters
    otp2pModel.view = "c";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 1, "data": ["c"]};

    otp2pModel.insert(0, "ab");

    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 3, "totalLength": 3, "data": ["abc"]}
    );

    // inserts last two characters with preceding characters
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 1, "data": ["a"]};

    otp2pModel.insert(1, "bc");

    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 3, "totalLength": 3, "data": ["abc"]}
    );

    // inserts first two characters with trailing tombstone
    otp2pModel.view = "";
    otp2pModel.typeModel = {"charLength": 0, "totalLength": 1, "data": [1]};

    otp2pModel.insert(0, "ab");

    assert.equal(otp2pModel.text(), "ab");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 2, "totalLength": 3, "data": ["ab", 1]}
    );


    // inserts last two characters with preceding tombstone
    otp2pModel.view = "a";
    otp2pModel.typeModel = {"charLength": 1, "totalLength": 1, "data": [1, "a"]};

    otp2pModel.insert(1, "bc");

    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 3, "totalLength": 4, "data": [1, "abc"]}
    );


    // inserts middle two characters
    otp2pModel.view = "ad";
    otp2pModel.typeModel = {"charLength": 2, "totalLength": 2, "data": ["ad"]};

    otp2pModel.insert(1, "bc");

    assert.equal(otp2pModel.text(), "abcd");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 4, "totalLength": 4, "data": ["abcd"]}
    );


    // inserts middle two characters surrounded by tombstones
    otp2pModel.view = "ad";
    otp2pModel.typeModel = {"charLength": 2, "totalLength": 4, "data": [1, "ad", 1]};

    otp2pModel.insert(1, "bc");

    assert.equal(otp2pModel.text(), "abcd");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 4, "totalLength": 6, "data": [1, "abcd", 1]}
    );


    // inserts with tombstones in between
    otp2pModel.view = "ad";
    otp2pModel.typeModel =
      {"charLength": 2, "totalLength": 5, "data": [1, "a", 1, "d", 1]};

    otp2pModel.insert(1, "bc");

    assert.equal(otp2pModel.text(), "abcd");
    assert.deepEqual(
      otp2pModel.typeModel,
      {"charLength": 4, "totalLength": 7, "data": [1, "a", 1, "bcd", 1]}
    );

  });

  it("does delete multiple characters", function () {

    // deletes first two characters
    otp2pModel.view = "ab";
    otp2pModel.typeModel = {"charLength": 2, "totalLength": 2, "data": ["ab"]};

    otp2pModel.delete(0, 2);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 2,
        "data": [2]
      }
    );

    // deletes first two characters with trailing characters
    otp2pModel.view = "abc";
    otp2pModel.typeModel = {"charLength": 3, "totalLength": 3, "data": ["abc"]};

    otp2pModel.delete(0, 2);

    assert.equal(otp2pModel.text(), "c");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 1,
        "totalLength": 3,
        "data": [2, "c"]
      }
    );

    // deletes last two characters with preceding characters
    otp2pModel.view = "abc";
    otp2pModel.typeModel = {"charLength": 3, "totalLength": 3, "data": ["abc"]};

    otp2pModel.delete(1, 2);

    assert.equal(otp2pModel.text(), "a");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 1,
        "totalLength": 3,
        "data": ["a", 2]
      }
    );

    // deletes first two characters with trailing tombstone
    otp2pModel.view = "ab";
    otp2pModel.typeModel = {"charLength": 2, "totalLength": 3, "data": ["ab", 1]};

    otp2pModel.delete(0, 2);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 3,
        "data": [3]
      }
    );

    // deletes last two characters with preceding tombstone
    otp2pModel.view = "bc";
    otp2pModel.typeModel = {"charLength": 2, "totalLength": 3, "data": [1, "bc"]};

    otp2pModel.delete(0, 2);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 3,
        "data": [3]
      }
    );

    // deletes middle two characters
    otp2pModel.view = "abcd";
    otp2pModel.typeModel = {"charLength": 4, "totalLength": 4, "data": ["abcd"]};

    otp2pModel.delete(1, 2);

    assert.equal(otp2pModel.text(), "ad");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 2,
        "totalLength": 4,
        "data": ["a", 2, "d" ]
      }
    );

    // deletes middle two characters surrounded by tombstones
    otp2pModel.view = "bc";
    otp2pModel.typeModel = { "charLength": 2, "totalLength": 4, "data": [1, "bc", 1]};

    otp2pModel.delete(0, 2);

    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 4,
        "data": [4]
      }
    );

    // deletes with tombstones in between
    otp2pModel.view = "abc";
    otp2pModel.typeModel = {
      "charLength": 3,
      "totalLength": 7,
      "data": [1, "a", 1, "b", 1, "c", 1]
    };

    otp2pModel.delete(0, 2);

    assert.equal(otp2pModel.text(), "c");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 1,
        "totalLength": 7,
        "data": [5, "c", 1]
      }
    );

    otp2pModel.view = "abcdef";
    otp2pModel.typeModel = {
      "charLength": 6,
      "totalLength": 9,
      "data": ["ab", 2, "c", 1, "def"]
    };

    otp2pModel.delete(2, 2);

    assert.equal(otp2pModel.text(), "abef");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 4,
        "totalLength": 9,
        "data": ["ab", 5, "ef"]
      }
    );

  });

  it("does generate remote op", function () {
    // delete first char
    assert.deepEqual(otp2pModel.generateRemoteOp(
      {"d": 1}, 0, ["a"]),
      [{"d": 1}]
    );

    // insert first char
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "a"}, 0, [] ),
      [{"i": "a"}]
    );

    // delete second char
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 1}, 1, ["ab"] ),
      [1, {"d": 1}]
    );

    // insert second char
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "b"}, 1, ["a"] ),
      [1, {"i": "b"}]
    );

    // delete middle char
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 1}, 1, ["abc"] ),
      [1, {"d": 1}, 1]
    );

    // insert middle char
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "b"}, 1, ["ac"] ),
      [1, {"i": "b"}, 1]
    );

    // delete with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 1}, 0, ["a", 1] ),
      [{"d": 1}, 1]
    );

    // insert with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "a"}, 0, ["a", 1] ),
      [{"i": "a"}, 2]
    );

    // delete with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 1}, 1, [1, "a"] ),
      [1, {"d": 1}]
    );

    // insert with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "b"}, 2, [1, "a"] ),
      [2, {"i": "b"}]
    );
    // delete with preceding and trailing tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 1}, 0, [1, "a", 1] ),
      [{"d": 1}, 2]
    );
    // insert with preceding and trailing tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "b"}, 1, [1, "a", 1] ),
      [1, {"i": "b"}, 2]
    );
  });

  it("does generate ops with changing multiple characters", function () {
    // deletes first two characters
    assert.deepEqual(otp2pModel.generateRemoteOp({"d": 2}, 0, ["ab"] ), [{"d": 2}]);

    // inserts first two characters
    assert.deepEqual(otp2pModel.generateRemoteOp({"i": "aa"}, 0, []), [{"i": "aa"}]);

    // deletes first two characters with trailing characters
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 2}, 0, ["abc"] ),
      [{"d": 2}, 1]
    );

    // inserts first two characters with trailing characters
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "ab"}, 0, ["c"] ),
      [{"i": "ab"}, 1]
    );

    // deletes last two characters with preceding characters
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 2}, 1, ["abc"] ),
      [1, {"d": 2}]
    );

    // inserts last two characters with preceding characters
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "bc"}, 1, ["a"] ),
      [1, {"i": "bc"}]
    );

    // deletes first two characters with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 2}, 0, ["ab", 1] ),
      [{"d": 2}, 1]
    );

    // inserts first two characters with trailing tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "ab"}, 0, [1] ),
      [{"i": "ab"}, 1]
    );

    // deletes last two characters with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 2}, 1, [1, "bc"] ),
      [1, {"d": 2}]
    );

    // inserts last two characters with preceding tombstone
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "bc"}, 1, [1, "a"] ),
      [1, {"i": "bc"}, 1]
    );

    // deletes middle two characters
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 2}, 1, ["abcd"] ),
      [1, {"d": 2}, 1]
    );

    // inserts middle two characters
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "bc"}, 1, ["ad"] ),
      [1, {"i": "bc"}, 1]
    );

    // deletes middle two characters surrounded by tombstones
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 2}, 1, [1, "bc", 1] ),
      [1, {"d": 2}, 1]
    );

    // inserts middle two characters surrounded by tombstones
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "bc"}, 2, [1, "ad", 1] ),
      [2, {"i": "bc"}, 2]
    );

    // deletes with tombstones in between
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"d": 3}, 1, [1, "a", 1, "b", 1, "c", 1] ),
      [1, {"d": 3}, 3]
    );

    // inserts with tombstones in between
    assert.deepEqual(
      otp2pModel.generateRemoteOp({"i": "bc"}, 3, [1, "a", 1, "d", 1] ),
      [3, {"i": "bc"}, 2]
    );
  });

  it("does remote delete operations", function () {
    // delete first char
    otp2pModel.view = "a";
    otp2pModel.typeModel = {
      "charLength": 1,
      "totalLength": 1,
      "data": ["a"]
    };

    otp2pModel.remoteDelete(0);
    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 1,
        "data": [1]
      }
    );

    // delete last char
    otp2pModel.view = "ab";
    otp2pModel.typeModel = {
      "charLength": 2,
      "totalLength": 2,
      "data": ["ab"]
    };

    otp2pModel.remoteDelete(1);
    assert.equal(otp2pModel.text(), "a");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 1,
        "totalLength": 2,
        "data": ["a", 1]
      }
    );

    // delete middle char
    otp2pModel.view = "abc";
    otp2pModel.typeModel = {
      "charLength": 3,
      "totalLength": 3,
      "data": ["abc"]
    };

    otp2pModel.remoteDelete(1);
    assert.equal(otp2pModel.text(), "ac");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 2,
        "totalLength": 3,
        "data": ["a", 1, "c"]
      }
    );

    // delete first char with trailing tombstones
    otp2pModel.view = "a";
    otp2pModel.typeModel = {
      "charLength": 1,
      "totalLength": 2,
      "data": ["a", 1]
    };

    otp2pModel.remoteDelete(0);
    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 2,
        "data": [2]
      }
    );

    // delete last char with preceding tombstones
    otp2pModel.view = "b";
    otp2pModel.typeModel = {
      "charLength": 1,
      "totalLength": 2,
      "data": [1, "b"]
    };

    otp2pModel.remoteDelete(1);
    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 2,
        "data": [2]
      }
    );
  });

  it("does remote delete multiple chars", function () {
    // delete first 2 chars
    otp2pModel.view = "ab";
    otp2pModel.typeModel = {
      "charLength": 2,
      "totalLength": 2,
      "data": ["ab"]
    };

    otp2pModel.remoteDelete(0, 2);
    assert.equal(otp2pModel.text(), "");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 0,
        "totalLength": 2,
        "data": [2]
      }
    );

    // delete last 2 chars
    otp2pModel.view = "abc";
    otp2pModel.typeModel = {
      "charLength": 3,
      "totalLength": 3,
      "data": ["abc"]
    };

    otp2pModel.remoteDelete(1, 2);
    assert.equal(otp2pModel.text(), "a");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 1,
        "totalLength": 3,
        "data": ["a", 2]
      }
    );

    // delete middle 2 chars

    otp2pModel.view = "abcd";
    otp2pModel.typeModel = {
      "charLength": 4,
      "totalLength": 4,
      "data": ["abcd"]
    };

    otp2pModel.remoteDelete(1, 2);
    assert.equal(otp2pModel.text(), "ad");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 2,
        "totalLength": 4,
        "data": ["a", 2, "d"]
      }
    );
  });

  it("does remote insert operations", function () {
    // insert first char
    otp2pModel.remoteInsert(0, "a");
    assert.equal(otp2pModel.text(), "a");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 1,
        "totalLength": 1,
        "data": ["a"]
      }
    );

    // insert last char
    otp2pModel.view = "ab";
    otp2pModel.typeModel = {
      "charLength": 2,
      "totalLength": 2,
      "data": ["ab"]
    };

    otp2pModel.remoteInsert(2, "c");
    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 3,
        "totalLength": 3,
        "data": ["abc"]
      }
    );

    // insert middle char
    otp2pModel.view = "ac";
    otp2pModel.typeModel = {
      "charLength": 2,
      "totalLength": 2,
      "data": ["ac"]
    };

    otp2pModel.remoteInsert(1, "b");
    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 3,
        "totalLength": 3,
        "data": ["abc"]
      }
    );

    // insert first char with trailing tombstones
    otp2pModel.view = "a";
    otp2pModel.typeModel = {
      "charLength": 1,
      "totalLength": 2,
      "data": ["a", 1]
    };

    otp2pModel.remoteInsert(1, "b");
    assert.equal(otp2pModel.text(), "ab");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 2,
        "totalLength": 3,
        "data": ["ab", 1]
      }
    );

    // insert last char with preceding tombstones
    otp2pModel.view = "b";
    otp2pModel.typeModel = {
      "charLength": 1,
      "totalLength": 2,
      "data": [1, "b"]
    };

    otp2pModel.remoteInsert(1, "a");
    assert.equal(otp2pModel.text(), "ab");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 2,
        "totalLength": 3,
        "data": [1, "ab"]
      }
    );
  });

  it("does remote insert multiple chars", function () {
    // insert first 2 chars
    otp2pModel.view = "c";
    otp2pModel.typeModel = {
      "charLength": 1,
      "totalLength": 1,
      "data": ["c"]
    };

    otp2pModel.remoteInsert(0, "ab");
    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 3,
        "totalLength": 3,
        "data": ["abc"]
      }
    );

    // insert last 2 chars
    otp2pModel.view = "a";
    otp2pModel.typeModel = {
      "charLength": 1,
      "totalLength": 1,
      "data": ["a"]
    };

    otp2pModel.remoteInsert(1, "bc");
    assert.equal(otp2pModel.text(), "abc");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 3,
        "totalLength": 3,
        "data": ["abc"]
      }
    );

    // insert middle 2 chars
    otp2pModel.view = "ad";
    otp2pModel.typeModel = {
      "charLength": 2,
      "totalLength": 2,
      "data": ["ad"]
    };

    otp2pModel.remoteInsert(1, "bc");
    assert.equal(otp2pModel.text(), "abcd");
    assert.deepEqual(
      otp2pModel.typeModel,
      {
        "charLength": 4,
        "totalLength": 4,
        "data": ["abcd"]
      }
    );
  });

  it("does call observable on insert", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.on("insert", (command) => {
      assert.deepEqual(command, {
        index: 0,
        value: "ab"
      });
      done();
    });
    evOtp2p.insert(0, "ab");
  });

  it("does call observable on delete", function (done) {
    var evOtp2p = new OTP2PModel();

    evOtp2p.view = "ab";
    evOtp2p.typeModel = {
      "charLength": 2,
      "totalLength": 2,
      "data": ["ab"]
    };

    evOtp2p.on("delete", (command) => {
      assert.deepEqual(command, {
        index: 0,
        numChars: 2
      });
      done();
    });
    evOtp2p.delete(0, 2);
  });

  it("does convert model index to view index", function () {
    // first item
    assert.equal(otp2pModel.modelIndexToViewIndex(0, []), 0);

    // second item
    assert.equal(otp2pModel.modelIndexToViewIndex(1, ["a"]), 1);

    // middle item
    assert.equal(otp2pModel.modelIndexToViewIndex(1, ["abc"]), 1);

    // preceding tombstone
    assert.equal(otp2pModel.modelIndexToViewIndex(1, [1, "a"]), 0);

    // trailing tombstone
    assert.equal(otp2pModel.modelIndexToViewIndex(0, ["a", 1]), 0);

    assert.equal(otp2pModel.modelIndexToViewIndex(0, [4]), 0);

  });

  it("does count tombstones in range", function () {
    assert.equal(otp2pModel.countTombstonesInRange(0, 1, ["a"]), 0);
    assert.equal(otp2pModel.countTombstonesInRange(0, 1, [1, "a"]), 1);
    assert.equal(otp2pModel.countTombstonesInRange(0, 1, ["a", 1]), 0);
    assert.equal(otp2pModel.countTombstonesInRange(0, 4, [4]), 4);
    assert.equal(otp2pModel.countTombstonesInRange(1, 4, [4]), 3);
  });

  it("does call observable on remote insert", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.on("insert", (command) => {
      assert.deepEqual(command, {
        index: 0,
        value: "ab"
      });
      done();
    });
    evOtp2p.remoteInsert(0, "ab");
  });

  it("does call observable on remote insert with tombstones", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.view = "a";
    evOtp2p.typeModel = {
      "charLength": 1,
      "totalLength": 3,
      "data": [1, "a", 1]
    };

    evOtp2p.on("insert", (command) => {
      assert.deepEqual(command, {
        index: 0,
        value: "b"
      });
      done();
    });
    evOtp2p.remoteInsert(1, "b");
  });

  it("does call observable on remote delete", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.view = "a";
    evOtp2p.typeModel = {
      "charLength": 1,
      "totalLength": 1,
      "data": ["a"]
    };

    evOtp2p.on("delete", (command) => {
      assert.deepEqual(command, {
        index: 0,
        numChars: 1
      });
      done();
    });
    evOtp2p.remoteDelete(0);
  });

  it("does calculate effected chars with tombstones", function () {
    assert.equal(
      otp2pModel.modelEffectedToViewEffected(0, 2, ["ab"]),
      2
    );
    assert.equal(
      otp2pModel.modelEffectedToViewEffected(3, 3, [1, "a", 1, "b", 1, "c", 1]),
      2
    );

  });

  it("does call observable on remote delete with tombstones", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.view = "abc";
    evOtp2p.typeModel = {
      "charLength": 3,
      "totalLength": 7,
      "data": [1, "a", 1, "b", 1, "c", 1]
    };

    evOtp2p.on("delete", (command) => {
      assert.deepEqual(command, {
        index: 1,
        numChars: 2
      });
      done();
    });
    evOtp2p.remoteDelete(3, 3);
  });

  it("does emit broadcast insert on local insert", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.view = "";
    evOtp2p.typeModel = {
      "charLength": 0,
      "totalLength": 0,
      "data": []
    };

    evOtp2p.on("broadcast", (command) => {
      assert.deepEqual(command, {
        type: "insert",
        index: 0,
        value: "a"
      });
      done();
    });

    evOtp2p.insert(0, "a");
  });

  it("does calculate number of effected chars in model", function () {
    assert.equal(otp2pModel.viewEffectedToModelEffected(0, 1, "a", ["a"]), 1);

    assert.equal(
      otp2pModel.viewEffectedToModelEffected(
        0, 2, "abc", [1, "a", 1, "b", 1, "c", 1]
      ),
      3
    );

    assert.equal(
      otp2pModel.viewEffectedToModelEffected(
        2, 2, "abcdef", ["ab", 2, "c", 1, "def"]
      ),
      3
    );

  });

  it("does emit broadcast insert on local insert multiple", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.view = "abe";
    evOtp2p.typeModel = {
      "charLength": 3,
      "totalLength": 7,
      "data": [1, "a", 1, "b", 1, "e", 1]
    };

    evOtp2p.on("broadcast", (command) => {
      assert.deepEqual(command, {
        type: "insert",
        index: 5,
        value: "cd"
      });
      done();
    });

    evOtp2p.insert(2, "cd");
  });

  it("does emit broadcast on local delete", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.view = "a";
    evOtp2p.typeModel = {
      "charLength": 1,
      "totalLength": 1,
      "data": ["a"]
    };

    evOtp2p.on("broadcast", (command) => {
      assert.deepEqual(command, {
        type: "delete",
        index: 0,
        numChars: 1
      });
      done();
    });

    evOtp2p.delete(0);
  });

  it("does emit broadcast on local delete multiple", function (done) {
    var evOtp2p = new OTP2PModel();
    evOtp2p.view = "abcdef";
    evOtp2p.typeModel = {
      "charLength": 6,
      "totalLength": 9,
      "data": ["ab", 2, "c", 1, "def"]
    };

    evOtp2p.on("broadcast", (command) => {
      assert.deepEqual(command, {
        type: "delete",
        index: 4,
        numChars: 3
      });
      done();
    });

    evOtp2p.delete(2, 2);

  });
});
