import { describe, expect, test } from 'bun:test'
import { PolicyEngine, StaticPolicySource } from '@contember/policy'
import { Acl } from '@contember/schema'
import { BUILTIN_POLICIES, ProjectSchemaPolicyProvider, TenantActions, TenantResources } from '../../../src/model/policy'

const decision = async (sources: { name: string; statements: any[] }[], action: string, resource: string, ctx: any) => {
	const engine = new PolicyEngine(sources.map(s => new StaticPolicySource(s.name, s.statements)))
	const result = await engine.evaluate(action, resource, ctx)
	return result.decision
}

describe('built-in policies', () => {
	test('super_admin allows everything', async () => {
		const superAdmin = BUILTIN_POLICIES.find(p => p.slug === 'builtin:super_admin')!
		const d = await decision(
			[{ name: 'sa', statements: [...superAdmin.document.statements] }],
			TenantActions.projectCreate,
			'*',
			{},
		)
		expect(d).toBe('allow')
	})

	test('login allows sign-in only', async () => {
		const login = BUILTIN_POLICIES.find(p => p.slug === 'builtin:login')!
		const sources = [{ name: 'l', statements: [...login.document.statements] }]
		expect(await decision(sources, TenantActions.personSignIn, '*', {})).toBe('allow')
		expect(await decision(sources, TenantActions.personDisable, '*', {})).toBe('deny')
		expect(await decision(sources, TenantActions.projectCreate, '*', {})).toBe('deny')
	})

	test('project_creator allows only project.create', async () => {
		const pc = BUILTIN_POLICIES.find(p => p.slug === 'builtin:project_creator')!
		const sources = [{ name: 'pc', statements: [...pc.document.statements] }]
		expect(await decision(sources, TenantActions.projectCreate, '*', {})).toBe('allow')
		expect(await decision(sources, TenantActions.projectUpdate, '*', {})).toBe('deny')
	})

	test('person allows own profile/password but not other ops', async () => {
		const person = BUILTIN_POLICIES.find(p => p.slug === 'builtin:person')!
		const sources = [{ name: 'p', statements: [...person.document.statements] }]
		expect(await decision(sources, TenantActions.personChangeMyPassword, '*', {})).toBe('allow')
		expect(await decision(sources, TenantActions.personSetupOtp, '*', {})).toBe('allow')
		expect(await decision(sources, TenantActions.personChangePassword, '*', {})).toBe('deny')
		expect(await decision(sources, TenantActions.personDisable, '*', {})).toBe('deny')
	})

	test('project_admin allowlist: only LOGIN/PROJECT_ADMIN/ENTRYPOINT_DEPLOYER may be granted', async () => {
		const pa = BUILTIN_POLICIES.find(p => p.slug === 'builtin:project_admin')!
		const sources = [{ name: 'pa', statements: [...pa.document.statements] }]
		// allowlist roles — allowed
		expect(
			await decision(sources, TenantActions.identityAddGlobalRoles, '*', {
				subject: { roles: ['login'] },
			}),
		).toBe('allow')
		expect(
			await decision(sources, TenantActions.identityAddGlobalRoles, '*', {
				subject: { roles: ['login', 'project_admin', 'entrypoint_deployer'] },
			}),
		).toBe('allow')
		// super_admin / project_creator — explicitly outside allowlist
		expect(
			await decision(sources, TenantActions.identityAddGlobalRoles, '*', {
				subject: { roles: ['super_admin'] },
			}),
		).toBe('deny')
		expect(
			await decision(sources, TenantActions.identityAddGlobalRoles, '*', {
				subject: { roles: ['project_creator'] },
			}),
		).toBe('deny')
		// arbitrary unknown role — must also be denied (this was the regression
		// the original `projectAdminAllowedInputRoles` allowlist caught and the
		// previous policy formulation missed)
		expect(
			await decision(sources, TenantActions.identityAddGlobalRoles, '*', {
				subject: { roles: ['random-role'] },
			}),
		).toBe('deny')
		// mix with one outside the allowlist — denied
		expect(
			await decision(sources, TenantActions.identityAddGlobalRoles, '*', {
				subject: { roles: ['login', 'super_admin'] },
			}),
		).toBe('deny')
	})

	test('project_admin allowlist guard also covers apiKeyCreateGlobal and personSignUp', async () => {
		const pa = BUILTIN_POLICIES.find(p => p.slug === 'builtin:project_admin')!
		const sources = [{ name: 'pa', statements: [...pa.document.statements] }]
		for (const action of [TenantActions.apiKeyCreateGlobal, TenantActions.personSignUp, TenantActions.identityRemoveGlobalRoles]) {
			expect(
				await decision(sources, action, '*', { subject: { roles: ['login'] } }),
			).toBe('allow')
			expect(
				await decision(sources, action, '*', { subject: { roles: ['random'] } }),
			).toBe('deny')
		}
	})

	test('project_admin can disable normal people, not super_admin', async () => {
		const pa = BUILTIN_POLICIES.find(p => p.slug === 'builtin:project_admin')!
		const sources = [{ name: 'pa', statements: [...pa.document.statements] }]
		expect(
			await decision(sources, TenantActions.personDisable, 'person:abc', {
				subject: { targetRoles: ['person'] },
			}),
		).toBe('allow')
		expect(
			await decision(sources, TenantActions.personDisable, 'person:abc', {
				subject: { targetRoles: ['super_admin'] },
			}),
		).toBe('deny')
	})

	test('project_admin can manage IdP', async () => {
		const pa = BUILTIN_POLICIES.find(p => p.slug === 'builtin:project_admin')!
		const sources = [{ name: 'pa', statements: [...pa.document.statements] }]
		expect(await decision(sources, TenantActions.idpAdd, '*', {})).toBe('allow')
		expect(await decision(sources, TenantActions.idpUpdate, '*', {})).toBe('allow')
		expect(await decision(sources, TenantActions.idpList, '*', {})).toBe('allow')
	})
})

