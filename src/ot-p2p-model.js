"use strict";

import EventEmitter from "eventemitter3";
import { type } from "ot-text-tp2";
import { Wayback } from "wayback";

const api = Symbol("api");
const snapshot = Symbol("snapshot");
const getSnapshot = Symbol("getSnapshot");
const submitOp = Symbol("submitOp");
const wayback = Symbol("wayback");

export class OTP2PModel extends EventEmitter {

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
    let revision = this[wayback].push(op);
    cb(op, revision);
  }

  get() {
    return this[api].get();
  }

  insert(index, text) {
    this[api].insert(index, text, (op, revision) => {
      this.emit('broadcast', { op: op, revision: revision});
    });
  }

  delete(index, numChars) {
    this[api].remove(index, numChars, (op, revision) => {
      this.emit('broadcast', { op: op, revision: revision});
    });
  }

  remoteOp(parent, op) {
    if (parent === this[wayback].head()) {
      this[submitOp](op, () => {});
    } else {
      let sequence = this[wayback].getSequence(parent);
      let composedSequence = sequence.reduce((p, c) => {
        return type.compose(p, c);
      });
      this[submitOp](type.transform(op, composedSequence, 'left'), () => {});
    }
  }
}
