import { CryptoWrapper, HttpError, ProjectGroupContainer } from '@contember/engine-http'
import { Request } from 'koa'
import { ProjectGroupContainerResolver } from './ProjectGroupContainerResolver'

export class ProjectGroupResolver {
	private groupRegex = (
		this.projectGroupDomainMapping
			? new RegExp(
				this.projectGroupDomainMapping.includes('{group}')
					? regexpQuote(this.projectGroupDomainMapping).replace(regexpQuote('{group}'), '([^.]+)')
					: this.projectGroupDomainMapping,
			)
			: undefined
	)
	private projectGroupConfigHeader

	constructor(
		private projectGroupDomainMapping: string | undefined,
		projectGroupConfigHeader: string | undefined,
		private projectGroupConfigCrypto: CryptoWrapper | undefined,
		private projectGroupContainerResolver: ProjectGroupContainerResolver,
	) {
		this.projectGroupConfigHeader = projectGroupConfigHeader?.toLowerCase()
	}

	async resolveContainer({ request }: { request: Request }): Promise<ProjectGroupContainer> {
		let group: string | undefined = undefined
		let config = {}
		if (this.groupRegex) {
			const match = request.host.match(this.groupRegex)
			if (!match) {
				throw new HttpError('Project group not found', 404)
			}
			group = match[1]
			if (this.projectGroupConfigHeader) {
				const configHeader = request.get(this.projectGroupConfigHeader.toLowerCase())
				if (configHeader === '') {
					throw new HttpError(`${this.projectGroupConfigHeader} header is missing`, 400)
				}
				const configValue = Buffer.from(configHeader, 'base64')
				const decryptedValue = this.projectGroupConfigCrypto
					? (await this.projectGroupConfigCrypto?.decrypt(configValue, CryptoWrapper.cryptoVersion)).value
					: configValue
				try {
					config = JSON.parse(decryptedValue.toString())
				} catch (e: any) {
					throw new HttpError(`Cannot parse config: ${e.message}`, 400)
				}
			}
		}
		return await this.projectGroupContainerResolver.getProjectGroupContainer(group, config)
	}
}

const regexpQuote = (regexp: string) => regexp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
