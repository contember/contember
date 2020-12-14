import { tuple } from '../../utils'
import { Dependencies } from './DependencyCollector'

export class DependencyMerger {
	static merge(a: Dependencies, b: Dependencies): Dependencies {
		return Object.entries(a)
			.map(([field, deps]) => tuple(field, DependencyMerger.merge(deps, b[field] || {})))
			.reduce((acc, [field, deps]) => ({ ...acc, [field]: deps }), b)
	}
}
