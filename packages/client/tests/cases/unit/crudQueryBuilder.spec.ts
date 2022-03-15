import { expect, it, describe } from 'vitest'
import { CrudQueryBuilder } from '../../../src'
import type { DeleteMutationArguments } from '../../../src/crudQueryBuilder'

describe('crud query builder', () => {
	it('complex mutation', () => {
		const builder = new CrudQueryBuilder.CrudQueryBuilder()
			.update('Post', builder =>
				builder
					.data(data =>
						data
							.set('name', 'John')
							.many('locales', builder => builder.connect({ id: '1' }).update({ locale: 'cs' }, { title: 'foo' }))
							.many('tags', b =>
								b.connect({ id: '1' }, 'connectId1').create({ name: 'foo' }, 'createNameFoo').disconnect({ id: 2 }),
							)
							.many('locales', [{ update: { by: { id: '123' }, data: { foo: 'bar' } } }])
							.one('author', { create: { name: 'John' } }),
					)
					.by({ id: '123' })
					.node(builder =>
						builder
							.column('id')
							.inlineFragment('Foo', builder => builder.column('bar'))
							.hasOneRelation('author', o => o.column('name')),
					),
			)
			.delete(
				'Category',
				CrudQueryBuilder.ReadBuilder.instantiate<DeleteMutationArguments>().by({ id: '123' }).column('id'),
			)
			.fragment('authorSnippet', 'Author', builder =>
				builder.column('nickName').hasOneRelation('favoritePet', builder => builder.column('name')),
			)
			.create('Author', builder =>
				builder
					.node(builder => builder.column('name').applyFragment('authorSnippet'))
					.data(builder =>
						builder
							.set('name', 'John')
							.many('posts', builder => builder.connect({ id: '456' }).create(builder => builder.set('title', 'Abcd'))),
					),
			)

		expect(builder.getGql()).toEqual(`mutation {
	updatePost(data: {name: "John", locales: [{connect: {id: "1"}}, {update: {by: {locale: "cs"}, data: {title: "foo"}}}, {update: {by: {id: "123"}, data: {foo: "bar"}}}], tags: [{connect: {id: "1"}, alias: "connectId1"}, {create: {name: "foo"}, alias: "createNameFoo"}, {disconnect: {id: 2}}], author: {create: {name: "John"}}}, by: {id: "123"}) {
		node {
			id
			... on Foo {
				bar
			}
			author {
				name
			}
		}
	}
	deleteCategory(by: {id: "123"}) {
		id
	}
	createAuthor(data: {name: "John", posts: [{connect: {id: "456"}}, {create: {title: "Abcd"}}]}) {
		node {
			name
			... authorSnippet
		}
	}
}
fragment authorSnippet on Author {
	nickName
	favoritePet {
		name
	}
}`)
	})

	it('mutation part merging', () => {
		const builder = new CrudQueryBuilder.CrudQueryBuilder().update('Post', builder =>
			builder
				.data(data =>
					data
						.set('name', 'John')
						.many('locales', builder => builder.connect({ id: '1' }).update({ locale: 'cs' }, { title: 'foo' }))
						.many('tags', b => b.connect({ id: '1' }, 'connectId1'))
						.many('locales', [{ update: { by: { id: '123' }, data: { foo: 'bar' } } }])
						.many('tags', b => b.create({ name: 'foo' }, 'createNameFoo'))
						.many('tags', b => b.disconnect({ id: 2 }))
						.one('author', { create: { surname: 'Smith' } })
						.many('locales', [{ update: { by: { id: '456' }, data: { foo: 'baz' } } }])
						.one('author', { create: { name: 'John' } }),
				)
				.by({ id: '123' })
				.node(builder => builder.column('id')),
		)

		expect(builder.getGql()).toEqual(`mutation {
	updatePost(data: {name: "John", locales: [{connect: {id: "1"}}, {update: {by: {locale: "cs"}, data: {title: "foo"}}}, {update: {by: {id: "123"}, data: {foo: "bar"}}}, {update: {by: {id: "456"}, data: {foo: "baz"}}}], tags: [{connect: {id: "1"}, alias: "connectId1"}, {create: {name: "foo"}, alias: "createNameFoo"}, {disconnect: {id: 2}}], author: {create: {surname: "Smith", name: "John"}}}, by: {id: "123"}) {
		node {
			id
		}
	}
}`)
	})

	it('query', () => {
		const builder = new CrudQueryBuilder.CrudQueryBuilder().list(
			'Posts',
			q =>
				q
					.filter({ foo: { eq: 'bar' } })
					.column('title')
					.hasOneRelation('author', o => o.column('name')),
			'myPostsAlias',
		)
		expect(builder.getGql()).toEqual(`query {
	myPostsAlias: listPosts(filter: {foo: {eq: "bar"}}) {
		title
		author {
			name
		}
	}
}`)
	})

	it('validation & errors relation builders', () => {
		const builder = new CrudQueryBuilder.CrudQueryBuilder().create('Foo', builder =>
			builder.data({ bar: '123' }).ok().errors().validation(),
		)
		expect(builder.getGql()).toEqual(`mutation {
	createFoo(data: {bar: "123"}) {
		ok
		errors {
			type
			message
			path {
				__typename
				... on _FieldPathFragment {
					field
				}
				... on _IndexPathFragment {
					index
					alias
				}
			}
		}
		validation {
			valid
			errors {
				path {
					__typename
					... on _FieldPathFragment {
						field
					}
					... on _IndexPathFragment {
						index
						alias
					}
				}
				message {
					text
				}
			}
		}
	}
}`)
	})
})
