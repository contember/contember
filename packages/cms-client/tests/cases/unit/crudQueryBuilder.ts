import 'mocha'
import { CrudQueryBuilder } from '../../../src'
import { expect } from 'chai'

describe('crud query builder', () => {
	it('complex mutation', () => {
		const builder = new CrudQueryBuilder.CrudQueryBuilder()
			.update('updatePost', builder =>
				builder
					.where({ id: '123' })
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
					.column('id')
					.relation('author', o => o.field('name'))
			)
			.delete('deleteCategory', new CrudQueryBuilder.DeleteBuilder().where({ id: '123' }).column('id'))
			.create('createAuthor', builder =>
				builder
					.column('name')
					.data(builder =>
						builder
							.set('name', 'John')
							.many('posts', builder => builder.connect({ id: '456' }).create(builder => builder.set('title', 'Abcd')))
					)
			)

		expect(builder.getGql()).equals(`mutation {
	updatePost(by: {id: "123"}, data: {name: "John", locales: [{update: {by: {id: "123"}, data: {foo: "bar"}}}], tags: [{connect: {id: "1"}}, {create: {name: "foo"}}, {disconnect: {id: 2}}], author: {create: {name: "John"}}}) {
		id
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
					.relation('author', o => o.column('name')),
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
