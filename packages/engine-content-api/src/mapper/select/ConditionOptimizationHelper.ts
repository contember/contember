export class ConditionOptimizationHelper {
	public static optimizeOr<P>(parts: readonly (P[] | boolean)[]): P[] | boolean {
		const resultParts: P[] = []
		for (const part of parts) {
			if (part === true) {
				return true
			}
			if (part === false) {
				continue
			}
			resultParts.push((part.length === 1 ? part[0] : { and: part }) as P)
		}
		return resultParts
	}

	public static optimizeAnd<P>(parts: readonly (P[] | boolean)[]): P[] | boolean {
		const resultParts: P[] = []
		let hasAlways = false
		for (const part of parts) {
			if (part === true) {
				hasAlways = true
				continue
			}
			if (part === false) {
				return false
			}
			resultParts.push(...part)
		}
		if (resultParts.length === 0 && hasAlways) {
			return true
		}
		return resultParts
	}
}
