import { expect, test } from 'bun:test'
import { c, createSchema } from '../../../src'
import { Acl } from '@contember/schema'

namespace SimpleModel {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, { read: true })
	export class Book {
		title = c.stringColumn()
	}
}

test('simple definitions', () => {
	const schema = createSchema(SimpleModel)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual({
		'operations': {
			'read': {
				'title': true,
			},
		},
		'predicates': {},
	})
})


namespace RoleOptions {
	export const publicRole = c.createRole('public', {
		debug: true,
		s3: {
			foo: 'bar',
		},
	})
}

test('role options', () => {
	const schema = createSchema(RoleOptions)
	expect(schema.acl.roles.public).toStrictEqual({
		'debug': true,
		'entities': {},
		's3': {
			'foo': 'bar',
		},
		'stages': '*',
		'variables': {},
	})
})


namespace ModelWithPredicate {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: true,
	})
	export class Book {
		title = c.stringColumn()
		isPublished = c.boolColumn()
	}
}

test('definition with a predicate', () => {
	const schema = createSchema(ModelWithPredicate)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual({
		'operations': {
			'read': {
				'isPublished': 'isPublished_eq_true',
				'title': 'isPublished_eq_true',
			},
		},
		'predicates': {
			'isPublished_eq_true': {
				'isPublished': {
					'eq': true,
				},
			},
		},
	})
})

namespace ModelWithPredicateOnField {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	export class Book {
		title = c.stringColumn()
		isPublished = c.boolColumn()
	}
}

test('definition with a predicate on field', () => {
	const schema = createSchema(ModelWithPredicateOnField)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual({
		'operations': {
			'read': {
				'title': 'isPublished_eq_true',
			},
		},
		'predicates': {
			'isPublished_eq_true': {
				'isPublished': {
					'eq': true,
				},
			},
		},
	})
})


namespace ModelWithModificationAcl {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, {
		when: { isPublished: { eq: true } },
		create: true,
		update: true,
		delete: true,
	})
	export class Book {
		title = c.stringColumn()
		isPublished = c.boolColumn()
	}
}

test('definition with update, create, delete predicates', () => {
	const schema = createSchema(ModelWithModificationAcl)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual(
		{
		  'operations': {
		    'create': {
		      'isPublished': 'isPublished_eq_true',
		      'title': 'isPublished_eq_true',
		    },
		    'delete': 'isPublished_eq_true',
		    'update': {
		      'isPublished': 'isPublished_eq_true',
		      'title': 'isPublished_eq_true',
		    },
		  },
		  'predicates': {
		    'isPublished_eq_true': {
		      'isPublished': {
		        'eq': true,
		      },
		    },
		  },
		},
	)
})


namespace ModelWithMultiplePredicates {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	@c.Allow(publicRole, {
		when: { isPublished: { eq: false } },
		read: ['title'],
	})
	export class Book {
		title = c.stringColumn()
		isPublished = c.boolColumn()
	}
}

test('definition with multiple predicates on a single field', () => {
	const schema = createSchema(ModelWithMultiplePredicates)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual(
		{
		  'operations': {
		    'read': {
		      'title': 'or_isPublished_eq_false_isPub',
		    },
		  },
		  'predicates': {
		    'or_isPublished_eq_false_isPub': {
		      'or': [
		        {
		          'isPublished': {
		            'eq': false,
		          },
		        },
		        {
		          'isPublished': {
		            'eq': true,
		          },
		        },
		      ],
		    },
		  },
		},
	)
})


namespace ModelWithJoinedPredicateCollision {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, {
		when: { isPublishedLoremIpsumDolorSitAmet: { eq: true } },
		read: ['title'],
	})
	@c.Allow(publicRole, {
		when: { isPublishedLoremIpsumDolorSitAmet: { eq: false } },
		read: ['title', 'isPublishedLoremIpsumDolorSitAmet'],
	})
	@c.Allow(publicRole, {
		when: { isPublishedLoremIpsumDolorSitAmet: { eq: false } },
		read: ['isPublishedLoremIpsumDolorSitAmet'],
	})
	export class Book {
		title = c.stringColumn()
		isPublishedLoremIpsumDolorSitAmet = c.boolColumn()
	}
}

