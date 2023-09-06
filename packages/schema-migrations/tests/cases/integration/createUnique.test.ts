import { c, createSchema } from '@contember/schema-definition'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'
import { createUniqueConstraintModification, removeUniqueConstraintModification } from '../../../src'

testMigrations('create unique (immediate)', {
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
})

testMigrations('create unique (deferrable)', {
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
})


testMigrations('create unique (deferred)', {
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
})


testMigrations('change unique timing', {
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

})


namespace SchemaWithUniqueDecorator {

	@c.Unique({ fields: ['email'], timing: 'deferred' })
	export class Author {
		email = c.stringColumn()
	}
}

testMigrations('create unique using decorator', {
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
})
