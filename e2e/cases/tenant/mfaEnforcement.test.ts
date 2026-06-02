import { expect, test } from 'bun:test'
import { Secret, TOTP } from 'otpauth'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { createTester, executeGraphql, loginToken, rand, rootToken } from "../../src/tester.js"

// Project-scoped policy isolation:
// Global identity roles are restricted to the fixed TenantRole enum, so a *global*
// auth_policy cannot be targeted at a uniquely-named role without affecting other
// persons. A *project*-scoped policy matches against project-membership roles
// (arbitrary names) keyed by project_id, so a unique role in a fresh per-test
// project is fully isolated. We still clean up the policy row in a finally block.

namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}

const signInMutation = `mutation($email: String!, $password: String!, $otp: String) {
	signIn(email: $email, password: $password, otpToken: $otp) {
		ok
		error { code mfaEnrollment { otpUri otpSecret } }
		result { token backupCodes }
	}
}`
const createAuthPolicyMutation = `mutation($policy: AuthPolicyInput!) {
	createAuthPolicy(policy: $policy) { ok error { code } result { id } }
}`
const deleteAuthPolicyMutation = `mutation($id: String!) {
	deleteAuthPolicy(id: $id) { ok error { code } }
}`
const resetPersonMfaMutation = `mutation($personId: String!) {
	resetPersonMfa(personId: $personId) { ok error { code } }
}`
const myPersonIdQuery = `query { me { person { id } } }`

const generateToken = (secret: string): string => new TOTP({ secret: Secret.fromBase32(secret), digits: 6 }).generate()

const buildSchema = (role: string) =>
	createSchema(TagModel, schema => ({
		...schema,
		acl: {
			roles: {
				[role]: {
					stages: '*',
					entities: new AllowAllPermissionFactory().create(schema.model),
					variables: {},
				},
			},
		},
	}))

test('project-scoped MFA policy forces enrollment, completes via TOTP, resets, and leaves un-roled persons unaffected', async () => {
	const role = `mfa_required_${rand()}`
	const tester = await createTester(buildSchema(role))
	const slug = tester.projectSlug
	const password = 'HWGA51KKpJ4lSW'

	// Person A: holds the policy-targeted role.
	const emailA = `mfa-a-${rand()}@doe.com`
	const identityA = await tester.tenant.signUp(emailA, password)
	await tester.tenant.addProjectMember(identityA, slug, { role, variables: [] })

	// Person B: a member with no special role -> must be unaffected by the policy.
	const emailB = `mfa-b-${rand()}@doe.com`
	await tester.tenant.signUp(emailB, password)

	let policyId: string | null = null
	try {
		const created = await executeGraphql('/tenant', createAuthPolicyMutation, {
			authorizationToken: rootToken,
			variables: { policy: { scope: 'project', project: slug, roles: [role], mfaRequired: true } },
		})
		expect(created.body.data.createAuthPolicy.error).toBe(null)
		expect(created.body.data.createAuthPolicy.ok).toBe(true)
		policyId = created.body.data.createAuthPolicy.result.id

		// 1) Person A, no factor -> MFA_ENROLLMENT_REQUIRED with a pending secret.
		const enroll = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: emailA, password, otp: null },
		})
		expect(enroll.body.data.signIn.ok).toBe(false)
		expect(enroll.body.data.signIn.error.code).toBe('MFA_ENROLLMENT_REQUIRED')
		const secret: string = enroll.body.data.signIn.error.mfaEnrollment.otpSecret
		expect(secret).toBeTruthy()
		expect(enroll.body.data.signIn.error.mfaEnrollment.otpUri).toBeTruthy()

		// The MFA_ENROLLMENT_REQUIRED step is logged as a failed `login`, so the
		// per-email backoff (base 1s) gates an immediate retry; wait it out.
		await new Promise(resolve => setTimeout(resolve, 1500))

		// 2) Complete enrollment with a TOTP from the pending secret -> success + backup codes.
		const completed = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: emailA, password, otp: generateToken(secret) },
		})
		expect(completed.body.data.signIn.error).toBe(null)
		expect(completed.body.data.signIn.ok).toBe(true)
		expect(completed.body.data.signIn.result.token).toHaveLength(40)
		expect(completed.body.data.signIn.result.backupCodes).toHaveLength(10)
		const tokenA = completed.body.data.signIn.result.token

		// Person B (no targeted role) signs in normally - proves the policy is scoped.
		const bResp = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: emailB, password, otp: null },
		})
		expect(bResp.body.data.signIn.error).toBe(null)
		expect(bResp.body.data.signIn.ok).toBe(true)

		// 3) resetPersonMfa clears the factor; A must enroll again.
		const meResp = await executeGraphql('/tenant', myPersonIdQuery, { authorizationToken: tokenA })
		const personIdA: string = meResp.body.data.me.person.id
		const reset = await executeGraphql('/tenant', resetPersonMfaMutation, {
			authorizationToken: rootToken,
			variables: { personId: personIdA },
		})
		expect(reset.body.data.resetPersonMfa.error).toBe(null)
		expect(reset.body.data.resetPersonMfa.ok).toBe(true)

		const reEnroll = await executeGraphql('/tenant', signInMutation, {
			authorizationToken: loginToken,
			variables: { email: emailA, password, otp: null },
		})
		expect(reEnroll.body.data.signIn.ok).toBe(false)
		expect(reEnroll.body.data.signIn.error.code).toBe('MFA_ENROLLMENT_REQUIRED')
	} finally {
		if (policyId !== null) {
			const del = await executeGraphql('/tenant', deleteAuthPolicyMutation, {
				authorizationToken: rootToken,
				variables: { id: policyId },
			})
			expect(del.body.data.deleteAuthPolicy.ok).toBe(true)
		}
	}
})
