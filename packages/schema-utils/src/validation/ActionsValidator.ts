import { Actions, Model } from '@contember/schema'
import { acceptFieldVisitor } from '../model'
import { ErrorBuilder, ValidationError } from './errors'
import { assertNever } from '../utils'
import * as Typesafe from '@contember/typesafe'
import { whereSchema } from '../type-schema/where'

const manyArgsSchema = (args: {schema: Model.Schema; entity: Model.Entity}) => Typesafe.partial({
	limit: Typesafe.integer,
	offset: Typesafe.integer,
	orderBy: Typesafe.array(Typesafe.anyJsonObject),
	filter: whereSchema(args),
})

export class ActionsValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(schema: Actions.Schema): ValidationError[] {
		const errorBuilder = new ErrorBuilder([], ['actions'])
		this.validateTriggers(schema, errorBuilder.for('triggers'))
		return errorBuilder.errors
	}

	private validateTriggers(schema: Actions.Schema, errorBuilder: ErrorBuilder) {
		for (const [name, def] of Object.entries(schema.triggers)) {
			const triggerErrorBuilder = errorBuilder.for(name)
			if (name !== def.name) {
				triggerErrorBuilder.add('ACTIONS_NAME_MISMATCH', `Trigger name ${def.name} does not match the name in a map ${name}`)
			}
			if (!schema.targets[def.target]) {
				triggerErrorBuilder.add('ACTIONS_UNDEFINED_TRIGGER_TARGET', `Trigger target ${def.target} not found`)
			}
			this.validateTrigger(def, triggerErrorBuilder)
		}
	}


	private validateTrigger(trigger: Actions.AnyTrigger, errorBuilder: ErrorBuilder): void {
		const entity = this.model.entities[trigger.entity]
		if (!entity) {
			errorBuilder.add('ACTIONS_UNDEFINED_ENTITY', `Entity ${trigger.entity} not found.`)
			return
		}

		switch (trigger.type) {
			case 'watch':
				this.validateWatchTrigger(trigger, entity, errorBuilder)
				break
			case 'basic':
				this.validateBasicTrigger(trigger, entity, errorBuilder)
				break
			default:
				assertNever(trigger)
		}
	}

	private validateWatchTrigger(trigger: Actions.WatchTrigger, entity: Model.Entity, errorBuilder: ErrorBuilder): void {
		this.validateSelection(trigger.watch, entity, errorBuilder.for('watch'))
		if (trigger.selection) {
			this.validateSelection(trigger.selection, entity, errorBuilder.for('selection'))
		}
	}

	private validateBasicTrigger(trigger: Actions.BasicTrigger, entity: Model.Entity, errorBuilder: ErrorBuilder): void {
		if (trigger.selection) {
			this.validateSelection(trigger.selection, entity, errorBuilder.for('selection'))
		}

		if (Array.isArray(trigger.update)) {
			for (const field of trigger.update) {
				if (!entity.fields[field]) {
					errorBuilder.for('update').add('ACTIONS_UNDEFINED_FIELD', `Field ${field} of entity ${entity.name} not found.`)
				}
			}
		}
	}

	private validateSelection(
		selectionNode: Actions.SelectionNode,
		entity: Model.Entity,
		errorBuilder: ErrorBuilder,
	): void {
		for (const part of selectionNode) {
			const [field, args, selection] = Array.isArray(part) ? part : [part, {}, []]
			const fieldErrorBuilder = errorBuilder.for(field)
			if (!entity.fields[field]) {
				fieldErrorBuilder.add('ACTIONS_UNDEFINED_FIELD', `Undefined field ${field} on entity ${entity.name}`)
				continue
			}
			acceptFieldVisitor(this.model, entity, field, {
				visitColumn: () => {
					if (selection.length) {
						fieldErrorBuilder.add('ACTIONS_INVALID_SELECTION', `Unexpected sub selection on a column.`)
					}
					if (Object.keys(args).length !== 0) {
						fieldErrorBuilder.add('ACTIONS_INVALID_SELECTION', `Unexpected args on a column.`)
					}
				},
				visitHasMany: ({ targetEntity }) => {
					if (selection.length === 0) {
						fieldErrorBuilder.add('ACTIONS_INVALID_SELECTION', `Sub-selection expected on a relation.`)
					}
					this.validateSelection(selection, targetEntity, fieldErrorBuilder)
					try {
						manyArgsSchema({ schema: this.model, entity: targetEntity })(args)
					} catch (e: any) {
						fieldErrorBuilder.add('ACTIONS_INVALID_SELECTION', `Selection args are not valid: ` + e.message)
					}
				},
				visitHasOne: ({ targetEntity }) => {
					if (selection.length === 0) {
						fieldErrorBuilder.add('ACTIONS_INVALID_SELECTION', `Sub-selection expected on a relation.`)
					}
					this.validateSelection(selection, targetEntity, fieldErrorBuilder)
				},
			})
		}
	}
}
