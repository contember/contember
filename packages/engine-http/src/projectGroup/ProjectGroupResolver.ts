import { CryptoWrapper } from '../utils/CryptoWrapper'
import { ProjectGroupContainer } from './ProjectGroupContainer'
import { IncomingMessage } from 'node:http'
import { ProjectGroupContainerResolver } from './ProjectGroupContainerResolver'
import { HttpErrorResponse } from '../common'

export class ProjectGroupResolver {
	private groupRegex
	private projectGroupConfigHeader

	constructor(
		private projectGroupDomainMapping: string | undefined,
		projectGroupConfigHeader: string | undefined,
		private projectGroupConfigCrypto: CryptoWrapper | undefined,
		private projectGroupContainerResolver: ProjectGroupContainerResolver,
	) {
		this.projectGroupConfigHeader = projectGroupConfigHeader?.toLowerCase()
		this.groupRegex = (
			this.projectGroupDomainMapping
				? new RegExp(
					this.projectGroupDomainMapping.includes('{group}')
						? regexpQuote(this.projectGroupDomainMapping).replace(regexpQuote('{group}'), '([^.]+)')
						: this.projectGroupDomainMapping,
				)
				: undefined
		)
	}

	async resolveContainer({ request }: { request: IncomingMessage }): Promise<ProjectGroupContainer> {
		let group: string | undefined = undefined
		let config = {}
		if (this.groupRegex) {
			const host = request.headers.host
			const match = host?.match(this.groupRegex)
			if (!match) {
				throw new HttpErrorResponse(404, 'Project group not found')
			}
			group = match[1]
			if (this.projectGroupConfigHeader) {
				const configHeader = request.headers[this.projectGroupConfigHeader.toLowerCase()]
				if (typeof configHeader !== 'string' || configHeader === '') {
					throw new HttpErrorResponse(400, `${this.projectGroupConfigHeader} header is missing`)
				}
				const configValue = Buffer.from(configHeader, 'base64')
				const decryptedValue = this.projectGroupConfigCrypto
					? (await this.projectGroupConfigCrypto?.decrypt(configValue, CryptoWrapper.cryptoVersion)).value
					: configValue
				try {
					config = JSON.parse(decryptedValue.toString())
				} catch (e: any) {
					throw new HttpErrorResponse(400, `Cannot parse config: ${e.message}`)
				}
			}
		}
		return await this.projectGroupContainerResolver.getProjectGroupContainer(group, config)
	}
}

const regexpQuote = (regexp: string) => regexp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
