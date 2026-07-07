import { Model, Retention } from '@contember/schema'
import { acceptEveryFieldVisitor, isColumn } from '../model/index.js'
import { ErrorBuilder, ValidationError } from './errors.js'
import { assertNever } from '../utils/index.js'
import { whereSchema } from '../type-schema/where.js'

export class RetentionValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(schema: Retention.Schema): ValidationError[] {
		const errorBuilder = new ErrorBuilder([], ['retention', 'policies'])
		for (const [name, policy] of Object.entries(schema.policies)) {
			this.validatePolicy(name, policy, errorBuilder.for(name))
		}
		return errorBuilder.errors
	}

	private validatePolicy(name: string, policy: Retention.Policy, errorBuilder: ErrorBuilder): void {
		if (name !== policy.name) {
			errorBuilder.add('RETENTION_NAME_MISMATCH', `Retention policy name ${policy.name} does not match the name in a map ${name}.`)
		}

		const entity = this.model.entities[policy.entity]
		if (!entity) {
			errorBuilder.add('RETENTION_UNDEFINED_ENTITY', `Retention policy entity ${policy.entity} not found.`)
			return
		}

		// A policy with no predicate would prune every row of the table — require a bound.
		if (policy.olderThan === undefined && policy.where === undefined) {
			errorBuilder.add(
				'RETENTION_EMPTY_PREDICATE',
				`Retention policy ${policy.name} on ${entity.name} must set olderThan and/or where; a predicate-less policy would delete every row.`,
			)
		}

		if (policy.olderThan !== undefined) {
			this.validateOlderThan(entity, policy.olderThan, errorBuilder.for('olderThan'))
		}

		if (policy.where !== undefined) {
			try {
				whereSchema({ schema: this.model, entity })(policy.where)
			} catch (e: any) {
				errorBuilder.for('where').add('RETENTION_INVALID_WHERE', `Retention policy where is not valid: ${e.message}`)
			}
		}

		if (policy.schedule !== undefined) {
			this.validateSchedule(policy.schedule, errorBuilder.for('schedule'))
		}

		if (policy.batchSize !== undefined && !(policy.batchSize > 0)) {
			errorBuilder.for('batchSize').add('RETENTION_INVALID_LIMIT', `Retention policy batchSize must be a positive number.`)
		}
		if (policy.maxPerRun !== undefined && !(policy.maxPerRun > 0)) {
			errorBuilder.for('maxPerRun').add('RETENTION_INVALID_LIMIT', `Retention policy maxPerRun must be a positive number.`)
		}

		if (policy.strategy === 'raw') {
			this.validateRawRestrict(entity, errorBuilder)
		}
	}

	private validateOlderThan(entity: Model.Entity, olderThan: NonNullable<Retention.Policy['olderThan']>, errorBuilder: ErrorBuilder): void {
		const field = entity.fields[olderThan.field]
		if (!field) {
			errorBuilder.add('RETENTION_UNDEFINED_FIELD', `Field ${olderThan.field} of entity ${entity.name} not found.`)
		} else if (!isColumn(field) || field.type !== Model.ColumnType.DateTime) {
			errorBuilder.add('RETENTION_INVALID_FIELD', `Field ${entity.name}.${olderThan.field} must be a DateTime column.`)
		}
		if (olderThan.interval.trim() === '') {
			errorBuilder.add('RETENTION_INVALID_INTERVAL', `Retention policy interval must be a non-empty Postgres interval string.`)
		}
	}

	private validateSchedule(schedule: Retention.Schedule, errorBuilder: ErrorBuilder): void {
		if ('cron' in schedule) {
			if (schedule.cron.trim() === '') {
				errorBuilder.add('RETENTION_INVALID_SCHEDULE', `Retention schedule cron expression must not be empty.`)
			}
		} else if ('everySeconds' in schedule) {
			if (!(schedule.everySeconds > 0)) {
				errorBuilder.add('RETENTION_INVALID_SCHEDULE', `Retention schedule everySeconds must be a positive number.`)
			}
		} else if ('everyMinutes' in schedule) {
			if (!(schedule.everyMinutes > 0)) {
				errorBuilder.add('RETENTION_INVALID_SCHEDULE', `Retention schedule everyMinutes must be a positive number.`)
			}
		} else {
			assertNever(schedule)
		}
	}

	// A raw DELETE relies on Postgres FK actions; a `restrict` FK pointing at this entity
	// makes the delete fail at runtime once children exist. Flag it early.
	private validateRawRestrict(target: Model.Entity, errorBuilder: ErrorBuilder): void {
		for (const entity of Object.values(this.model.entities)) {
			const perField = acceptEveryFieldVisitor<boolean>(this.model, entity, {
				visitColumn: () => false,
				visitManyHasManyInverse: () => false,
				visitManyHasManyOwning: () => false,
				visitOneHasOneInverse: () => false,
				visitOneHasMany: () => false,
				visitManyHasOne: ({ relation }) => relation.target === target.name && relation.joiningColumn.onDelete === Model.OnDelete.restrict,
				visitOneHasOneOwning: ({ relation }) => relation.target === target.name && relation.joiningColumn.onDelete === Model.OnDelete.restrict,
			})
			const restrictRelation = Object.entries(perField).find(([, matches]) => matches)
			if (restrictRelation) {
				errorBuilder.add(
					'RETENTION_RAW_RESTRICT_RELATION',
					`Raw retention on ${target.name} will fail at runtime: relation ${entity.name}.${restrictRelation[0]} references it with onDelete: restrict. `
						+ `Use strategy 'content' or change the relation onDelete.`,
				)
				return
			}
		}
	}
}
