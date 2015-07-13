"use strict";

import EventEmitter from "eventemitter3";
import { type } from "ot-text-tp2";
import { Wayback } from "wayback";

const api = Symbol("api");
const snapshot = Symbol("snapshot");
const getSnapshot = Symbol("getSnapshot");
const submitOp = Symbol("submitOp");
const wayback = Symbol("wayback");
const broadcast = Symbol("broadcast");

export class OTP2PModel extends EventEmitter {

  constructor(text="", maxHistory=100) {
    super();
    this[snapshot] = type.create(text);
    this[wayback] = new Wayback(maxHistory);
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

  [broadcast](op, revision) {
    let parent = this[wayback].getRevision(revision).parent;
    this.emit('broadcast', { op: op, revision: parent});
  }

  get() {
    return this[api].get();
  }

  insert(index, text) {
    this[api].insert(index, text, (op, revision) => {
      this[broadcast](op, revision);
    });
  }

  delete(index, numChars) {
    this[api].remove(index, numChars, (op, revision) => {
      this[broadcast](op, revision);
    });
  }

  remoteOp(parent, op) {
    if (parent === this[wayback].head()) {
      this[submitOp](op, () => {});
    } else {
      let sequence = this[wayback].getSequence(parent);
      if (sequence === null) {
        this.emit('resync');
      } else {
        let composedSequence = sequence.reduce((p, c) => {
          return type.compose(p, c);
        });
        this[submitOp](type.transform(op, composedSequence, 'left'), () => {});
      }
    }
  }

  getFirstOp() {
    return this[wayback].tail();
  }

  getLastOp() {
    return this[wayback].head();
  }

  importModel(model) {
    this[snapshot] = type.deserialize(model);
  }

  exportModel() {
    return type.serialize(this[snapshot]);
  }

  importHistory(history) {
    this[wayback].importModel(history);
  }

  exportHistory() {
    return this[wayback].exportModel();
  }

}
