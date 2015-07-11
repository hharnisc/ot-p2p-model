"use strict";

import EventEmitter from "eventemitter3";
import { type } from "ot-text-tp2";
import { Wayback } from "wayback";

const api = Symbol("api");
const snapshot = Symbol("snapshot");
const getSnapshot = Symbol("getSnapshot");
const submitOp = Symbol("submitOp");
const wayback = Symbol("wayback");

class OTP2P extends EventEmitter {

  constructor(text="") {
    super();
    this[snapshot] = type.create(text);
    this[wayback] = new Wayback();
    this[api] = type.api(
      this[getSnapshot].bind(this),
      this[submitOp].bind(this)
    );
  }

  [getSnapshot]() {
    return this[snapshot];
  }

  [submitOp](op, cb) {
    op = type.normalize(op);
    this[snapshot] = type.apply(this[snapshot], op);
    cb(op);
  }

  get() {
    return this[api].get();
  }

  insert(index, text) {
    this[api].insert(index, text, (op) => {
      this.emit('broadcast', { op: op, revision: this[wayback].push(op) });
    });
  }

  delete(index, numChars) {
    this[api].remove(index, numChars, (op) => {
      this.emit('broadcast', { op: op, revision: this[wayback].push(op) });
    });
  }
}

module.exports = OTP2P;
