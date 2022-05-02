import { expect, test } from 'vitest'
import { createSchema, SchemaDefinition as def, AclDefinition as acl } from '../../src'

namespace SimpleModel {
	export const publicRole = acl.createRole('public')

	@acl.allow(publicRole, { read: true })
	export class Book {
		title = def.stringColumn()
	}
}

test('simple definitions', () => {
	const schema = createSchema(SimpleModel)
	expect(schema.acl.roles.public.entities.Book).toMatchInlineSnapshot(`
		{
		  "operations": {
		    "read": {
		      "title": true,
		    },
		  },
		  "predicates": {},
		}
	`)
})

namespace ModelWithPredicate {
	export const publicRole = acl.createRole('public')

	@acl.allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: true,
	})
	export class Book {
		title = def.stringColumn()
		isPublished = def.boolColumn()
	}
}

test('definition with a predicate', () => {
	const schema = createSchema(ModelWithPredicate)
	expect(schema.acl.roles.public.entities.Book).toMatchInlineSnapshot(`
		{
		  "operations": {
		    "read": {
		      "isPublished": "isPublished_eq_true",
		      "title": "isPublished_eq_true",
		    },
		  },
		  "predicates": {
		    "isPublished_eq_true": {
		      "isPublished": {
		        "eq": true,
		      },
		    },
		  },
		}
	`)
})

namespace ModelWithPredicateOnField {
	export const publicRole = acl.createRole('public')

	@acl.allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	export class Book {
		title = def.stringColumn()
		isPublished = def.boolColumn()
	}
}

test('definition with a predicate on field', () => {
	const schema = createSchema(ModelWithPredicateOnField)
	expect(schema.acl.roles.public.entities.Book).toMatchInlineSnapshot(`
		{
		  "operations": {
		    "read": {
		      "title": "isPublished_eq_true",
		    },
		  },
		  "predicates": {
		    "isPublished_eq_true": {
		      "isPublished": {
		        "eq": true,
		      },
		    },
		  },
		}
	`)
})


namespace ModelWithModificationAcl {
	export const publicRole = acl.createRole('public')

	@acl.allow(publicRole, {
		when: { isPublished: { eq: true } },
		create: true,
		update: true,
		delete: true,
	})
	export class Book {
		title = def.stringColumn()
		isPublished = def.boolColumn()
	}
}

test('definition with update, create, delete predicates', () => {
	const schema = createSchema(ModelWithModificationAcl)
	expect(schema.acl.roles.public.entities.Book).toMatchInlineSnapshot(`
		{
		  "operations": {
		    "create": {
		      "isPublished": "isPublished_eq_true",
		      "title": "isPublished_eq_true",
		    },
		    "delete": "isPublished_eq_true",
		    "update": {
		      "isPublished": "isPublished_eq_true",
		      "title": "isPublished_eq_true",
		    },
		  },
		  "predicates": {
		    "isPublished_eq_true": {
		      "isPublished": {
		        "eq": true,
		      },
		    },
		  },
		}
	`)
})


namespace ModelWithMultiplePredicates {
	export const publicRole = acl.createRole('public')

	@acl.allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	@acl.allow(publicRole, {
		when: { isPublished: { eq: false } },
		read: ['title'],
	})
	export class Book {
		title = def.stringColumn()
		isPublished = def.boolColumn()
	}
}

test('definition with multiple predicates on a single field', () => {
	const schema = createSchema(ModelWithMultiplePredicates)
	expect(schema.acl.roles.public.entities.Book).toMatchInlineSnapshot(`
		{
		  "operations": {
		    "read": {
		      "title": "or_isPublished_eq_false_isPub",
		    },
		  },
		  "predicates": {
		    "or_isPublished_eq_false_isPub": {
		      "or": [
		        {
		          "isPublished": {
		            "eq": false,
		          },
		        },
		        {
		          "isPublished": {
		            "eq": true,
		          },
		        },
		      ],
		    },
		  },
		}
	`)
})


namespace ModelWithMultipleRolesForSinglePredicate {
	export const publicRole = acl.createRole('public')
	export const adminRole = acl.createRole('admin')

	@acl.allow([publicRole, adminRole], {
		read: ['title'],
	})
	export class Book {
		title = def.stringColumn()
		isPublished = def.boolColumn()
	}
}

