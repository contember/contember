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

type OnDeleteValidation = {
	entityName: string
	field: string
	hasOnDelete: boolean
}

export class StrictDefinitionValidator {
	public readonly warnings: Warning[] = []

	private readonly onDeleteValidations: OnDeleteValidation[] = []

	constructor(
		private readonly options: StrictOptions,
	) {
	}

	public validateInverseSide(entityName: string, field: string, definition: { inversedBy?: string }): void {
		if (!definition.inversedBy && this.options.requireInverseSide) {
			this.registerWarning(`${entityName}.${field}: inverse side of the relation is not defined.`)
		}
	}

	public validateOnCascade(entityName: string, field: string, definition: { onDelete?: Model.OnDelete }): void {
		// View entities are read-only and have no real delete semantics, so onDelete validation is
		// deferred to validateModel() where we know which entities are views.
		this.onDeleteValidations.push({ entityName, field, hasOnDelete: definition.onDelete !== undefined })
	}

	public validateModel(model: Model.Schema): void {
		for (const { entityName, field, hasOnDelete } of this.onDeleteValidations) {
			const isView = model.entities[entityName]?.view !== undefined
			if (isView) {
				if (hasOnDelete) {
					this.registerWarning(
						`${entityName}.${field}: onDelete behaviour must not be set on a relation of a view entity. Views are read-only and have no delete semantics.`,
					)
				}
				continue
			}
			if (!hasOnDelete && this.options.requireOnDelete) {
				this.registerWarning(
					`${entityName}.${field}: onDelete behaviour is not set. Use one of cascadeOnDelete(), setNullOnDelete() or restrictOnDelete().`,
				)
			}
		}
	}

	public registerWarning(message: string): void {
		this.warnings.push({ message })
	}
}
