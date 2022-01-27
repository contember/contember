import { regexpQuote } from '../utils/regexpQuote'
import { BadRequestError } from '../BadRequestError'

export class ProjectGroupResolver {
	static GROUP_PLACEHOLDER = '{group}'

	private readonly domainMappingRegexp: RegExp | undefined

	constructor(
		domainMappingRegexp?: string,
	) {
		if (!domainMappingRegexp) {
			this.domainMappingRegexp = undefined

		} else {
			const pattern = regexpQuote(domainMappingRegexp)
				.replace(regexpQuote(ProjectGroupResolver.GROUP_PLACEHOLDER), '([^.]+)')
				.replace(regexpQuote('*'), '[^.]+')

			this.domainMappingRegexp = new RegExp('^' + pattern + '$')
		}
	}

	resolve(hostname: string): string | undefined {
		if (!this.domainMappingRegexp) {
			return undefined
		}

		const match = this.domainMappingRegexp.exec(hostname)

		if (!match || !match[1]) {
			throw new BadRequestError(500, `Unable to resolve hostname ${hostname}`)
		}

		return match[1]
	}
}