describe('ProjectSchemaPolicyProvider — translation', () => {
	const aclWithManage: Acl.Schema = {
		roles: {
			admin: { entities: {} },
			editor: {
				entities: {},
				tenant: {
					manage: {
						editor: { variables: { team: 'team' } },
						viewer: true,
					},
					invite: true,
					view: { admin: true },
				},
			},
		} as any,
	}

	test('manage allows add/update/remove/view member for matching role+variables', async () => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl: aclWithManage,
			memberships: [
				{ role: 'editor', variables: [{ name: 'team', values: ['eng'] }] },
			],
		})
		const engine = new PolicyEngine([provider])
		const resource = TenantResources.project('webmaster')

		// editor → editor with matching team — allowed
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, resource, {
				subject: { membership: { role: 'editor', variables: { team: ['eng'] } } },
			})).decision,
		).toBe('allow')

		// editor → editor with different team — denied
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, resource, {
				subject: { membership: { role: 'editor', variables: { team: ['ops'] } } },
			})).decision,
		).toBe('deny')

		// editor → viewer (always true) — allowed
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, resource, {
				subject: { membership: { role: 'viewer', variables: {} } },
			})).decision,
		).toBe('allow')

		// editor → admin (not listed in manage) — denied
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, resource, {
				subject: { membership: { role: 'admin', variables: {} } },
			})).decision,
		).toBe('deny')
	})

	test('invite=true falls back to manage rule', async () => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl: aclWithManage,
			memberships: [{ role: 'editor', variables: [{ name: 'team', values: ['eng'] }] }],
		})
		const engine = new PolicyEngine([provider])
		const resource = TenantResources.project('webmaster')

		expect(
			(await engine.evaluate(TenantActions.personInvite, resource, {
				subject: { membership: { role: 'editor', variables: { team: ['eng'] } } },
			})).decision,
		).toBe('allow')

		expect(
			(await engine.evaluate(TenantActions.personInvite, resource, {
				subject: { membership: { role: 'editor', variables: { team: ['ops'] } } },
			})).decision,
		).toBe('deny')
	})

	test('view rule allows only viewMember action', async () => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl: aclWithManage,
			memberships: [{ role: 'editor', variables: [] }],
		})
		const engine = new PolicyEngine([provider])
		const resource = TenantResources.project('webmaster')

		// "view" allows viewing admin members
		expect(
			(await engine.evaluate(TenantActions.projectViewMember, resource, {
				subject: { membership: { role: 'admin', variables: {} } },
			})).decision,
		).toBe('allow')

		// "view" doesn't allow modifying admin members
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, resource, {
				subject: { membership: { role: 'admin', variables: {} } },
			})).decision,
		).toBe('deny')
	})

	test('no rule for a role = no statements', async () => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl: { roles: { other: { entities: {} } } } as any,
			memberships: [{ role: 'other', variables: [] }],
		})
		const stmts = provider.getStatements({})
		expect(stmts).toHaveLength(0)
	})

	test('different project scope does not match', async () => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl: aclWithManage,
			memberships: [{ role: 'editor', variables: [] }],
		})
		const engine = new PolicyEngine([provider])
		// Action with the right verb but pointing at a different project
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, TenantResources.project('other'), {
				subject: { membership: { role: 'viewer', variables: {} } },
			})).decision,
		).toBe('deny')
	})
})

