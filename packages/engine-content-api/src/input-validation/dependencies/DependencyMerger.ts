import { tuple } from '../../utils/index.js'
import { Dependencies } from './DependencyCollector.js'

export class DependencyMerger {
	static merge(a: Dependencies, b: Dependencies): Dependencies {
		return Object.entries(a)
			.map(([field, deps]) => tuple(field, DependencyMerger.merge(deps, b[field] || {})))
			.reduce((acc, [field, deps]) => ({ ...acc, [field]: deps }), b)
	}
}
