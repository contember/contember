import ImplementationException from '../../core/exceptions/ImplementationException'

type MappingMap<Input extends string, Output extends string> = {
	[K in Input]: Output | ((input: Input) => Output | never)
}

export const mapValue = <Input extends string, Output extends string>(mapping: MappingMap<Input, Output>) => (
	input: Input,
): Output => {
	const mappingElement = mapping[input] as Output | (() => Output | never)
	if (!mappingElement) {
		throw new ImplementationException()
	}
	if (typeof mappingElement === 'function') {
		return mappingElement()
	}
	return mappingElement
}

export const mapValues = <Input extends string, Output extends string>(mapping: MappingMap<Input, Output>) => (
	values: Input[],
): Output[] => {
	const mapper = mapValue(mapping)
	return values.map(mapper)
}
