import { expect, test } from 'bun:test'
import { createTester, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'
import { TenantRole } from '@contember/engine-tenant-api'
import * as TenantApi from '@contember/graphql-client-tenant'

test('manage global roles', async () => {
	const tester = await createTester(emptySchema)

	const signUpResult = await tester.tenant.send(TenantApi.mutation$
		.signUp(TenantApi
			.signUpResponse$$
			.result(TenantApi
				.signUpResult$
				.person(TenantApi
					.person$$
					.identity(TenantApi
						.identity$$,
					),
				),
			),
		), {
		email: `foo+${rand()}@example.com`,
		password: 'AbCdEf1234',
	})
	expect(signUpResult).toMatchObject({
		status: 200,
		body: {
			data: {
				signUp: {
					ok: true,
					result: {
						person: {
							identity: {
								roles: [TenantRole.PERSON],
							},
						},
					},
				},
			},
		},
	})
	const identity = signUpResult.body.data.signUp.result.person.identity.id
	const addRolesResult = await tester.tenant.send(TenantApi.mutation$
		.addGlobalIdentityRoles(TenantApi
			.addGlobalIdentityRolesResponse$$.result(TenantApi
				.addGlobalIdentityRolesResult$
				.identity(TenantApi
					.identity$$,
				),
			),
		), {
		identityId: identity,
		roles: [TenantRole.PROJECT_ADMIN, TenantRole.SUPER_ADMIN],
	})
	expect(addRolesResult).toMatchObject({
		status: 200,
		body: {
			data: {
				addGlobalIdentityRoles: {
					ok: true,
					result: {
						identity: {
							roles: [TenantRole.PERSON, TenantRole.PROJECT_ADMIN, TenantRole.SUPER_ADMIN],
						},
					},
				},
			},
		},
	})

	const removeRolesResult = await tester.tenant.send(TenantApi.mutation$
		.removeGlobalIdentityRoles(TenantApi
			.removeGlobalIdentityRolesResponse$$
			.result(TenantApi
				.removeGlobalIdentityRolesResult$
				.identity(TenantApi
					.identity$$,
				),
			),
		), {
		identityId: identity,
		roles: [TenantRole.PROJECT_ADMIN, TenantRole.SUPER_ADMIN],
	})
	expect(removeRolesResult).toMatchObject({
		status: 200,
		body: {
			data: {
				removeGlobalIdentityRoles: {
					ok: true,
					result: {
						identity: {
							roles: [TenantRole.PERSON],
						},
					},
				},
			},
		},
	})
})
