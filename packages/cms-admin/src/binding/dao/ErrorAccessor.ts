import { Hashing } from '../utils'

class ErrorAccessor {
	private _key?: string

	public constructor(public readonly message: string) {}

	public get key() {
		if (this._key === undefined) {
			this._key = Hashing.hash(this.message).toString()
		}
		return this._key
	}
}

export { ErrorAccessor }
