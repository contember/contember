import { ConfigPolicy } from '../../../schema/index.js'

/**
 * Resolves whether passwordless sign-in is effectively available for a person,
 * combining the tenant-wide policy with the person's own flag. This is the same
 * gate the passwordless sign-in flow applies, so any caller that reasons about a
 * person's usable sign-in methods (e.g. the IdP disconnect lock-out check) stays
 * consistent with what sign-in actually permits.
 */
export const isPasswordlessEnabled = (globalValue: ConfigPolicy, personValue: boolean | null): boolean => {
	switch (globalValue) {
		case 'always':
			return true
		case 'never':
			return false
		case 'optIn':
			return personValue === true
		case 'optOut':
			return personValue !== false
	}
}
