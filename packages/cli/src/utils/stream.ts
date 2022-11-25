import { Transform } from 'stream'
import { Buffer } from 'node:buffer'


export class LineTransform extends Transform {
	private chunks: Buffer[] = []

	constructor(transform: (line: string) => string) {
		super({
			transform: (chunk, encoding, done) => {
				while (true) {
					const eolIndex = chunk.indexOf('\n')

					if (eolIndex < 0) {
						this.chunks.push(chunk)
						break
					}

					this.chunks.push(chunk.slice(0, eolIndex))
					chunk = chunk.slice(eolIndex + 1)
					this.push(transform(Buffer.concat(this.chunks).toString('utf8')) + '\n', 'utf8')
					this.chunks = []
				}

				return done()
			},

			flush: done => {
				if (this.chunks.length) {
					this.push(transform(Buffer.concat(this.chunks).toString('utf8')), 'utf8')
					return done()
				}
			},
		})
	}
}
