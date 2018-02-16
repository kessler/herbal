# herbal

**duplicate data into several streams**

[![npm status](http://img.shields.io/npm/v/temporal-aggregator.svg?style=flat-square)](https://www.npmjs.org/package/herbal) [![Travis build status](https://img.shields.io/travis/kessler/herbal.svg?style=flat-square&label=travis)](http://travis-ci.org/kessler/herbal) [![Dependency status](https://img.shields.io/david/kessler/herbal.svg?style=flat-square)](https://david-dm.org/kessler/herbal)

## example

`npm i -S herbal`

```js
const Tee = require('herbal')

// static factories
let tee1 = Tee.create(
    fs.createWriteStream('a'), 
    fs.createWriteStream('b')
)

let tee2 = Tee.createEx(
    { highWaterMark:123 },
    fs.createWriteStream('c'), 
    fs.createWriteStream('d')
)

let tee3 = Tee.createObjectStream(s1, s3, s3)

// constructor 
let tee4 = new Tee(
    [ 
        fs.createWriteStream('e'),
        fs.createWriteStream('f')
    ],
    { highWaterMark:123 }
)

// add more streams after construction
tee.add(fs.createWriteStream('g'))
tee.add(fs.createWriteStream('h'))

```

## license

[MIT](http://opensource.org/licenses/MIT) © Yaniv Kessler
