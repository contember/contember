import { printMutation } from './utils'
import { queryBuilder } from '../client'
import { faker } from '@faker-js/faker'

faker.seed(123)

const authors = [
	'john-doe',
	'jane-doe',
	'jack-black',
]

const articles = [
	'hello-world-article-0',
	'hello-world-article-1',
	'hello-world-article-2',
	'hello-world-article-3',
	'hello-world-article-5',
	'hello-world-article-6',
	'hello-world-article-7',
	'hello-world-article-8',
	'hello-world-article-9',
	'hello-world-article-10',
]

export default printMutation([
	...Array.from({ length: 60 }).map((_, i) => {
		return queryBuilder.create('GridArticleComment', {
			data: {
				content: faker.lorem.paragraph(),
				createdAt: faker.date.recent().toISOString(),
				article: {
					connect: {
						slug: articles[faker.number.int({
							min: 0,
							max: articles.length - 1,
						})],
					},
				},
				author: {
					connect: {
						slug: authors[faker.number.int({
							min: 0,
							max: authors.length - 1,
						})],
					},
				},
			},
		})
	}),
])
