export type Path = (string | number)[]
export type DataResolver = (path: Path) => any
export type ParametersResolver = (parameterParts: string[], path: Path, dataResolver: DataResolver) => string

export class UndefinedParameterError extends Error {}

export const createObjectParametersResolver =
	(parameters: any): ParametersResolver =>
	parts =>
		parts.reduce((current, part) => {
			if (current === null || typeof current !== 'object' || typeof current[part] === 'undefined') {
				throw new UndefinedParameterError(`Parameter "${parts.join('.')}" not found.`)
			}
			return current[part]
		}, parameters)

export const resolveParameters = (data: any, parametersResolver: ParametersResolver): any => {
	let recursionLevel = 0
	const dataResolver: DataResolver = path => {
		const value = path.reduce((value, part) => {
			if (typeof part === 'string') {
				if (typeof value === 'object' && value !== null && typeof value[part] !== 'undefined') {
					return value[part]
				}
			} else {
				if (Array.isArray(value) && typeof value[part] !== 'undefined') {
					return value[part]
				}
			}
			return undefined
		}, data)
		if (recursionLevel++ > 20) {
			throw new Error('Possible recursion in configuration')
		}
		const result = resolveParametersInternal(value, path, (parts, path) =>
			parametersResolver(parts, path, dataResolver),
		)
		recursionLevel--
		return result
	}
	return resolveParametersInternal(data, [], (parts, path) => parametersResolver(parts, path, dataResolver))
}

const resolveParametersInternal = (
	data: any,
	path: Path,
	parametersResolver: (parts: string[], path: Path) => string,
): any => {
	if (Array.isArray(data)) {
		return data.map((it, index) => resolveParametersInternal(it, [...path, index], parametersResolver))
	}
	if (typeof data === 'string') {
		const match = /^%(\?)?(\w+(?:\.\w+)*)(?:::(\w+))?%$/.exec(data)
		if (match) {
			const [, optional, parameter, cast] = match
			const parts = parameter.split('.')
			try {
				const value = parametersResolver(parts, path)
				if (cast) {
					switch (cast) {
						case 'number':
							return Number(value)
						case 'string':
							return String(value)
						case 'bool':
							return value === 'true' || value === 'on' || value === '1'
						default:
							throw new Error(`Unsupported cast to ${cast}`)
					}
				}
				return value
			} catch (e) {
				if (optional && e instanceof UndefinedParameterError) {
					return undefined
				}
				throw e
			}
		} else {
			return data
		}
	}
	if (data === null) {
		return data
	}
	if (typeof data === 'object') {
		return Object.entries(data)
			.map(([key, value]: [string, any]) => [key, resolveParametersInternal(value, [...path, key], parametersResolver)])
			.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
	}
	return data
}
