import { Actions, Model } from '@contember/schema'
import { acceptFieldVisitor, isColumn } from '../model/index.js'
import { ErrorBuilder, ValidationError } from './errors.js'
import { assertNever } from '../utils/index.js'
import * as Typesafe from '@contember/typesafe'
import { whereSchema } from '../type-schema/where.js'
import { auditLogColumns } from '../actions/auditLogColumns.js'

const manyArgsSchema = (args: { schema: Model.Schema; entity: Model.Entity }) =>
	Typesafe.partial({
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
		this.validateTargets(schema, errorBuilder.for('targets'))
		return errorBuilder.errors
	}

	private validateTargets(schema: Actions.Schema, errorBuilder: ErrorBuilder) {
		for (const [name, target] of Object.entries(schema.targets)) {
			if (target.type === 'auditLog') {
				this.validateAuditLogTarget(target, errorBuilder.for(name))
			}
		}
	}

	private validateAuditLogTarget(target: Actions.AuditLogTarget, errorBuilder: ErrorBuilder): void {
		const entity = this.model.entities[target.entity]
		if (!entity) {
			errorBuilder.add('ACTIONS_UNDEFINED_ENTITY', `Audit-log target entity ${target.entity} not found.`)
			return
		}
		// An audit sink must be append-only: only the engine writes it. Without this the
		// Content API would expose create/update/delete and rows could be forged/tampered.
		if (!entity.immutable) {
			errorBuilder.add(
				'ACTIONS_AUDIT_LOG_MUTABLE_ENTITY',
				`Audit-log entity ${target.entity} must be immutable — extend AuditLogEntity or add @Immutable() so its rows cannot be forged, tampered with or deleted through the Content API.`,
			)
		}
		for (const column of auditLogColumns) {
			const field = entity.fields[column.name]
			if (!field) {
				if (column.required) {
					errorBuilder.add(
						'ACTIONS_AUDIT_LOG_MISSING_COLUMN',
						`Audit-log entity ${target.entity} is missing required column ${column.name} (${column.types.join(' | ')}).`,
					)
				}
				continue
			}
			if (!isColumn(field) || !column.types.includes(field.type)) {
				errorBuilder.add(
					'ACTIONS_AUDIT_LOG_INVALID_COLUMN',
					`Audit-log entity ${target.entity} column ${column.name} must be a ${column.types.join(' | ')} column.`,
				)
			} else if (column.name === 'eventNo' && field.sequence === undefined) {
				errorBuilder.add(
					'ACTIONS_AUDIT_LOG_INVALID_COLUMN',
					`Audit-log entity ${target.entity} column ${column.name} must be backed by a sequence.`,
				)
			}
		}
		if (target.rootRelation !== undefined) {
			this.validateAuditLogRootRelation(entity, target.rootRelation, errorBuilder.for('rootRelation'))
		}
	}

	private validateAuditLogRootRelation(entity: Model.Entity, relationName: string, errorBuilder: ErrorBuilder): void {
		const relation = entity.fields[relationName]
		if (!relation) {
			errorBuilder.add('ACTIONS_AUDIT_LOG_INVALID_ROOT_RELATION', `Audit-log root relation ${entity.name}.${relationName} not found.`)
			return
		}
		if (relation.type !== Model.RelationType.ManyHasOne) {
			errorBuilder.add(
				'ACTIONS_AUDIT_LOG_INVALID_ROOT_RELATION',
				`Audit-log root relation ${entity.name}.${relationName} must be a many-has-one relation.`,
			)
		}
	}

	private validateTriggers(schema: Actions.Schema, errorBuilder: ErrorBuilder) {
		for (const [name, def] of Object.entries(schema.triggers)) {
			const triggerErrorBuilder = errorBuilder.for(name)
			if (name !== def.name) {
				triggerErrorBuilder.add('ACTIONS_NAME_MISMATCH', `Trigger name ${def.name} does not match the name in a map ${name}`)
			}
			const target = schema.targets[def.target]
			if (!target) {
				triggerErrorBuilder.add('ACTIONS_UNDEFINED_TRIGGER_TARGET', `Trigger target ${def.target} not found`)
			} else if (target.type === 'auditLog' && def.type !== 'watch') {
				triggerErrorBuilder.add('ACTIONS_AUDIT_LOG_INVALID_TRIGGER', `Audit-log target ${def.target} can only be used by watch triggers.`)
			} else if (target.type === 'auditLog' && target.rootRelation !== undefined) {
				this.validateTriggerRootRelation(def, target, target.rootRelation, triggerErrorBuilder.for('target'))
			}
			this.validateTrigger(def, triggerErrorBuilder)
		}
	}

	private validateTriggerRootRelation(
		trigger: Actions.AnyTrigger,
		target: Actions.AuditLogTarget,
		rootRelation: string,
		errorBuilder: ErrorBuilder,
	): void {
		const sinkEntity = this.model.entities[target.entity]
		const relation = sinkEntity?.fields[rootRelation]
		if (!sinkEntity || !relation || relation.type !== Model.RelationType.ManyHasOne) {
			return
		}
		if (relation.target !== trigger.entity) {
			errorBuilder.add(
				'ACTIONS_AUDIT_LOG_INVALID_ROOT_RELATION',
				`Audit-log root relation ${target.entity}.${rootRelation} targets ${relation.target}, but trigger ${trigger.name} watches ${trigger.entity}.`,
			)
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
