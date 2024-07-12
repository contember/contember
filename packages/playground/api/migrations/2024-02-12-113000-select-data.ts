import { printMutation, uniqGenerator } from './utils'
import { queryBuilder } from '../client'
import { faker } from '@faker-js/faker'

faker.seed(123)


const nameGenerator = uniqGenerator(faker.company.name)

export default printMutation([
	...Array.from({ length: 100 }).map((_, i) => {
		const name = nameGenerator()
		return queryBuilder.create('SelectValue', {
			data: {
				name,
				slug: name.toLowerCase().replace(/[^\w\d]+/g, '-').replace(/-+$/, '').replace(/^-+/, ''),
			},
		})
	}),
])
