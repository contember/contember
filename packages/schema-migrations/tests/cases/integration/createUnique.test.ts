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
			unique: {
				fields: ['email'],
			},
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

namespace AuthorWithUniqueIndex {
	@c.Unique({ fields: ['email'], index: true, nulls: 'not distinct' })
	export class Author {
		email = c.stringColumn()
	}
}

describe('create unique index', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema(AuthorWithUniqueIndex),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				nulls: 'not distinct',
			},
		}),
	],
	sql: SQL`CREATE UNIQUE INDEX ON "author" ("email") NULLS NOT DISTINCT;`,
}))

namespace ViewWithUniqueIndexOriginal {
	@c.View(`select 1 as id, 'foo@localhost' as email)`)
	export class Author {
		email = c.stringColumn()
	}
}

namespace ViewWithUniqueIndexUpdated {
	@c.View(`select 1 as id, 'foo@localhost' as email)`)
	@c.Unique({ fields: ['email'], index: true })
	export class Author {
		email = c.stringColumn()
	}
}

describe('create unique index', () => testMigrations({
	original: createSchema(ViewWithUniqueIndexOriginal),
	updated: createSchema(ViewWithUniqueIndexUpdated),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
			},
		}),
	],
	sql: SQL``,
}))


namespace MaterializedViewWithUniqueIndexOriginal {
	@c.View(`select 1 as id, 'foo@localhost' as email)`, { materialized: true })
	export class Author {
		email = c.stringColumn()
	}
}

namespace MaterializedViewWithUniqueIndexUpdated {
	@c.View(`select 1 as id, 'foo@localhost' as email)`, { materialized: true })
	@c.Unique({ fields: ['email'], index: true })
	export class Author {
		email = c.stringColumn()
	}
}

describe('create unique index', () => testMigrations({
	original: createSchema(MaterializedViewWithUniqueIndexOriginal),
	updated: createSchema(MaterializedViewWithUniqueIndexUpdated),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
			},
		}),
	],
	sql: SQL`CREATE UNIQUE INDEX ON "author" ("email");`,
}))

namespace AuthorWithUniqueGinIndex {
	@c.Unique({ fields: ['email'], index: true, method: 'gin' })
	export class Author {
		email = c.stringColumn()
	}
}

namespace AuthorWithUniqueGistIndex {
	@c.Unique({ fields: ['email'], index: true, method: 'gist' })
	export class Author {
		email = c.stringColumn()
	}
}

namespace AuthorWithUniqueBtreeIndex {
	@c.Unique({ fields: ['email'], index: true, method: 'btree', nulls: 'not distinct' })
	export class Author {
		email = c.stringColumn()
	}
}

describe('create unique index with GIN method', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema(AuthorWithUniqueGinIndex),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				method: 'gin',
			},
		}),
	],
	sql: SQL`CREATE UNIQUE INDEX ON "author" USING gin ("email");`,
}))

describe('create unique index with GiST method', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema(AuthorWithUniqueGistIndex),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				method: 'gist',
			},
		}),
	],
	sql: SQL`CREATE UNIQUE INDEX ON "author" USING gist ("email");`,
}))

describe('create unique index with btree method and nulls not distinct', () => testMigrations({
	original: createSchema({
		Author: class Author {
			email = c.stringColumn()
		},
	}),
	updated: createSchema(AuthorWithUniqueBtreeIndex),
	diff: [
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				method: 'btree',
				nulls: 'not distinct',
			},
		}),
	],
	sql: SQL`CREATE UNIQUE INDEX ON "author" USING btree ("email") NULLS NOT DISTINCT;`,
}))

describe('change unique index method from gin to gist', () => testMigrations({
	original: createSchema(AuthorWithUniqueGinIndex),
	updated: createSchema(AuthorWithUniqueGistIndex),
	diff: [
		removeUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				method: 'gin',
			},
		}),
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				method: 'gist',
			},
		}),
	],
	sql: SQL`DROP INDEX "uniq_author_email";
CREATE UNIQUE INDEX ON "author" USING gist ("email");`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [{
			tableName: 'author',
			columnNames: ['email'],
			indexName: 'uniq_author_email',
			unique: true,
		}],
		uniqueConstraints: [],
	}),
}))

describe('change from regular unique index to method-specific unique index', () => testMigrations({
	original: createSchema(AuthorWithUniqueIndex),
	updated: createSchema(AuthorWithUniqueGinIndex),
	diff: [
		removeUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				nulls: 'not distinct',
			},
		}),
		createUniqueConstraintModification.createModification({
			entityName: 'Author',
			unique: {
				fields: ['email'],
				index: true,
				method: 'gin',
			},
		}),
	],
	sql: SQL`DROP INDEX "uniq_author_email";
CREATE UNIQUE INDEX ON "author" USING gin ("email");`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [{
			tableName: 'author',
			columnNames: ['email'],
			indexName: 'uniq_author_email',
			unique: true,
		}],
		uniqueConstraints: [],
	}),
}))
