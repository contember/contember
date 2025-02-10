import { ContentMutation } from '@contember/client-content'
import { queryBuilder } from '../client'
import { printMutation } from './utils'
import { faker } from '@faker-js/faker'

faker.seed(123)
const mutations: ContentMutation<any>[] = []

for (const canRead of [true, false]) {
	for (const canEdit of [true, false]) {
		for (const canReadSecondary of [true, false]) {
			mutations.push(queryBuilder.create('AclRestrictedValue', {
				data: {
					canRead,
					canReadSecondary,
					canEdit,
					primaryValue: faker.company.name(),
					secondaryValue: faker.company.name(),
				},
			}))
		}
	}
}

export default printMutation([
	...mutations,
])
