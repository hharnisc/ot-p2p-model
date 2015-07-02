var assert = require("assert");
var OTP2P = require('../src/otp2p');

describe('OTP2P Tests', function () {
  let otp2p;

  beforeEach(function () {
    otp2p = new OTP2P();
  });

  it('does have an empty string upon initialization', function () {
    assert.equal(otp2p.text(), '');
  });

  it('does detect a tombstone', function () {
    assert.equal(otp2p.isTombstone(2), true);
    assert.equal(otp2p.isTombstone('a'), false);
  });

  it('does handle initialized strings', function () {
    var strings = ['help!!!', '😩😩'];
    for (var string in strings) {
      otp2p = new OTP2P(strings[string]);
      assert.equal(otp2p.text(), strings[string]);
    }
  });

  it('does convert model to view', function () {
    assert.equal(otp2p.modelItemsToView(['ab ', 1, 'c']), 'ab c');
  });

  it('does calculate last visible character index', function () {
    assert.equal(otp2p.lastVisibleCharacterIndex([]), undefined);
    assert.equal(otp2p.lastVisibleCharacterIndex([1]), undefined);
    assert.equal(otp2p.lastVisibleCharacterIndex(['a']), 0);
    assert.equal(otp2p.lastVisibleCharacterIndex([1, 'a', 1]), 1);
    assert.equal(otp2p.lastVisibleCharacterIndex([1, 'a', 50]), 1);
    assert.equal(otp2p.lastVisibleCharacterIndex([1, 'ab', 50]), 2);
    assert.equal(otp2p.lastVisibleCharacterIndex([1, 'a', 1]), 1);
  });

  it('does convert view index to model index', function () {
    // first char not tombstone
    assert.equal(
      otp2p.viewToModelIndex(0, 'abc', ['a', 2, 'bc']),
      0
    );
    // first char
    assert.equal(
      otp2p.viewToModelIndex(0, 'abc', [1, 'a', 2, 'bc']),
      1
    )
    // middle
    assert.equal(
      otp2p.viewToModelIndex(1, 'abc', [1, 'a', 2, 'bc']),
      4
    );
    // last char
    assert.equal(
      otp2p.viewToModelIndex(2, 'abc', [1, 'a', 2, 'bc']),
      5
    );
    // what?
    assert.equal(
      otp2p.viewToModelIndex(2, 'abc', [1, 'a', 1, 'b', 1, 'c', 1]),
      5
    );
    // empty
    assert.equal(otp2p.viewToModelIndex(0, '', []), 0);

    // between tombstones
    assert.equal(
      otp2p.viewToModelIndex(1, 'a', [1, 'a', 1]),
      2
    );

    // between more tombstones
    assert.equal(
      otp2p.viewToModelIndex(1, 'a', [1, 'a', 5]),
      2
    );

    // second level of tombstones
    assert.equal(
      otp2p.viewToModelIndex(1, 'ab', [1, 'a', 5, 'b']),
      7
    );

  });

  it('does calculate model length', function () {
    assert.equal(otp2p.modelLength([1, 'a', 2, 'bc']), 6);
    assert.equal(otp2p.modelLength([100]), 100);
    assert.equal(otp2p.modelLength([100, 'a']), 101);
    assert.equal(otp2p.modelLength(['a', 100, 'a']), 102);
    assert.equal(otp2p.modelLength([]), 0);
  });

  it('does generate correct ops', function () {
    // delete first char
    assert.deepEqual(
      otp2p.generateOp({'d': 1}, 0, 'a', ['a'] ),
      [{'d': 1}]
    );

    // insert first char
    assert.deepEqual(
      otp2p.generateOp({'i': 'a'}, 0, '', [] ),
      [{'i': 'a'}]
    );

    // delete second char
    assert.deepEqual(
      otp2p.generateOp({'d': 1}, 1, 'ab', ['ab'] ),
      [1, {'d': 1}]
    );

    // insert second char
    assert.deepEqual(
      otp2p.generateOp({'i': 'b'}, 1, 'a', ['a'] ),
      [1, {'i': 'b'}]
    );

    // delete middle char
    assert.deepEqual(
      otp2p.generateOp({'d': 1}, 1, 'abc', ['abc'] ),
      [1, {'d': 1}, 1]
    );

    // insert middle char
    assert.deepEqual(
      otp2p.generateOp({'i': 'b'}, 1, 'ac', ['ac'] ),
      [1, {'i': 'b'}, 1]
    );

    // delete with trailing tombstone
    assert.deepEqual(
      otp2p.generateOp({'d': 1}, 0, 'a', ['a', 1] ),
      [{'d': 1}, 1]
    );

    // insert with trailing tombstone
    assert.deepEqual(
      otp2p.generateOp({'i': 'a'}, 0, 'a', ['a', 1] ),
      [{'i': 'a'}, 2]
    );

    // delete with preceding tombstone
    assert.deepEqual(
      otp2p.generateOp({'d': 1}, 0, 'a', [1, 'a'] ),
      [1, {'d': 1}]
    );

    // insert with preceding tombstone
    assert.deepEqual(
      otp2p.generateOp({'i': 'b'}, 1, 'a', [1, 'a'] ),
      [2, {'i': 'b'}]
    );

    // delete with preceding and trailing tombstone
    assert.deepEqual(
      otp2p.generateOp({'d': 1}, 0, 'a', [1, 'a', 1] ),
      [1, {'d': 1}, 1]
    );

    // insert with preceding and trailing tombstone
    assert.deepEqual(
      otp2p.generateOp({'i': 'b'}, 1, 'a', [1, 'a', 1] ),
      [2, {'i': 'b'}, 1]
    );
  });

  it('does generate ops with changing multiple characters', function () {
    // deletes first two characters
    assert.deepEqual(otp2p.generateOp({'d': 2}, 0, 'ab', ['ab'] ),[{'d': 2}]);

    // inserts first two characters
    assert.deepEqual(otp2p.generateOp({'i': 'aa'}, 0, '', []), [{'i': 'aa'}]);

    // deletes first two characters with trailing characters
    assert.deepEqual(
      otp2p.generateOp({'d': 2}, 0, 'abc', ['abc'] ),
      [{'d': 2}, 1]
    );

    // inserts first two characters with trailing characters
    assert.deepEqual(
      otp2p.generateOp({'i': 'ab'}, 0, 'c', ['c'] ),
      [{'i': 'ab'}, 1]
    );

    // deletes last two characters with preceding characters
    assert.deepEqual(
      otp2p.generateOp({'d': 2}, 1, 'abc', ['abc'] ),
      [1, {'d': 2}]
    );

    // inserts last two characters with preceding characters
    assert.deepEqual(
      otp2p.generateOp({'i': 'bc'}, 1, 'a', ['a'] ),
      [1, {'i': 'bc'}]
    );

    // deletes first two characters with trailing tombstone
    assert.deepEqual(
      otp2p.generateOp({'d': 2}, 0, 'ab', ['ab', 1] ),
      [{'d': 2}, 1]
    );

    // inserts first two characters with trailing tombstone
    assert.deepEqual(
      otp2p.generateOp({'i': 'ab'}, 0, '', [1] ),
      [{'i': 'ab'}, 1]
    );

    // deletes last two characters with preceding tombstone
    assert.deepEqual(
      otp2p.generateOp({'d': 2}, 0, 'bc', [1, 'bc'] ),
      [1, {'d': 2}]
    );

    // inserts last two characters with preceding tombstone
    assert.deepEqual(
      otp2p.generateOp({'i': 'bc'}, 1, 'a', [1, 'a'] ),
      [2, {'i': 'bc'}]
    );

    // deletes middle two characters
    assert.deepEqual(
      otp2p.generateOp({'d': 2}, 1, 'abcd', ['abcd'] ),
      [1, {'d': 2}, 1]
    );

    // inserts middle two characters
    assert.deepEqual(
      otp2p.generateOp({'i': 'bc'}, 1, 'ad', ['ad'] ),
      [1, {'i': 'bc'}, 1]
    );

    // deletes middle two characters surrounded by tombstones
    assert.deepEqual(
      otp2p.generateOp({'d': 2}, 0, 'bc', [1, 'bc', 1] ),
      [1, {'d': 2}, 1]
    );

    // inserts middle two characters surrounded by tombstones
    assert.deepEqual(
      otp2p.generateOp({'i': 'bc'}, 1, 'ad', [1, 'ad', 1] ),
      [2, {'i': 'bc'}, 2]
    );

    // deletes with tombstones in between
    assert.deepEqual(
      otp2p.generateOp({'d': 2}, 0, 'abc', [1, 'a', 1, 'b', 1, 'c', 1] ),
      [1, {'d': 3}, 3]
    );

    // inserts with tombstones in between
    assert.deepEqual(
      otp2p.generateOp({'i': 'bc'}, 1, 'ad', [1, 'a', 1, 'd', 1] ),
      [3, {'i': 'bc'}, 2]
    );
  });

  it('does convert view index to model index (empty)', function () {
    assert.equal(otp2p.viewToModelIndex(0, '', []), 0);
    assert.equal(otp2p.viewToModelIndex(0, '', [10]), 0);
  });

  it('does throw an error if view does not match model', function () {
    assert.throws(
      () => otp2p.viewToModelIndex(1, 'a', []),
      "Model and view don't match"
    );

    assert.throws(
      () => otp2p.viewToModelIndex(1, '', ['a']),
      "Model and view don't match"
    );
  });

  it('does insert in both view and model', function () {
    // insert first char
    otp2p.insert('a', 0);
    assert.equal(otp2p.text(), 'a');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":1,"totalLength":1,"data":["a"]}
    );

    // insert second char
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":1,"data":["a"]};

    otp2p.insert('b', 1);

    assert.equal(otp2p.text(), 'ab');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":2,"totalLength":2,"data":["ab"]}
    );

    // insert middle char
    otp2p.view = 'ac';
    otp2p.typeModel = {"charLength":2,"totalLength":2,"data":["ac"]};

    otp2p.insert('b', 1);

    assert.equal(otp2p.text(), 'abc');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":3,"totalLength":3,"data":["abc"]}
    );

    // insert with trailing tombstone
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":2,"data":["a", 1]};

    otp2p.insert('a', 0);

    assert.equal(otp2p.text(), 'aa');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":2,"totalLength":3,"data":["aa", 1]}
    );

    // insert with preceding tombstone
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":2,"data":[1, "a"]};

    otp2p.insert('b', 1);

    assert.equal(otp2p.text(), 'ab');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":2,"totalLength":3,"data":[1, "ab"]}
    );

    // insert with preceding and trailing tombstone
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":3,"data":[1, 'a', 1]};

    otp2p.insert('b', 1);

    assert.equal(otp2p.text(), 'ab');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":2,"totalLength":4,"data":[1, "ab", 1]}
    );

  });

  it('does throw an error if the index is out of range on insert', function () {
    assert.throws(
      () => otp2p.insert('a', -1),
      "Index is out of range"
    );

    assert.throws(
      () => otp2p.insert('a', 2),
      "Index is out of range"
    );
  });

  it('does delete in both view and model', function () {
    // delete first char
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":1,"data":['a']};

    otp2p.delete(0);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":0,"totalLength":1,"data":[1]}
    );

    // delete second char
    otp2p.view = 'ab';
    otp2p.typeModel = {"charLength":2,"totalLength":2,"data":['ab']};

    otp2p.delete(1);

    assert.equal(otp2p.text(), 'a');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":1,"totalLength":2,"data":['a', 1]}
    );

    // delete middle char
    otp2p.view = 'abc';
    otp2p.typeModel = {"charLength":3,"totalLength":3,"data":['abc']};

    otp2p.delete(1);

    assert.equal(otp2p.text(), 'ac');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":2,"totalLength":3,"data":['a', 1, 'c']}
    );

    // delete with trailing tombstone
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":2,"data":['a', 1]};

    otp2p.delete(0);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":0,"totalLength":2,"data":[2]}
    );

    // delete with preceding tombstone
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":1,"data":[1, 'a']};

    otp2p.delete(0);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":0,"totalLength":2,"data":[2]}
    );

    // delete with preceding and trailing tombstone
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":1,"data":[1, 'a', 1]};

    otp2p.delete(0);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":0,"totalLength":3,"data":[3]}
    );
  });

  it('does add multiple characters', function () {
    // inserts first two characters
    otp2p.insert('aa', 0);
    assert.equal(otp2p.text(), 'aa');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":2,"totalLength":2,"data":["aa"]}
    );

    // inserts first two characters with trailing characters
    otp2p.view = 'c';
    otp2p.typeModel = {"charLength":1,"totalLength":1,"data":["c"]};

    otp2p.insert('ab', 0);

    assert.equal(otp2p.text(), 'abc');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":3,"totalLength":3,"data":["abc"]}
    );

    // inserts last two characters with preceding characters
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":1,"data":["a"]};

    otp2p.insert('bc', 1);

    assert.equal(otp2p.text(), 'abc');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":3,"totalLength":3,"data":["abc"]}
    );

    // inserts first two characters with trailing tombstone
    otp2p.view = '';
    otp2p.typeModel = {"charLength":0,"totalLength":1,"data":[1]};

    otp2p.insert('ab', 0);

    assert.equal(otp2p.text(), 'ab');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":2,"totalLength":3,"data":["ab", 1]}
    );


    // inserts last two characters with preceding tombstone
    otp2p.view = 'a';
    otp2p.typeModel = {"charLength":1,"totalLength":1,"data":[1, "a"]};

    otp2p.insert('bc', 1);

    assert.equal(otp2p.text(), 'abc');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":3,"totalLength":4,"data":[1, "abc"]}
    );


    // inserts middle two characters
    otp2p.view = 'ad';
    otp2p.typeModel = {"charLength":2,"totalLength":2,"data":["ad"]};

    otp2p.insert('bc', 1);

    assert.equal(otp2p.text(), 'abcd');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":4,"totalLength":4,"data":["abcd"]}
    );


    // inserts middle two characters surrounded by tombstones
    otp2p.view = 'ad';
    otp2p.typeModel = {"charLength":2,"totalLength":4,"data":[1, "ad", 1]};

    otp2p.insert('bc', 1);

    assert.equal(otp2p.text(), 'abcd');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":4,"totalLength":6,"data":[1, "abcd", 1]}
    );


    // inserts with tombstones in between
    otp2p.view = 'ad';
    otp2p.typeModel =
      {"charLength":2,"totalLength":5,"data":[1, "a", 1, 'd', 1]};

    otp2p.insert('bc', 1);

    assert.equal(otp2p.text(), 'abcd');
    assert.deepEqual(
      otp2p.typeModel,
      {"charLength":4,"totalLength":7,"data":[1, 'a', 1, 'bcd', 1]}
    );

  });

  it('does delete multiple characters', function () {

    // deletes first two characters
    otp2p.view = 'ab';
    otp2p.typeModel = {"charLength":2, "totalLength":2, "data": ['ab']};

    otp2p.delete(0, 2);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":0,
        "totalLength":2,
        "data": [2]
      }
    );

    // deletes first two characters with trailing characters
    otp2p.view = 'abc';
    otp2p.typeModel = {"charLength":3, "totalLength":3, "data": ['abc']};

    otp2p.delete(0, 2);

    assert.equal(otp2p.text(), 'c');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":1,
        "totalLength":3,
        "data": [2, 'c']
      }
    );

    // deletes last two characters with preceding characters
    otp2p.view = 'abc';
    otp2p.typeModel = {"charLength":3, "totalLength":3, "data": ['abc']};

    otp2p.delete(1, 2);

    assert.equal(otp2p.text(), 'a');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":1,
        "totalLength":3,
        "data": ['a', 2]
      }
    );

    // deletes first two characters with trailing tombstone
    otp2p.view = 'ab';
    otp2p.typeModel = {"charLength":2, "totalLength":3, "data": ['ab', 1]};

    otp2p.delete(0, 2);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":0,
        "totalLength":3,
        "data": [3]
      }
    );

    // deletes last two characters with preceding tombstone
    otp2p.view = 'bc';
    otp2p.typeModel = {"charLength":2, "totalLength":3, "data": [1, 'bc']};

    otp2p.delete(0, 2);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":0,
        "totalLength":3,
        "data": [3]
      }
    );

    // deletes middle two characters
    otp2p.view = 'abcd';
    otp2p.typeModel = {"charLength":4, "totalLength":4, "data": ['abcd']};

    otp2p.delete(1, 2);

    assert.equal(otp2p.text(), 'ad');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":2,
        "totalLength":4,
        "data": ['a', 2, 'd' ]
      }
    );

    // deletes middle two characters surrounded by tombstones
    otp2p.view = 'bc';
    otp2p.typeModel = {"charLength":2, "totalLength":4, "data": [1, 'bc', 1]};

    otp2p.delete(0, 2);

    assert.equal(otp2p.text(), '');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":0,
        "totalLength":4,
        "data": [4]
      }
    );

    // deletes with tombstones in between
    otp2p.view = 'abc';
    otp2p.typeModel = {
      "charLength":3,
      "totalLength":7,
      "data": [1, 'a', 1, 'b', 1, 'c', 1]
    };

    otp2p.delete(0, 2);

    assert.equal(otp2p.text(), 'c');
    assert.deepEqual(
      otp2p.typeModel,
      {
        "charLength":1,
        "totalLength":7,
        "data": [5, 'c', 1]
      }
    );

  });
});
