import { GraphQlClientError } from '@contember/graphql-client'

/**
 * Tells a permission rejection apart from a genuine failure.
 *
 * The listing queries return an empty result when the caller may not see
 * anything, but the configuration queries (`configuration`, `authPolicies`,
 * `identityProviders`, `mailTemplates`) throw instead. Their resolvers call
 * `requireAccess`, which raises a `ForbiddenError` carrying
 * `extensions.code = 'ForbiddenError'` — that is what this matches.
 *
 * A view can then say "you do not have access to this" instead of showing a
 * failure the user cannot act on.
 */
export const isForbiddenError = (error: unknown): boolean => {
	if (!(error instanceof GraphQlClientError)) {
		return false
	}
	if (error.type === 'forbidden') {
		return true
	}
	return error.errors?.some(it => it?.extensions?.code === 'ForbiddenError') ?? false
}
