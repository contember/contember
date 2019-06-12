import 'mocha'
import { CrudQueryBuilder } from '../../../src'
import { expect } from 'chai'
import { DeleteMutationArguments } from '../../../src/crudQueryBuilder'

describe('crud query builder', () => {
	it('complex mutation', () => {
		const builder = new CrudQueryBuilder.CrudQueryBuilder()
			.update('updatePost', builder =>
				builder
					.data(data =>
						data
							.set('name', 'John')
							.many('locales', builder => builder.connect({ id: '1' }).update({ locale: 'cs' }, { title: 'foo' }))
							.many('tags', b =>
								b
									.connect({ id: '1' })
									.create({ name: 'foo' })
									.disconnect({ id: 2 })
							)
							.many('locales', [{ update: { by: { id: '123' }, data: { foo: 'bar' } } }])
							.one('author', { create: { name: 'John' } })
					)
					.by({ id: '123' })
					.column('id')
					.inlineFragment('Foo', builder => builder.column('bar'))
					.hasOneRelation('author', o => o.column('name'))
			)
			.delete(
				'deleteCategory',
				CrudQueryBuilder.ReadBuilder.create<DeleteMutationArguments>()
					.by({ id: '123' })
					.column('id')
			)
			.create('createAuthor', builder =>
				builder
					.data(builder =>
						builder
							.set('name', 'John')
							.many('posts', builder => builder.connect({ id: '456' }).create(builder => builder.set('title', 'Abcd')))
					)
					.column('name')
			)

		expect(builder.getGql()).equals(`mutation {
	updatePost(data: {name: "John", locales: [{update: {by: {id: "123"}, data: {foo: "bar"}}}], tags: [{connect: {id: "1"}}, {create: {name: "foo"}}, {disconnect: {id: 2}}], author: {create: {name: "John"}}}, by: {id: "123"}) {
		id
		... on Foo {
			bar
		}
		author {
			name
		}
	}
	deleteCategory(by: {id: "123"}) {
		id
	}
	createAuthor(data: {name: "John", posts: [{connect: {id: "456"}}, {create: {title: "Abcd"}}]}) {
		name
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
			'myPostsAlias'
		)
		expect(builder.getGql()).equals(`query {
	myPostsAlias: Posts(filter: {foo: {eq: "bar"}}) {
		title
		author {
			name
		}
	}
}`)
	})
})
