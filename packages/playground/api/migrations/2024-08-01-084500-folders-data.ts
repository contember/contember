import { printMutation } from './utils'
import { ContemberClientEntities, queryBuilder } from '../client'
import { ContentClientInput } from '@contember/client-content'
import { faker } from '@faker-js/faker'

faker.seed(123)
const generateFolders = (depth: number = 0): ContentClientInput.CreateManyRelationInput<ContemberClientEntities['Folder']> => {
	if (depth === 5) {
		return []
	}
	return Array.from({ length: faker.number.int({ min: 0, max: 5 }) }).map((_, i): ContentClientInput.CreateOneRelationInput<ContemberClientEntities['Folder']> => {
		return {
			create: {
				name: faker.lorem.words(2),
				children: i % 2 === 0 ? generateFolders(depth + 1) : [],
			},
		}
	})
}

const data = Array.from({ length: 5 }).map(() => {
	return queryBuilder.create('Folder', {
		data: {
			name: faker.lorem.words(2),
			children: generateFolders(),
		},
	})
})

export default printMutation(data)
