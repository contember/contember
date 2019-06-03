import DependencyCollector from './DependencyCollector'
import { tuple } from '../../utils/tuple'

export default class DependencyMerger {
	static merge(
		a: DependencyCollector.Dependencies,
		b: DependencyCollector.Dependencies
	): DependencyCollector.Dependencies {
		return Object.entries(a)
			.map(([field, deps]) => tuple(field, DependencyMerger.merge(deps, b[field] || {})))
			.reduce((acc, [field, deps]) => ({ ...acc, [field]: deps }), b)
	}
}
