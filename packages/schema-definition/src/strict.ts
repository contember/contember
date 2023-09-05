import { Model } from '@contember/schema'

export type StrictOptions = {
	requireOnDelete?: boolean
	requireInverseSide?: boolean
}

export const allStrict: StrictOptions = {
	requireOnDelete: true,
	requireInverseSide: true,
}


export type Warning = { message: string }

export class StrictDefinitionValidator {
	public readonly warnings: Warning[] = []

	constructor(
		private readonly options: StrictOptions,
	) {
	}

	public validateInverseSide(entityName: string, field: string, definition: { inversedBy?: string }): void {
		if (!definition.inversedBy && this.options.requireInverseSide) {
			this.registerWarning(`${entityName}.${field}: inverse side of the relation is not defined.`)
		}
	}


	public validateOnCascade(entityName: string, field: string, definition: { onDelete?: Model.OnDelete}): void {
		if (!definition.onDelete && this.options.requireOnDelete) {
			this.registerWarning(`${entityName}.${field}: onDelete behaviour is not set. Use one of cascadeOnDelete(), setNullOnDelete() or restrictOnDelete().`)
		}
	}

	public registerWarning(message: string): void {
		this.warnings.push({ message })
	}
}
