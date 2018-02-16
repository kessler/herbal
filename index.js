const { Transform } = require('stream')
const { isFunction } = require('util')

class TeeStream extends Transform {
	constructor(streams = [], options) {
		super(options)
		this._streams = []
		this.add(...streams)
	}

	add(...streams) {
		for (let stream of streams) {
			this._streams.push(stream)
			this._hookEvents(stream)
		}		
	}

	_transform(chunk, enc, callback) {
		this._writeAll(this._streams, 0, true, chunk, enc, callback)
	}

	_writeAll(streams, index, shouldContinue, chunk, enc, callback) {
		if (index === streams.length) {
			return callback(null, chunk)
		}

		let streamShouldContinue = streams[index].write(chunk, enc, (err) => {
			if (err) {
				return callback(err)
			}
			
			if (!streamShouldContinue) {
				shouldContinue = false
			}

			this._writeAll(streams, ++index, shouldContinue, chunk, enc, callback)
		})
	}

	_hookEvents(stream) {
		this.once('finish', () => stream.end())
		if (this._isDestroyableStream(stream)) {
			this.once('error', () => stream.destroy())
		}
	}

	_isDestroyableStream(stream){
		return isFunction(stream.destroy)
	}

	static create(...streams) {
		return new TeeStream(streams)
	}

	static createObjectStream(...streams) {
		return new TeeStream(streams, { objectMode: true })
	}

	static createEx(options, ...streams) {
		return new TeeStream(streams, options)
	}
}

const { Writable} = require('stream')

module.exports = TeeStream

