const { expect } = require('chai')
const TeeStream = require('./index')
const { Writable, Readable } = require('stream')
const pump = require('pump')

describe('TeeStream', () => {
	let source, i1, i2, tee, expectedResult

	it('duplicates input into several streams', done => {
		tee.add(i1, i2)
		pump(source, tee, err => {
			if (err) return done(err)

			expect(i1.results).to.deep.equal(expectedResult)
			expect(i2.results).to.deep.equal(expectedResult)

			done()
		})
	})

	it('runs as fast as the slowest stream: outputs progress as the slowest stream', done => {

		let i3 = new PausingWritable()
		tee.add(i3, i2)

		pump(source, tee, err => {
			if (err) return done(err)

			expect(i3.results).to.deep.equal(expectedResult)
			expect(i2.results).to.deep.equal(expectedResult)

			done()
		})

		function proceed() {
			expect(i3.results).to.deep.equal(i2.results)
			setTimeout(() => {
				if (!i3._writableState.ended) {
					i3.proceed()
					proceed()
				}
			}, 100)
		}

		proceed()
	})

	it('is readable', done => {
		tee.add(i1, i2)
		let i3 = new AWritable()
		pump(source, tee, i3, err => {
			if (err) return done(err)
			expect(i3.results).to.deep.equal(expectedResult)
			done()
		})
	})

	it('is readable when no streams are added', done => {
		let i3 = new AWritable()
		pump(source, tee, i3, err => {
			if (err) return done(err)
			expect(i3.results).to.deep.equal(expectedResult)
			done()
		})
	})

	it('closes the target streams', done => {
		tee.add(i1, i2)
		let state = {}

		i1.on('finish', () => state.i1finish = true)
		i2.on('finish', () => state.i2finish = true)

		pump(source, tee, err => {
			if (err) return done(err)

			expect(state.i1finish).to.be.true
			expect(state.i2finish).to.be.true
			done()
		})
	})

	it.skip('destroys the target streams on error', done => {
		tee.add(i1, i2)

		i1.on('close', () => console.log(123232))
		// tee.on('error', () => {})
		// tee.emit('error', new Error())

		done()
	})

	it('very large input', function(done) {
		this.timeout(10000)

		let i3 = new AWritable()
		i2 = new ChockingWritable()
		tee.add(i2)

		source = new Generator(1000)

		pump(source, tee, i3, err => {
			if (err) return done(err)
			expect(i3.results).to.have.length(1000)
			done()
		})
	})

	beforeEach(() => {
		expectedResult = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].reverse()
		source = new Generator()
		i1 = new AWritable()
		i2 = new AWritable()
		tee = new TeeStream()
	})

	class AWritable extends Writable {
		constructor(delay = 0, options) {
			super(options)
			this.results = []
			this.delay = delay
		}

		_write(chunk, enc, callback) {
			this.results.push(chunk.toString())
			setTimeout(callback, this.delay)
		}
	}

	class ChockingWritable extends AWritable {
		constructor(delay = 0, options) {
			super(options)
			this.results = []
			this.delay = delay
			this._first = true
		}

		write(data, enc, cb) {
			if (this._first) {
				this._first = false
				this.results.push(data.toString())
				setImmediate(cb)
				setTimeout(() => this.emit('drain'), 100)
				return false
			}

			return super.write(data, cb)
		}
	}

	class PausingWritable extends Writable {
		constructor(options) {
			super(options)
			this.results = []
		}

		_write(chunk, enc, callback) {
			this.results.push(chunk.toString())
			this._callback = callback
		}

		proceed() {
			if (typeof(this._callback) === 'function') {
				this._callback()
			}
		}
	}

	class Generator extends Readable {
		constructor(max = 10, options) {
			super(options)
			this.max = max
		}

		_read(size) {
			while (--size > 0 && this.max > 0) {
				this.push((this.max--).toString())
			}

			if (this.max === 0) {
				this.push(null)
			}
		}
	}
})