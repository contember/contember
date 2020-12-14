import { Validation } from '@contember/schema'
import { assertNever } from '../../utils'
import { InputValidation } from '@contember/schema-definition'

export class DependencyCollector {
	public static collect(validator: Validation.Validator): Dependencies {
		const dependenciesList = DependencyCollector.doCollect(validator, [])
		return dependenciesList.reduce((acc, deps) => this.withDependency(acc, deps), {})
	}

	private static withDependency(object: Dependencies, dependency: string[]): Dependencies {
		const part = dependency.shift()
		if (!part) {
			return object
		}

		return {
			...object,
			[part]: this.withDependency(object[part] || {}, [...dependency]),
		}
	}

	private static doCollect(validator: Validation.Validator, prefix: string[]): DependenciesList {
		if (validator.operation === InputValidation.InContextOperation) {
			const [pathArg, validatorArg] = validator.args
			const newPrefix = [...prefix, ...pathArg.path]
			const dependencies = DependencyCollector.doCollect(validatorArg.validator, newPrefix)

			return [newPrefix, ...dependencies]
		}

		const result: DependenciesList = []
		for (const arg of validator.args) {
			switch (arg.type) {
				//case Validation.ArgumentType.path:
				//	result.push([...prefix, ...arg.path])
				//	break
				case Validation.ArgumentType.validator:
					result.push(...DependencyCollector.doCollect(arg.validator, prefix))
					break
				case Validation.ArgumentType.literal:
					break
				default:
					assertNever(arg)
			}
		}
		return result
	}
}

export type DependenciesList = string[][]

export interface Dependencies {
	[field: string]: Dependencies
}
