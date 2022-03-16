import { expect, it, describe } from 'vitest'
import { GraphQlBuilder } from '../../../src'

describe('GraphQlQueryBuilder', () => {
	it('construct simple query', () => {
		const query = new GraphQlBuilder.QueryBuilder().query(builder =>
			builder
				.object('Post', object =>
					object
						.argument('where', { id: '123' })
						.field('id')
						.field('publishedAt')
						.inlineFragment('Article', new GraphQlBuilder.ObjectBuilder().field('leadParagraph'))
						.inlineFragment(
							'BlogPost',
							new GraphQlBuilder.ObjectBuilder().object('comments', new GraphQlBuilder.ObjectBuilder().field('id')),
						)
						.object(
							'locales',
							new GraphQlBuilder.ObjectBuilder()
								.argument('where', { locale: { eq: new GraphQlBuilder.GraphQlLiteral('cs') } })
								.field('id')
								.field('title'),
						),
				)
				.object('Authors', o => o.field('id')),
		)
		expect(query).toMatchInlineSnapshot(`
			"query {
				Post(where: {id: \\"123\\"}) {
					__typename
					id
					publishedAt
					... on Article {
						__typename
						leadParagraph
					}
					... on BlogPost {
						__typename
						comments {
							__typename
							id
						}
					}
					locales(where: {locale: {eq: cs}}) {
						__typename
						id
						title
					}
				}
				Authors {
					__typename
					id
				}
			}"
		`)
	})
})
