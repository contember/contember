import { printMutation } from './utils'
import { queryBuilder } from '../client'

export default printMutation([
	queryBuilder.create('GridCategory', {
		data: {
			name: 'Guides',
			slug: 'guides',
		},
	}),
	queryBuilder.create('GridCategory', {
		data: {
			name: 'News',
			slug: 'news',
		},
	}),
	queryBuilder.create('GridTag', {
		data: {
			name: 'Contember',
			slug: 'contember',
		},
	}),
	queryBuilder.create('GridTag', {
		data: {
			name: 'GraphQL',
			slug: 'graphql',
		},
	}),
	queryBuilder.create('GridTag', {
		data: {
			name: 'React',
			slug: 'react',
		},
	}),
	queryBuilder.create('GridTag', {
		data: {
			name: 'TypeScript',
			slug: 'typescript',
		},
	}),
	queryBuilder.create('GridTag', {
		data: {
			name: 'JavaScript',
			slug: 'javascript',
		},
	}),
	queryBuilder.create('GridAuthor', {
		data: {
			name: 'John Doe',
			slug: 'john-doe',
		},
	}),
	queryBuilder.create('GridAuthor', {
		data: {
			name: 'Jane Doe',
			slug: 'jane-doe',
		},
	}),
	queryBuilder.create('GridAuthor', {
		data: {
			name: 'Jack Black',
			slug: 'jack-black',
		},
	}),
	// articles
	queryBuilder.create('GridArticle', {
		data: {
			title: 'Contember 1.0.0 is out',
			slug: 'contember-1-0-0-is-out',
			state: 'published',
			publishedAt: '2020-01-01T00:00:00.000Z',
			category: {
				connect: {
					slug: 'news',
				},
			},
			tags: [
				{
					connect: {
						slug: 'contember',
					},
				},
				{
					connect: {
						slug: 'graphql',
					},
				},
			],
			author: {
				connect: {
					slug: 'john-doe',
				},
			},
		},
	}),
	queryBuilder.create('GridArticle', {
		data: {
			title: 'How to use Contember',
			slug: 'how-to-use-contember',
			state: 'published',
			publishedAt: '2020-01-02T00:00:00.000Z',
			category: {
				connect: {
					slug: 'guides',
				},
			},
			author: {
				connect: {
					slug: 'john-doe',
				},
			},
			tags: [
				{
					connect: {
						slug: 'contember',
					},
				},
				{
					connect: {
						slug: 'graphql',
					},
				},
				{
					connect: {
						slug: 'react',
					},
				},
			],
		},
	}),
	// some typescript guide
	queryBuilder.create('GridArticle', {
		data: {
			title: 'How to use TypeScript',
			slug: 'how-to-use-typescript',
			state: 'published',
			publishedAt: '2020-01-03T00:00:00.000Z',
			category: {
				connect: {
					slug: 'guides',
				},
			},
			tags: [
				{
					connect: {
						slug: 'typescript',
					},
				},
			],
			author: {
				connect: {
					slug: 'john-doe',
				},
			},
		},
	}),
	queryBuilder.create('GridArticle', {
		data: {
			title: 'Contember 2.0 is out',
			slug: 'contember-2-0-is-out',
			state: 'draft',
			category: {
				connect: {
					slug: 'news',
				},
			},
			tags: [
				{
					connect: {
						slug: 'contember',
					},
				},
				{
					connect: {
						slug: 'graphql',
					},
				},
			],
			author: {
				connect: {
					slug: 'john-doe',
				},
			},
		},
	}),

	// more random stuff
	queryBuilder.create('GridArticle', {
		data: {
			title: 'How to use React',
			slug: 'how-to-use-react',
			state: 'published',
			publishedAt: '2020-01-04T00:00:00.000Z',
			category: {
				connect: {
					slug: 'guides',
				},
			},
			tags: [
				{
					connect: {
						slug: 'react',
					},
				},
			],
			author: {
				connect: {
					slug: 'john-doe',
				},
			},
		},
	}),
	queryBuilder.create('GridArticle', {
		data: {
			title: 'How to use JavaScript',
			slug: 'how-to-use-javascript',
			state: 'published',
			publishedAt: '2020-01-05T00:00:00.000Z',
			category: {
				connect: {
					slug: 'guides',
				},
			},
			tags: [
				{
					connect: {
						slug: 'javascript',
					},
				},
			],
			author: {
				connect: {
					slug: 'john-doe',
				},
			},
		},
	}),

	queryBuilder.create('GridArticle', {
		data: {
			title: 'How to use GraphQL',
			slug: 'how-to-use-graphql',
			state: 'published',
			publishedAt: '2020-01-06T00:00:00.000Z',
			category: {
				connect: {
					slug: 'guides',
				},
			},
			tags: [
				{
					connect: {
						slug: 'graphql',
					},
				},
			],
			author: {
				connect: {
					slug: 'john-doe',
				},
			},
		},
	}),
	...Array.from({ length: 30 }).map((_, i) => {
		const publishedAt = new Date()
		publishedAt.setDate(publishedAt.getDate() + i)
		return queryBuilder.create('GridArticle', {
			data: {
				title: `Hello world article #${i}`,
				slug: `hello-world-article-${i}`,
				state: i % 5 === 0 ? 'archived' : (i % 3 === 0 ? 'draft' : 'published'),
				locked: i % 7 === 0,
				publishedAt: publishedAt.toISOString(),
				category: {
					connect: {
						slug: i % 2 === 0 ? 'guides' : 'news',
					},
				},
				tags: [
					{
						connect: {
							slug: i % 2 === 0 ? 'contember' : 'react',
						},
					},
					{
						connect: {
							slug: i % 2 === 0 ? 'graphql' : 'typescript',
						},
					},
				],
				author: {
					connect: {
						slug: i % 2 === 0 ? 'john-doe' : 'jane-doe',
					},
				},
			},
		})
	}),
])