/**
 * Semantic edge cases for the manage-rule translation. These pin down behavior
 * the rule grammar inherits from the legacy membership matcher (e.g. variable
 * subset constraints, vacuous matches, extra-variable rejection).
 */
describe('ProjectSchemaPolicyProvider — membership rule semantics', () => {
	const aclWithVariables: Acl.Schema = {
		roles: {
			editor: {
				entities: {},
				tenant: {
					manage: {
						editor: { variables: { team: 'team' } },
					},
				},
			},
			noVarRule: {
				entities: {},
				tenant: {
					manage: {
						// MembershipRoleMatchRule with no variables — rejects any subject vars
						viewer: {},
					},
				},
			},
		},
	} as any

	const runPolicy = async (
		acl: Acl.Schema,
		invoker: Acl.Membership,
		subject: Acl.Membership,
	): Promise<boolean> => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl,
			memberships: [invoker],
		})
		const engine = new PolicyEngine([provider])
		const result = await engine.evaluate(TenantActions.projectAddMember, TenantResources.project('webmaster'), {
			subject: {
				membership: {
					role: subject.role,
					variables: Object.fromEntries(subject.variables.map(v => [v.name, v.values])),
				},
			},
		})
		return result.decision === 'allow'
	}

	test('subject with no variables — vacuously matches invoker with variables', async () => {
		const invoker: Acl.Membership = { role: 'editor', variables: [{ name: 'team', values: ['eng'] }] }
		const subject: Acl.Membership = { role: 'editor', variables: [] }

		expect(await runPolicy(aclWithVariables, invoker, subject)).toBe(true)
	})

	test('subject with extra variable not in rule — deny', async () => {
		const invoker: Acl.Membership = { role: 'editor', variables: [{ name: 'team', values: ['eng'] }] }
		const subject: Acl.Membership = {
			role: 'editor',
			variables: [
				{ name: 'team', values: ['eng'] },
				{ name: 'dept', values: ['ops'] },
			],
		}

		expect(await runPolicy(aclWithVariables, invoker, subject)).toBe(false)
	})

	test('subject values subset of invoker — allow', async () => {
		const invoker: Acl.Membership = { role: 'editor', variables: [{ name: 'team', values: ['eng', 'platform'] }] }
		const subject: Acl.Membership = { role: 'editor', variables: [{ name: 'team', values: ['eng'] }] }

		expect(await runPolicy(aclWithVariables, invoker, subject)).toBe(true)
	})

	test('subject values not subset of invoker — deny', async () => {
		const invoker: Acl.Membership = { role: 'editor', variables: [{ name: 'team', values: ['eng'] }] }
		const subject: Acl.Membership = { role: 'editor', variables: [{ name: 'team', values: ['ops'] }] }

		expect(await runPolicy(aclWithVariables, invoker, subject)).toBe(false)
	})

	test('rule = `{}` (no variables key) — empty-variables subject passes vacuously', async () => {
		// `MembershipRoleMatchRule` = `{}` (no `variables` key) — a subject with
		// no variables passes vacuously (the forAllKeys check sees an empty
		// subject), but any non-empty subject variable set is rejected by the
		// shape constraint.
		const invoker: Acl.Membership = { role: 'noVarRule', variables: [] }

		const subjectEmpty: Acl.Membership = { role: 'viewer', variables: [] }
		expect(await runPolicy(aclWithVariables, invoker, subjectEmpty)).toBe(true)

		const subjectWithVar: Acl.Membership = {
			role: 'viewer',
			variables: [{ name: 'anything', values: ['x'] }],
		}
		expect(await runPolicy(aclWithVariables, invoker, subjectWithVar)).toBe(false)
	})

	test('rule.variables === true — any subject variables allowed', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: {
					entities: {},
					tenant: { manage: { viewer: { variables: true } } },
				},
			},
		} as any
		const invoker: Acl.Membership = { role: 'editor', variables: [] }
		const subject: Acl.Membership = {
			role: 'viewer',
			variables: [{ name: 'whatever', values: ['x', 'y'] }],
		}

		expect(await runPolicy(acl, invoker, subject)).toBe(true)
	})
})

