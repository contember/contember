import { c, createSchema } from '../../../src/index.js'
import { expect, test } from 'bun:test'
import { SchemaValidator } from '@contember/schema-utils'
import { Retention } from '@contember/schema'

namespace BasicModel {
	@c.Retention({
		olderThan: { field: 'expiresAt', interval: '30 days' },
		where: { used: { eq: true } },
		schedule: { cron: '17 3 * * *' },
		batchSize: 5000,
		maxPerRun: 1000000,
	})
	export class Token {
		value = c.stringColumn()
		used = c.boolColumn()
		expiresAt = c.dateTimeColumn()
	}
}

test('@Retention builds a policy on the decorated entity with defaults applied', () => {
	const schema = createSchema(BasicModel)
	const policy = schema.retention.policies['token_retention']
	expect(policy).toStrictEqual(
		{
			name: 'token_retention',
			entity: 'Token',
			strategy: 'raw',
			olderThan: { field: 'expiresAt', interval: '30 days' },
			where: { used: { eq: true } },
			schedule: { cron: '17 3 * * *' },
			batchSize: 5000,
			maxPerRun: 1000000,
		} satisfies Retention.Policy,
	)
	expect(SchemaValidator.validate(schema).filter(it => it.code.startsWith('RETENTION'))).toStrictEqual([])
})

namespace NamedModel {
	@c.Retention({ name: 'prune-a', olderThan: { field: 'createdAt', interval: '7 days' } })
	@c.Retention({ name: 'prune-b', olderThan: { field: 'createdAt', interval: '30 days' }, strategy: 'content' })
	export class Event {
		createdAt = c.dateTimeColumn()
	}
}

test('@Retention supports multiple named policies per entity', () => {
	const schema = createSchema(NamedModel)
	expect(Object.keys(schema.retention.policies).sort()).toStrictEqual(['prune-a', 'prune-b'])
	expect(schema.retention.policies['prune-a'].strategy).toBe('raw')
	expect(schema.retention.policies['prune-b'].strategy).toBe('content')
	expect(SchemaValidator.validate(schema).filter(it => it.code.startsWith('RETENTION'))).toStrictEqual([])
})

namespace BadFieldModel {
	@c.Retention({ olderThan: { field: 'title', interval: '30 days' } })
	export class Article {
		title = c.stringColumn()
	}
}

test('@Retention: olderThan.field must be a DateTime column', () => {
	const schema = createSchema(BadFieldModel)
	expect(SchemaValidator.validate(schema).map(it => it.code)).toContain('RETENTION_INVALID_FIELD')
})

namespace MissingFieldModel {
	@c.Retention({ olderThan: { field: 'nope', interval: '30 days' } })
	export class Article {
		title = c.stringColumn()
	}
}

test('@Retention: olderThan.field must exist', () => {
	const schema = createSchema(MissingFieldModel)
	expect(SchemaValidator.validate(schema).map(it => it.code)).toContain('RETENTION_UNDEFINED_FIELD')
})

namespace BadWhereModel {
	@c.Retention({ where: { missingField: { eq: true } } })
	export class Article {
		title = c.stringColumn()
	}
}

test('@Retention: where must validate against the entity', () => {
	const schema = createSchema(BadWhereModel)
	expect(SchemaValidator.validate(schema).map(it => it.code)).toContain('RETENTION_INVALID_WHERE')
})

namespace BadScheduleModel {
	@c.Retention({ olderThan: { field: 'createdAt', interval: '1 day' }, schedule: { everyMinutes: 0 } })
	export class Article {
		createdAt = c.dateTimeColumn()
	}
}

test('@Retention: schedule interval must be positive', () => {
	const schema = createSchema(BadScheduleModel)
	expect(SchemaValidator.validate(schema).map(it => it.code)).toContain('RETENTION_INVALID_SCHEDULE')
})

namespace BadLimitModel {
	@c.Retention({ olderThan: { field: 'createdAt', interval: '1 day' }, batchSize: 0 })
	export class Article {
		createdAt = c.dateTimeColumn()
	}
}

test('@Retention: batchSize must be positive', () => {
	const schema = createSchema(BadLimitModel)
	expect(SchemaValidator.validate(schema).map(it => it.code)).toContain('RETENTION_INVALID_LIMIT')
})

namespace RestrictModelRestrict {
	@c.Retention({ olderThan: { field: 'createdAt', interval: '30 days' } })
	export class Author {
		createdAt = c.dateTimeColumn()
		name = c.stringColumn()
	}

	// Inbound owning relation with onDelete: restrict — a raw delete of Author would fail
	// once a Book still references it.
	export class Book {
		title = c.stringColumn()
		author = c.manyHasOne(Author).restrictOnDelete()
	}
}

namespace RestrictModelClean {
	@c.Retention({ olderThan: { field: 'createdAt', interval: '30 days' } })
	export class Author {
		createdAt = c.dateTimeColumn()
	}

	export class Book {
		title = c.stringColumn()
		author = c.manyHasOne(Author).setNullOnDelete()
	}
}

test('@Retention: raw strategy warns about inbound restrict relations', () => {
	const schema = createSchema(RestrictModelRestrict)
	expect(SchemaValidator.validate(schema).map(it => it.code)).toContain('RETENTION_RAW_RESTRICT_RELATION')
})

test('@Retention: raw strategy is fine without restrict relations', () => {
	const schema = createSchema(RestrictModelClean)
	expect(SchemaValidator.validate(schema).filter(it => it.code === 'RETENTION_RAW_RESTRICT_RELATION')).toStrictEqual([])
})
