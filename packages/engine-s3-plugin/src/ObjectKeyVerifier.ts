import pm, { Matcher } from 'picomatch'
import { ForbiddenError } from '@contember/graphql-utils'

export type ObjectKeyVerifier = (key: string) => void

export const createObjectKeyVerifier = (patterns: string[]): ObjectKeyVerifier => {
	const matchers: Matcher[] = patterns.map(it => pm(it))

	return key => {
		if (!matchers.find(it => it(key))) {
			throw new ForbiddenError(`You are not allowed to use object key ${key}`)
		}
	}
}