test('definition with collision', () => {
	const schema = createSchema(ModelWithJoinedPredicateCollision)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual(
		{
		  'operations': {
		    'read': {
		      'isPublishedLoremIpsumDolorSitAmet': 'or_isPublishedLoremIpsumDolor_1',
		      'title': 'or_isPublishedLoremIpsumDolor',
		    },
		  },
		  'predicates': {
		    'or_isPublishedLoremIpsumDolor': {
		      'or': [
		        {
		          'isPublishedLoremIpsumDolorSitAmet': {
		            'eq': false,
		          },
		        },
		        {
		          'isPublishedLoremIpsumDolorSitAmet': {
		            'eq': true,
		          },
		        },
		      ],
		    },
		    'or_isPublishedLoremIpsumDolor_1': {
		      'or': [
		        {
		          'isPublishedLoremIpsumDolorSitAmet': {
		            'eq': false,
		          },
		        },
		        {
		          'isPublishedLoremIpsumDolorSitAmet': {
		            'eq': false,
		          },
		        },
		      ],
		    },
		  },
		},
	)
})


namespace ModelWithMultipleRolesForSinglePredicate {
	export const publicRole = c.createRole('public')
	export const adminRole = c.createRole('admin')

	@c.Allow([publicRole, adminRole], {
		read: ['title'],
	})
	export class Book {
		title = c.stringColumn()
		isPublished = c.boolColumn()
	}
}

test('definition with multiple roles in single predicate', () => {
	const schema = createSchema(ModelWithMultipleRolesForSinglePredicate)
	expect(schema.acl.roles).toStrictEqual(
		{
		  'admin': {
		    'entities': {
		      'Book': {
		        'operations': {
		          'read': {
		            'title': true,
		          },
		        },
		        'predicates': {},
		      },
		    },
		    'stages': '*',
		    'variables': {},
		  },
		  'public': {
		    'entities': {
		      'Book': {
		        'operations': {
		          'read': {
		            'title': true,
		          },
		        },
		        'predicates': {},
		      },
		    },
		    'stages': '*',
		    'variables': {},
		  },
		},
	)
})

namespace ModelWithAclPredicateReferences {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	export class Book {
		title = c.stringColumn()
		isPublished = c.boolColumn()
	}
	@c.Allow(publicRole, {
		when: { book: c.canRead('title') },
		read: ['content'],
	})
	export class BookReview {
		book = c.manyHasOne(Book)
		content = c.stringColumn()
	}
}

test('definition with predicate references', () => {
	const schema = createSchema(ModelWithAclPredicateReferences)
	expect(schema.acl.roles.public.entities).toStrictEqual(
		{
		  'Book': {
		    'operations': {
		      'read': {
		        'title': 'isPublished_eq_true',
		      },
		    },
		    'predicates': {
		      'isPublished_eq_true': {
		        'isPublished': {
		          'eq': true,
		        },
		      },
		    },
		  },
		  'BookReview': {
		    'operations': {
		      'read': {
		        'content': 'book_isPublished_eq_true',
		      },
		    },
		    'predicates': {
		      'book_isPublished_eq_true': {
		        'book': {
		          'isPublished': {
		            'eq': true,
		          },
		        },
		      },
		    },
		  },
		},
	)
})


namespace ModelWithVariables {
	export const managerRole = c.createRole('manager')
	export const bookIdVariable = c.createEntityVariable('bookId', 'Book', managerRole)

	@c.Allow(managerRole, {
		when: { id: bookIdVariable },
		read: ['title'],
	})
	export class Book {
		title = c.stringColumn()
	}
}

