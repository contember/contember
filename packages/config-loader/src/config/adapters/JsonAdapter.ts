import Loader from '../Loader.js'

export class JsonAdapter implements Loader.Adapter {
	parse(input: string): any {
		return JSON.parse(input)
	}
}
