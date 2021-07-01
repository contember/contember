import Loader from '../Loader'
import * as yaml from 'js-yaml'

export class YamlAdapter implements Loader.Adapter {
	parse(input: string): any {
		return yaml.load(input)
	}
}
