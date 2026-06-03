import {
	Policy as GraphQLPolicy,
	PolicyAssignment as GraphQLPolicyAssignment,
	PolicyDocument as GraphQLPolicyDocument,
	PolicyDocumentInput,
} from '../../schema/index.js'
import { Policy as PolicyDocumentModel } from '@contember/policy'
import { IdentityPolicyAssignment, PolicyDto } from '../../model/policy/index.js'
import { BuiltinPolicyDefinition } from '../../model/policy/builtinPolicies.js'

export class PolicyResponseFactory {
	static toGraphQL(policy: PolicyDto): GraphQLPolicy {
		return {
			id: policy.id,
			slug: policy.slug,
			label: policy.label,
			description: policy.description,
			document: documentToGraphQL(policy.document),
			version: policy.version,
			createdAt: policy.createdAt,
			updatedAt: policy.updatedAt,
		}
	}

	static assignmentToGraphQL(assignment: IdentityPolicyAssignment, policy: PolicyDto): GraphQLPolicyAssignment {
		return {
			policy: PolicyResponseFactory.toGraphQL(policy),
			identityId: assignment.identityId,
			tags: assignment.tags,
			grantedBy: assignment.grantedBy,
			grantedAt: assignment.grantedAt,
		}
	}

	static builtinToGraphQL(builtin: BuiltinPolicyDefinition) {
		return {
			role: builtin.role,
			slug: builtin.slug,
			label: builtin.label,
			description: builtin.description,
			document: documentToGraphQL(builtin.document),
		}
	}
}

function documentToGraphQL(document: PolicyDto['document']): GraphQLPolicyDocument {
	return {
		version: document.version ?? null,
		statements: document.statements.map(stmt => ({
			effect: stmt.effect,
			actions: [...stmt.actions],
			resources: stmt.resources ? [...stmt.resources] : null,
			conditions: stmt.conditions ?? null,
		})),
	}
}

export function policyDocumentFromInput(input: PolicyDocumentInput): PolicyDocumentModel {
	return {
		version: input.version ?? undefined,
		statements: input.statements.map(stmt => ({
			effect: stmt.effect,
			actions: stmt.actions,
			resources: stmt.resources ?? undefined,
			conditions: stmt.conditions as PolicyDocumentModel['statements'][number]['conditions'],
		})),
	}
}
