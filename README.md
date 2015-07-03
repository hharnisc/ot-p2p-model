# OT P2P Model

[![Build Status](https://travis-ci.org/hharnisc/ot-p2p-model.svg?branch=master)](https://travis-ci.org/hharnisc/ot-p2p-model)

Maintain local and remote models for P2P based OT system

Implements the following [white paper](http://www.loria.fr/~urso/uploads/Main/oster06collcom.pdf).

**Table of Contents**

- [History](#history)
- [TODO](#TODO)
- [Quick Start](#quick-start)
- [Usage](#usage)

## History

**Latest Version** 0.0.1

- WIP

## TODO

- Remote operations
- Observables

## Quick Start

```javascript
var OTP2PModel = require('otp2p-model');
var otp2pModel = new OTP2PModel();

// single character operations
otp2pModel.insert('a', 0); // insert `a` at 0
otp2pModel.delete(0); // delete `a` at 0

// multiple character operations
otp2pModel.insert('hello', 0); // insert `hello` at 0
otp2pModel.delete(1, 4); // delete 'ello'
```

## Usage

### insert

Insert command that occurs locally (from a text box for example)

```javascript
otp2pModel.insert(string, index)
```

**string** - a sequence of characters  
**index** - (zero based) location of where to insert the string

### delete

Delete command that occurs locally (from a text box for example)

```javascript
otp2pModel.delete(index, numchars=1)
```
**index** - (zero based) location of where to insert the string  
**numchars** - the number of trailing characters to delete (default=1)

### remoteDelete

Delete command from a remote source (another peer)

```javascript
otp2pModel.deleteRemote(modelIndex, numchars=1)
```

**modelIndex** - (zero base) location of where to insert the string in the model
**numchars** - the number of trailing characters to delete (default=1)
