"use strict";

var EventEmitter = require("eventemitter3");
var type = require("ot-text-tp2").type;
var _ = require("lodash");

class OTP2P extends EventEmitter {

  constructor(doc="") {
    super();
    this.view = doc;
    this.typeModel = type.create(doc);
  }

  text() {
    return this.view;
  }

  insert(index, chars) {
    if (index > this.view.length || index < 0) {
      throw new Error("Index is out of range");
    }

    var op = this.generateOp(
      { "i": chars },
      index,
      this.view,
      type.serialize(this.typeModel)
    );

    this.view = [
      this.view.slice(0, index),
      chars,
      this.view.slice(index)
    ].join("");

    this.typeModel = type.apply(this.typeModel, op);
    this.emit("insert", {index: index, value: chars});
    this.emit("broadcast", {
      type: "insert",
      index: this.viewToModelIndex(
        index,
        this.view,
        type.serialize(this.typeModel)
      ),
      value: chars
    });
  }

  delete(index, numChars=1) {
    var op = this.generateOp(
      {"d": numChars},
      index,
      this.view,
      type.serialize(this.typeModel)
    );

    var broadcastModelIndex = this.viewToModelIndex(
      index,
      this.view,
      type.serialize(this.typeModel)
    );

    var modelNumChars = this.viewEffectedToModelEffected(
     index,
     numChars,
     this.view,
     type.serialize(this.typeModel)
    );

    this.view = [
      this.view.slice(0, index),
      this.view.slice(index + numChars)
    ].join("");
    this.typeModel = type.apply(this.typeModel, op);

    this.emit("delete", {index: index, numChars: numChars});
    this.emit("broadcast", {
      type: "delete",
      index: broadcastModelIndex,
      numChars: modelNumChars
    });
  }

  remoteInsert(modelIndex, chars) {
    var op = this.generateRemoteOp(
      {"i": chars},
      modelIndex,
      type.serialize(this.typeModel)
    );

    this.typeModel = type.apply(this.typeModel, op);
    this.view = this.modelItemsToView(type.serialize(this.typeModel));
    this.emit("insert", {
      index: this.modelIndexToViewIndex(modelIndex, type.serialize(this.typeModel)),
      value: chars
      }
    );
  }

  remoteDelete(modelIndex, numChars=1) {
    var op = this.generateRemoteOp(
      {"d": numChars},
      modelIndex,
      type.serialize(this.typeModel)
    );

    var viewIndex = this.modelIndexToViewIndex(
      modelIndex,
      type.serialize(this.typeModel)
    );

    var viewNumEffected = this.modelEffectedToViewEffected(
      modelIndex, numChars, type.serialize(this.typeModel)
    );

    this.typeModel = type.apply(this.typeModel, op);
    this.view = this.modelItemsToView(type.serialize(this.typeModel));
    this.emit("delete", {
      index: viewIndex,
      numChars: viewNumEffected
    });
  }

  generateRemoteOp(baseOp, modelIndex, model) {
    var op = [];
    if(modelIndex > 0){
      op.push(modelIndex);
    }

    op.push(baseOp);

    var isDeleteOp = !!baseOp.d;
    var modelLength = this.modelLength(model);
    var charsEffected = isDeleteOp ? baseOp.d : baseOp.i.length;
    var newModelLength = isDeleteOp ? modelLength : modelLength + charsEffected;
    var trailingChars = newModelLength - modelIndex - charsEffected;
    if (trailingChars > 0) {
      op.push(trailingChars);
    }

    return op;
  }

  generateOp(baseOp, index, view, model) {
    var op = [];

    var modelIndex = this.viewToModelIndex(index, view, model);
    if (modelIndex > 0) {
      op.push(modelIndex);
    }

    var isDeleteOp = !!baseOp.d;
    var charsEffected = isDeleteOp ? baseOp.d : baseOp.i.length;

    if (isDeleteOp && charsEffected > 1) {

      var lastVisibleIndex = this.viewToModelIndex(
        index + charsEffected - 1, // zero based
        view,
        model
      );
      charsEffected = lastVisibleIndex - modelIndex + 1;
      op.push({
        "d": charsEffected
      });
    } else {
      op.push(baseOp);
    }

    var modelLength = this.modelLength(model);
    var newModelLength = isDeleteOp ? modelLength : modelLength + charsEffected;

    var trailingChars = newModelLength - modelIndex - charsEffected;
    if (trailingChars > 0) {
      op.push(trailingChars);
    }
    return op;
  }

  viewToModelIndex(viewIndex, view, model) {
    if (view !== this.modelItemsToView(model)){
      throw new Error("Model and view don't match");
    }
    if (viewIndex < 0 ) { throw new Error("Index is out of range"); }
    if (view.length === 0 && viewIndex === 0) { return 0; }
    if (viewIndex === view.length){
      return this.lastVisibleCharacterIndex(model) + 1;
    }


    var curModelIndex = 0;
    var curViewIndex = 0;
    var modelIndex = 0;

    // TODO: rewrite this with a for loop
    while (curViewIndex <= viewIndex) {
      var modelItem = model[modelIndex];
      if (this.isTombstone(modelItem)) {
        curModelIndex += modelItem;
      } else {
        curModelIndex += Math.min(viewIndex - curViewIndex, modelItem.length);
        curViewIndex += modelItem.length;
      }
      modelIndex += 1;
    }
    return curModelIndex;
  }

  modelIndexToViewIndex(modelIndex, model) {
    // count all of the tombstones before the modelIndex
    var numberTombstones = this.countTombstonesInRange(
      0,
      modelIndex,
      model
    );
    return modelIndex - numberTombstones;
  }

  isTombstone(item) {
    return _.isNumber(item);
  }

  modelItemsToView(model) {
    var that = this;
    return model.filter((item) => !that.isTombstone(item)).join("");
  }

  modelEffectedToViewEffected(modelIndex, numEffected, model) {
    return numEffected -
    this.countTombstonesInRange(
      modelIndex,
      modelIndex + numEffected,
      model
    );
  }

  viewEffectedToModelEffected(index, numEffected, view, model) {
    var first = this.viewToModelIndex(index, view, model);
    var last = this.viewToModelIndex(index + numEffected - 1, view, model);
    var tombstonesBetween = this.countTombstonesInRange(first, last, model);
    return numEffected + tombstonesBetween;
  }

  countTombstonesInRange(start, end, model) {
    var tombstonesInRange = 0;
    var realIndex = 0;
    for (var i = 0; i < model.length; i++) {
      var curModel = model[i];
      if (this.isTombstone(curModel)) {
        var x1 = realIndex;
        var x2 = realIndex + curModel;
        var y1 = start;
        var y2 = end;
        if (Math.max(x1, y1) < Math.min(x2, y2)) {
          tombstonesInRange += (Math.min(x2, y2) - Math.max(x1, y1));
        }
        realIndex += curModel;
      } else {
        realIndex += curModel.length;
      }
    }
    return tombstonesInRange;
  }


  modelLength(model) {
    if (model.length === 0) { return 0; }
    var that = this;
    return model
    .map((item) => that.isTombstone(item) ? item : item.length)
    .reduce((p, c) => p + c);
  }

  lastVisibleCharacterIndex(model) {
    if (model.length === 0) { return -1; }
    var trailingInvisible = 0;
    for (var i = model.length - 1; i >= 0; i--) {
      if (this.isTombstone(model[i])) {
        trailingInvisible += model[i];
      } else {
        break;
      }
    }
    if (i < 0 ) { return -1; }
    var modelLength = this.modelLength(model);
    return modelLength - trailingInvisible - 1;
  }
}

module.exports = OTP2P;
