import { describe, expect, test } from 'bun:test'
import { AssignPolicyCommand, PolicyValidationError } from '../../../src/model/policy'

const fakeArgs = (): any => ({
	db: {
		// Should never be reached when validation fires up-front.
		query: () => {
			throw new Error('db.query should not be called when validation rejects')
		},
	},
})

describe('AssignPolicyCommand — defense-in-depth tag validation', () => {
	test('rejects template syntax in tags before hitting the DB', async () => {
		const cmd = new AssignPolicyCommand({
			identityId: 'id-1',
			policyId: 'pol-1',
			tags: { team: '${identity.id}' },
		})
		await expect(cmd.execute(fakeArgs())).rejects.toBeInstanceOf(PolicyValidationError)
	})

	test('rejects unsupported tag value types', async () => {
		const cmd = new AssignPolicyCommand({
			identityId: 'id-1',
			policyId: 'pol-1',
			tags: { wat: new Map() as unknown as string },
		})
		await expect(cmd.execute(fakeArgs())).rejects.toBeInstanceOf(PolicyValidationError)
	})

	test('rejects template syntax inside nested arrays', async () => {
		const cmd = new AssignPolicyCommand({
			identityId: 'id-1',
			policyId: 'pol-1',
			tags: { teams: ['eng', '${identity.team}'] },
		})
		await expect(cmd.execute(fakeArgs())).rejects.toBeInstanceOf(PolicyValidationError)
	})
})