test('definition with variables', () => {
	const schema = createSchema(ModelWithVariables)
	expect(schema.acl.roles.manager).toStrictEqual(
		{
		  'entities': {
		    'Book': {
		      'operations': {
		        'read': {
		          'title': 'id_bookId',
		        },
		      },
		      'predicates': {
		        'id_bookId': {
		          'id': 'bookId',
		        },
		      },
		    },
		  },
		  'stages': '*',
		  'variables': {
		    'bookId': {
		      'entityName': 'Book',
		      'type': Acl.VariableType.entity,
		    },
		  },
		},
	)
})

namespace ModelWithAllowCustomPrimary {
	export const publicRole = c.createRole('public')

	@c.AllowCustomPrimary(publicRole)
	export class Book {
		title = c.stringColumn()
	}
}

test('allow custom primary', () => {
	const schema = createSchema(ModelWithAllowCustomPrimary)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual(
		{
		  'operations': {
		    'customPrimary': true,
		  },
		  'predicates': {},
		},
	)
})

namespace ModelWithAllowCustomPrimaryAllRoles {
	export const publicRole = c.createRole('public')

	@c.AllowCustomPrimary()
	export class Book {
		title = c.stringColumn()
	}
}

test('allow custom primary', () => {
	const schema = createSchema(ModelWithAllowCustomPrimaryAllRoles)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual(
		{
		  'operations': {
		    'customPrimary': true,
		  },
		  'predicates': {},
		},
	)
})


namespace ModelWithInvalidAclPredicateReferences {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, {
		when: { isPublished: { eq: true } },
		read: ['title'],
	})
	export class Book {
		title = c.stringColumn()
		isPublished = c.boolColumn()
	}

	@c.Allow(publicRole, {
		when: { content: c.canRead('title') },
		read: ['content'],
	})
	export class BookReview {
		book = c.manyHasOne(Book)
		content = c.stringColumn()
	}
}

test('definition with invalid predicate references', () => {
	expect(() => createSchema(ModelWithInvalidAclPredicateReferences)).toThrow(
		'Predicate references are allowed only on relations. \n' +
		'You cannot use "canRead("title")" on a column "content" of entity "BookReview".',
	)
})


namespace ModelWithPredefinedVariables {
	export const customerRole = c.createRole('customer')
	export const personId = c.createPredefinedVariable('person', 'personID', customerRole)

	@c.Allow(customerRole, {
		when: { personId: personId },
		read: true,
	})
	export class Order {
		personId = c.uuidColumn().notNull()
		valueCents = c.intColumn().notNull()
	}
}

test('definition with predefined variables', () => {
	const schema = createSchema(ModelWithPredefinedVariables)
	expect(schema.acl.roles.customer).toStrictEqual({
		'entities': {
			'Order': {
				'operations': {
					'read': {
						'personId': 'personId_person',
						'valueCents': 'personId_person',
					},
				},
				'predicates': {
					'personId_person': {
						'personId': 'person',
					},
				},
			},
		},
		'stages': '*',
		'variables': {
			'person': {
				'type': Acl.VariableType.predefined,
				'value': 'personID',
			},
		},
	})
})

namespace InvalidModel {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, { read: ['bar'] as any })
	export class Book {
		title = c.stringColumn()
	}
}

test('invalid column', () => {
	expect(() => createSchema(InvalidModel)).toThrow('Field "bar" does not exist on entity "Book" in read ACL definition.')
})


namespace ExplicitIdPredicate {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, { read: ['id'] })
	export class Book {
		title = c.stringColumn()
	}
}

test('explicit ID predicate', () => {
	const schema = createSchema(ExplicitIdPredicate)
	expect(schema.acl.roles.public.entities.Book).toStrictEqual({
		'operations': {
			'read': {
				'id': true,
			},
		},
		'predicates': {},
	})
})