/**
 * Regression tests for the invite/manage fallback semantics:
 *
 * 1. `invite: true, manage: undefined` must deny (the fallback rule `{}`
 *    matches nothing) — NOT emit an unconditional allow.
 * 2. When the outer "some role has invite" gate passes, all invoker memberships
 *    must contribute (their `manage` rule acting as the invite rule), even if
 *    their own role doesn't set invite. Decisions union across memberships.
 */
describe('ProjectSchemaPolicyProvider — invite/manage fallback semantics', () => {
	const runPolicyInvite = async (
		acl: Acl.Schema,
		invoker: readonly Acl.Membership[],
		subject: Acl.Membership,
	): Promise<boolean> => {
		const provider = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl,
			memberships: invoker,
		})
		const engine = new PolicyEngine([provider])
		const result = await engine.evaluate(TenantActions.personInvite, TenantResources.project('webmaster'), {
			subject: {
				membership: {
					role: subject.role,
					variables: Object.fromEntries(subject.variables.map(v => [v.name, v.values])),
				},
			},
		})
		return result.decision === 'allow'
	}

	test('invite=true, manage=undefined → deny (fallback "{}" rule matches nothing)', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: { entities: {}, tenant: { invite: true } },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'editor', variables: [] }]
		const subject: Acl.Membership = { role: 'viewer', variables: [] }

		expect(await runPolicyInvite(acl, invoker, subject)).toBe(false)
	})

	test('invite=true, manage=true → allow (fallback "true" rule matches anything)', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: { entities: {}, tenant: { invite: true, manage: true } },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'editor', variables: [] }]
		const subject: Acl.Membership = { role: 'anyone', variables: [] }

		expect(await runPolicyInvite(acl, invoker, subject)).toBe(true)
	})

	test('invite=true, manage={admin: true} → allow only admin subjects', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: { entities: {}, tenant: { invite: true, manage: { admin: true } } },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'editor', variables: [] }]
		const admin: Acl.Membership = { role: 'admin', variables: [] }
		const other: Acl.Membership = { role: 'viewer', variables: [] }

		expect(await runPolicyInvite(acl, invoker, admin)).toBe(true)
		expect(await runPolicyInvite(acl, invoker, other)).toBe(false)
	})

	test('invite={admin: true}, manage=undefined → use invite object, allow admin', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: { entities: {}, tenant: { invite: { admin: true } } },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'editor', variables: [] }]
		const admin: Acl.Membership = { role: 'admin', variables: [] }
		const other: Acl.Membership = { role: 'viewer', variables: [] }

		expect(await runPolicyInvite(acl, invoker, admin)).toBe(true)
		expect(await runPolicyInvite(acl, invoker, other)).toBe(false)
	})

	test('cross-role union: roleX invite=true,manage=undefined + roleY manage={admin: true} → allow admin via roleY', async () => {
		const acl: Acl.Schema = {
			roles: {
				roleX: { entities: {}, tenant: { invite: true } },
				roleY: { entities: {}, tenant: { manage: { admin: true } } },
			},
		} as any
		// Invoker holds BOTH memberships. The invite outer gate is opened by
		// roleX's truthy invite; then every membership's effective rule
		// contributes — roleY's rule (manage ?? {} = {admin: true}) matches the
		// admin subject.
		const invoker: Acl.Membership[] = [
			{ role: 'roleX', variables: [] },
			{ role: 'roleY', variables: [] },
		]
		const admin: Acl.Membership = { role: 'admin', variables: [] }

		expect(await runPolicyInvite(acl, invoker, admin)).toBe(true)
	})

	test('cross-role: only roleX has invite=true,manage=undefined, no other roles → deny everyone', async () => {
		const acl: Acl.Schema = {
			roles: {
				roleX: { entities: {}, tenant: { invite: true } },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'roleX', variables: [] }]
		const admin: Acl.Membership = { role: 'admin', variables: [] }

		expect(await runPolicyInvite(acl, invoker, admin)).toBe(false)
	})

	test('no role has invite at all → invite always denied (outer gate)', async () => {
		const acl: Acl.Schema = {
			roles: {
				editor: { entities: {}, tenant: { manage: { admin: true } } },
			},
		} as any
		const invoker: Acl.Membership[] = [{ role: 'editor', variables: [] }]
		const admin: Acl.Membership = { role: 'admin', variables: [] }

		// inviteEnabled is false → no invite statements emitted
		expect(await runPolicyInvite(acl, invoker, admin)).toBe(false)
	})
})

