import { Validation } from '@contember/schema'
import { assertNever } from 'cms-common'
import { InputValidation } from '@contember/schema-definition'

class DependencyCollector {
	public collect(validator: Validation.Validator): DependencyCollector.Dependencies {
		const dependenciesList = this.doCollect(validator, [])
		return dependenciesList.reduce((acc, deps) => this.withDependency(acc, deps), {})
	}

	private withDependency(
		object: DependencyCollector.Dependencies,
		dependency: string[],
	): DependencyCollector.Dependencies {
		const part = dependency.shift()
		if (!part) {
			return object
		}

		return {
			...object,
			[part]: this.withDependency(object[part] || {}, [...dependency]),
		}
	}

	private doCollect(validator: Validation.Validator, prefix: string[]): DependencyCollector.DependenciesList {
		if (validator.operation === InputValidation.InContextOperation) {
			const [pathArg, validatorArg] = validator.args
			const newPrefix = [...prefix, ...pathArg.path]
			const dependencies = this.doCollect(validatorArg.validator, newPrefix)

			return [newPrefix, ...dependencies]
		}

		const result: DependencyCollector.DependenciesList = []
		for (const arg of validator.args) {
			switch (arg.type) {
				//case Validation.ArgumentType.path:
				//	result.push([...prefix, ...arg.path])
				//	break
				case Validation.ArgumentType.validator:
					result.push(...this.doCollect(arg.validator, prefix))
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

namespace DependencyCollector {
	export type DependenciesList = string[][]

	export interface Dependencies {
		[field: string]: Dependencies
	}
}

export default DependencyCollector
