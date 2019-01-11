import { Value } from 'slate'
import Html from 'slate-html-serializer'

export default class JsonSerializer {
	constructor(private htmlSerializer: Html) {}
	serialize(value: Value): string {
		return JSON.stringify(value.toJSON())
	}
	deserialize(str: string): Value {
		try {
			return Value.fromJSON(JSON.parse(str))
		} catch (error) {
			str && console.warn(error)
			return this.htmlSerializer.deserialize(str)
		}
	}
}