describe('multi-source composition', () => {
	test('tenant policy + project schema combine — allow from either source wins', async () => {
		// Built-in PERSON role allows changeMyPassword
		const person = BUILTIN_POLICIES.find(p => p.slug === 'builtin:person')!
		const schema = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl: {
				roles: {
					editor: { entities: {}, tenant: { manage: { viewer: true } } },
				},
			} as any,
			memberships: [{ role: 'editor', variables: [] }],
		})
		const engine = new PolicyEngine([
			new StaticPolicySource('tenant', [...person.document.statements]),
			schema,
		])

		// from tenant
		expect((await engine.evaluate(TenantActions.personChangeMyPassword, '*', {})).decision).toBe('allow')
		// from schema
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, TenantResources.project('webmaster'), {
				subject: { membership: { role: 'viewer', variables: {} } },
			})).decision,
		).toBe('allow')
		// neither covers
		expect((await engine.evaluate(TenantActions.projectCreate, '*', {})).decision).toBe('deny')
	})

	test('explicit deny in tenant policy overrides allow in schema', async () => {
		const schemaAllowAll = new ProjectSchemaPolicyProvider({
			slug: 'webmaster',
			acl: {
				roles: {
					editor: { entities: {}, tenant: { manage: { editor: true, viewer: true } } },
				},
			} as any,
			memberships: [{ role: 'editor', variables: [] }],
		})
		const denyManagement = new StaticPolicySource('tenant', [{
			effect: 'deny' as const,
			actions: [TenantActions.projectAddMember, TenantActions.projectRemoveMember],
			resources: ['*'],
		}])

		const engine = new PolicyEngine([denyManagement, schemaAllowAll])
		expect(
			(await engine.evaluate(TenantActions.projectAddMember, TenantResources.project('webmaster'), {
				subject: { membership: { role: 'viewer', variables: {} } },
			})).decision,
		).toBe('deny')
		// projectViewMember is not denied, still allowed by schema
		expect(
			(await engine.evaluate(TenantActions.projectViewMember, TenantResources.project('webmaster'), {
				subject: { membership: { role: 'viewer', variables: {} } },
			})).decision,
		).toBe('allow')
	})
})
