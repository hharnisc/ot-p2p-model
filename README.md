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

**Latest Version** 0.0.4

- Linting!

**Version** 0.0.3

- Bugfix - view to model index translation was reporting incorrect view index

**Version** 0.0.2

- Bugfix - deleting multiple characters was broadcasting the wrong index

**Version** 0.0.1

- Initial implementation, updates a local and remote models, emits insert, remove and broadcast events.

## TODO

- Nothing for now, bugfixes as they come along

## Quick Start

```javascript
var OTP2PModel = require('otp2p-model');
var otp2pModel = new OTP2PModel();

otp2pModel.on('delete', (command) => {
  console.log(command); // log the delete details
  console.log(otp2pModel.text());
});

otp2pModel.on('insert', (command) => {
  console.log(command); // log the insert details
  console.log(otp2pModel.text());
});

otp2pModel.on('broadcast', (command) => {
  console.log(command); // log the broadcast details
});

// single character operations
otp2pModel.insert('a', 0); // insert `a` at 0
otp2pModel.delete(0); // delete `a` at 0

// multiple character operations
otp2pModel.insert('hello', 0); // insert `hello` at 0
otp2pModel.delete(1, 4); // delete 'ello'
```

## Usage

### text

Visible text representation of the model

```javascript
otp2pModel.text()
```

### insert

Insert command that occurs locally (from a text box for example)

```javascript
otp2pModel.insert(index, string)
```

**index** - (zero based) location of where to insert the string
**string** - a sequence of characters  

### delete

Delete command that occurs locally (from a text box for example)

```javascript
otp2pModel.delete(index, numchars=1)
```
**index** - (zero based) location of where to insert the string  
**numchars** - the number of trailing characters to delete (default=1)

### remoteInsert

Insert command from a remote source (another peer)

```javascript
otp2pModel.remoteInsert(modelIndex, string)
```

**modelIndex** - (zero base) location of where to insert the string in the model  
**string** - a sequence of characters  

### remoteDelete

Delete command from a remote source (another peer)

```javascript
otp2pModel.deleteRemote(modelIndex, numchars=1)
```

**modelIndex** - (zero base) location of where to insert the string in the model  
**numchars** - the number of trailing characters to delete (default=1)

### Observables

#### insert

Emitted whenever local or remote insert commands are detected. If the command is remote indexes are converted to local.

#### delete

Emitted whenever local or remote delete commands are detected. If the command is remote indexes are converted to local.

#### broadcast

Emitted whenever local insert or delete commands have been completed, commands are converted to remote