test('definition with multiple roles in single predicate', () => {
	const schema = createSchema(ModelWithMultipleRolesForSinglePredicate)
	expect(schema.acl.roles).toMatchInlineSnapshot(`
		{
		  "admin": {
		    "entities": {
		      "Book": {
		        "operations": {
		          "read": {
		            "title": true,
		          },
		        },
		        "predicates": {},
		      },
		    },
		    "stages": "*",
		    "variables": {},
		  },
		  "public": {
		    "entities": {
		      "Book": {
		        "operations": {
		          "read": {
		            "title": true,
		          },
		        },
		        "predicates": {},
		      },
		    },
		    "stages": "*",
		    "variables": {},
		  },
		}
	`)
})

namespace ModelWithAclPredicateReferences {
	export const publicRole = acl.createRole('public')

	@acl.allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	export class Book {
		title = def.stringColumn()
		isPublished = def.boolColumn()
	}
	@acl.allow(publicRole, {
		when: { book: acl.canRead('title') },
		read: ['content'],
	})
	export class BookReview {
		book = def.manyHasOne(Book)
		content = def.stringColumn()
	}
}

test('definition with predicate references', () => {
	const schema = createSchema(ModelWithAclPredicateReferences)
	expect(schema.acl.roles.public.entities).toMatchInlineSnapshot(`
		{
		  "Book": {
		    "operations": {
		      "read": {
		        "title": "isPublished_eq_true",
		      },
		    },
		    "predicates": {
		      "isPublished_eq_true": {
		        "isPublished": {
		          "eq": true,
		        },
		      },
		    },
		  },
		  "BookReview": {
		    "operations": {
		      "read": {
		        "content": "book_isPublished_eq_true",
		      },
		    },
		    "predicates": {
		      "book_isPublished_eq_true": {
		        "book": {
		          "isPublished": {
		            "eq": true,
		          },
		        },
		      },
		    },
		  },
		}
	`)
})


namespace ModelWithVariables {
	export const managerRole = acl.createRole('manager')
	export const bookIdVariable = acl.createEntityVariable('bookId', 'Book', managerRole)

	@acl.allow(managerRole, {
		when: { id: bookIdVariable },
		read: ['title'],
	})
	export class Book {
		title = def.stringColumn()
	}
}

test('definition with variables', () => {
	const schema = createSchema(ModelWithVariables)
	expect(schema.acl.roles.manager).toMatchInlineSnapshot(`
		{
		  "entities": {
		    "Book": {
		      "operations": {
		        "read": {
		          "title": "id_bookId",
		        },
		      },
		      "predicates": {
		        "id_bookId": {
		          "id": "bookId",
		        },
		      },
		    },
		  },
		  "stages": "*",
		  "variables": {
		    "bookId": {
		      "entityName": "Book",
		      "type": "entity",
		    },
		  },
		}
	`)
})

namespace ModelWithAllowCustomPrimary {
	export const publicRole = acl.createRole('public')

	@acl.allowCustomPrimary(publicRole)
	export class Book {
		title = def.stringColumn()
	}
}

test('allow custom primary', () => {
	const schema = createSchema(ModelWithAllowCustomPrimary)
	expect(schema.acl.roles.public.entities.Book).toMatchInlineSnapshot(`
		{
		  "operations": {
		    "customPrimary": true,
		  },
		  "predicates": {},
		}
	`)
})

namespace ModelWithAllowCustomPrimaryAllRoles {
	export const publicRole = acl.createRole('public')

	@acl.allowCustomPrimary()
	export class Book {
		title = def.stringColumn()
	}
}

test('allow custom primary', () => {
	const schema = createSchema(ModelWithAllowCustomPrimaryAllRoles)
	expect(schema.acl.roles.public.entities.Book).toMatchInlineSnapshot(`
		{
		  "operations": {
		    "customPrimary": true,
		  },
		  "predicates": {},
		}
	`)
})


namespace ModelWithInvalidAclPredicateReferences {
	export const publicRole = acl.createRole('public')

	@acl.allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	export class Book {
		title = def.stringColumn()
		isPublished = def.boolColumn()
	}

	@acl.allow(publicRole, {
		when: { content: acl.canRead('title') },
		read: ['content'],
	})
	export class BookReview {
		book = def.manyHasOne(Book)
		content = def.stringColumn()
	}
}

test('definition with invalid predicate references', () => {
	expect(() => createSchema(ModelWithInvalidAclPredicateReferences)).toThrow(
		'Predicate references are allowed only on relations. \n' +
		'You cannot use "canRead("title")" on a column "content" of entity "BookReview".',
	)
})

