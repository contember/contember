import { c, createSchema } from '@contember/schema-definition'
import { SQL } from '../../src/tags'
import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { createUniqueConstraintModification, removeUniqueConstraintModification } from '../../../src'
import { createDatabaseMetadata } from '@contember/database'

describe('create unique (immediate)', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema({
		Author: class Author {
			email = c.stringColumn().unique()
		},
	}),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
			},
		}),
	],
	sql: SQL`ALTER TABLE "author" ADD UNIQUE ("email");`,
}))

describe('create unique (deferrable)', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema({
		Author: class Author {
			email = c.stringColumn().unique({ timing: 'deferrable' })
		},
	}),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				timing: 'deferrable',
			},
		}),
	],
	sql: SQL`ALTER TABLE "author"
        ADD UNIQUE ("email") DEFERRABLE;`,
}))


describe('create unique (deferred)', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema({
		Author: class Author {
			email = c.stringColumn().unique({ timing: 'deferred' })
		},
	}),
	diff: [

		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				timing: 'deferred',
			},
		}),
	],
	sql: SQL`ALTER TABLE "author"
        ADD UNIQUE ("email") INITIALLY DEFERRED;`,
}))


describe('change unique timing', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn().unique()
		},
	}),
	updated: createSchema({
		Author: class Author {
			email = c.stringColumn().unique({ timing: 'deferrable' })
		},
	}),
	diff: [
		removeUniqueConstraintModification.createModification({
			entityName: 'Author',
			fields: ['email'],
		}),
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				timing: 'deferrable',
			},
		}),
	],
	sql: SQL`ALTER TABLE "author" DROP CONSTRAINT "uniq_author_email"; 
ALTER TABLE "author" ADD UNIQUE ("email") DEFERRABLE;`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [],
		uniqueConstraints: [{
			constraintName: 'uniq_author_email',
			columnNames: ['email'],
			tableName: 'author',
			deferred: false,
			deferrable: false,
		}],
	}),
}))


namespace SchemaWithUniqueDecorator {

	@c.Unique({ fields: ['email'], timing: 'deferred' })
	export class Author {
		email = c.stringColumn()
	}
}

describe('create unique using decorator', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema(SchemaWithUniqueDecorator),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				timing: 'deferred',
			},
		}),
	],
	sql: SQL`ALTER TABLE "author"
        ADD UNIQUE ("email") INITIALLY DEFERRED;`,
}))
