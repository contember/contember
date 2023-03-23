import { Model } from '@contember/schema'
import {
	Environment,
	identityEnvironmentExtension,
	projectEnvironmentExtension,
	Schema as AdminSchema,
} from '@contember/admin'

import { convertModelToAdminSchema } from './schema'
import { PageConfig } from './config'


export const createEnvironment = ({ model, role, pageConfig }: { role: string; model: Model.Schema; pageConfig: PageConfig }) => {
	return Environment.create().withSchema(new AdminSchema(convertModelToAdminSchema(model)))
		.withExtension(projectEnvironmentExtension, 'test')
		.withExtension(identityEnvironmentExtension, {
			id: '00000000-0000-0000-0000-000000000000',
			projects: [{ name: 'test', slug: 'test', roles: [role] }],
			person: {
				id: '00000000-0000-0000-0000-000000000000',
				email: 'root@localhost',
				otpEnabled: false,
			},
			permissions: {
				canCreateProject: false,
			},
			email: 'root@localhost',
			otpEnabled: false,
			personId: '00000000-0000-0000-0000-000000000000',
		})
		.withParameters(pageConfig.parameters ?? {})
		.withDimensions(pageConfig.dimensions ?? {})
}
