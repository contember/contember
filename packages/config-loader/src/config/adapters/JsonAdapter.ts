import Loader from '../Loader'

export class JsonAdapter implements Loader.Adapter {
	parse(input: string): any {
		return JSON.parse(input)
	}
}
