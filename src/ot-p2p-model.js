"use strict";

let EventEmitter = require("eventemitter3");
let type = require("ot-text-tp2").type;

const api = Symbol("api");
const snapshot = Symbol("snapshot");
const getSnapshot = Symbol("getSnapshot");
const submitOp = Symbol("submitOp");

class OTP2P extends EventEmitter {

  constructor(text="") {
    super();
    this[snapshot] = type.create(text);
    this[api] = type.api(this[getSnapshot].bind(this), this[submitOp].bind(this));
  }

  [getSnapshot]() {
    return this[snapshot];
  }

  [submitOp](op, cb) {
    op = type.normalize(op);
    this[snapshot] = type.apply(this[snapshot], op);
    cb();
  }

  get() {
    return this[api].get();
  }

  insert(index, text) {
    this[api].insert(index, text, () => {});
  }

  delete(index, numChars) {
    this[api].remove(index, numChars, () => {});
  }
}

module.exports = OTP2P;
