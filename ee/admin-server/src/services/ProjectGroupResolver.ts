import { regexpQuote } from '../utils/regexpQuote'
import { BadRequestError } from '../BadRequestError'

export class ProjectGroupResolver {
	static GROUP_PLACEHOLDER = '{group}'

	private domainMappingRegexp: RegExp | undefined

	constructor(
		domainMappingRegexp?: string,
	) {
		this.domainMappingRegexp = domainMappingRegexp
			? new RegExp(regexpQuote(domainMappingRegexp).replace(regexpQuote(ProjectGroupResolver.GROUP_PLACEHOLDER), '([^.]+)'))
			: undefined
	}

	resolve(hostname: string): string | undefined {
		if (!this.domainMappingRegexp) {
			return undefined
		}
		const match = this.domainMappingRegexp.exec(hostname)
		if (!match || !match[1]) {
			throw new BadRequestError(404, 'Not Found')
		}
		return match[1]
	}
}
