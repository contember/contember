import { Value } from '@contember/schema'

export interface DataManipulationBuilder {
	addFieldValue(
		fieldName: string,
		value: Value.GenericValueLike<Value.AtomicValue<AbortDataManipulation | undefined>>,
	): Promise<Value.AtomicValue<AbortDataManipulation | undefined>>
}


export const AbortDataManipulation = Symbol('AbortDataManipulation')
export type AbortDataManipulation = typeof AbortDataManipulation
