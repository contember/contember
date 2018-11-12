import { GraphQlBuilder } from 'cms-client'
import { assertNever } from 'cms-common'
import { Filter, VariableInput } from '../bindingTypes'
import { DataBindingError, Environment, Literal, VariableLiteral, VariableScalar } from '../dao'

export class VariableInputTransformer {
	public constructor(private input: Filter | undefined, private readonly environment: Environment) {}

	public transform(): Filter<GraphQlBuilder.Literal> | undefined {
		if (this.input === undefined) {
			return undefined
		}
		return this.transformWhere(this.input) as Filter<GraphQlBuilder.Literal>
	}

	private transformWhere = (
		where: VariableInputTransformer.Where<VariableInput>
	): VariableInputTransformer.Where<GraphQlBuilder.Literal> => {
		const mapped: VariableInputTransformer.Where<GraphQlBuilder.Literal> = {}

		for (const key in where) {
			const field = where[key]

			if (
				typeof field === 'string' ||
				typeof field === 'boolean' ||
				typeof field === 'number' ||
				field === null ||
				field === undefined
			) {
				mapped[key] = field
			} else if (Array.isArray(field)) {
				mapped[key] = field.map(this.transformWhere)
			} else if (field instanceof VariableScalar) {
				const value = this.environment.getValue(field.variable)

				if (
					typeof value !== 'string' &&
					typeof value !== 'boolean' &&
					typeof value !== 'number' &&
					value !== null &&
					value !== undefined
				) {
					throw new DataBindingError(
						`The value of the '${field.variable}' must be a scalar or null, not '${typeof value}'.`
					)
				}
				mapped[key] = value
			} else if (field instanceof VariableLiteral) {
				const value = this.environment.getValue(field.variable)

				if (typeof value !== 'string') {
					throw new DataBindingError(`The value of the '${field.variable}' must be a string, not '${typeof value}'.`)
				}
				mapped[key] = new GraphQlBuilder.Literal(value)
			} else if (field instanceof Literal) {
				mapped[key] = field
			} else if (typeof field === 'object') {
				mapped[key] = this.transformWhere(field)
			} else {
				assertNever(field)
			}
		}

		return mapped
	}
}

namespace VariableInputTransformer {
	export type Where<T> = {
		[name: string]: T | null | number | undefined | string | boolean | Where<T> | Where<T>[]
	}
}
