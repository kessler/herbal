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
		if (this._progressState !== undefined) {
			throw new Error('write in progress')
		}

		if (this._streams.length === 0) {
			return callback(null, chunk)
		}

		this._progressState = new ProgressState(chunk, enc, callback)

		for (let stream of this._streams) {
			this._writeOne(stream)
		}
	}

	_writeOne(stream) {
		let { chunk, enc } = this._progressState
		let shouldContinue = stream.write(chunk, enc, err => {
			if (err) {
				return this._progressState.callback(err)
			}

			if (!shouldContinue) {
				this._progressState.chockedStreams.push(stream)
			} 

			if (++this._progressState.progress === this._streams.length) {
				this._onWriteAllFinished()
			}
		})
	}

	_onWriteAllFinished() {
		if (this._progressState.chockedStreams.length === 0) {
			return this._writeDone()
		}

		for (let chockedStream of this._progressState.chockedStreams) {
			chockedStream.on('drain', () => this._onDrain())
		}
	}

	_onDrain() {
		if (++this._progressState.drainProgress === this._progressState.chockedStreams.length) {
			this._writeDone()
		}
	}

	_writeDone() {
		let { chunk, callback } = this._progressState
		this._progressState = undefined
		return callback(null, chunk)
	}

	_hookEvents(stream) {
		this.once('finish', () => stream.end())
		if (this._isDestroyableStream(stream)) {
			this.once('error', () => stream.destroy())
		}
	}

	_isDestroyableStream(stream) {
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

class ProgressState {
	constructor(chunk, enc, callback) {
		this.chunk = chunk
		this.enc = enc
		this.callback = callback
		this.progress = 0
		this.drainProgress = 0
		this.chockedStreams = []
	}
}

module.exports = TeeStream