import { KoaMiddleware } from '../koa'
import { AuthMiddlewareState, ErrorFactory } from '../common'
import { ProjectGroupContainer, ProjectGroupContainerResolver } from '../ProjectGroupContainer'
import { CryptoWrapper } from '../utils/CryptoWrapper'
import { HttpError } from '../common/HttpError'

export interface ProjectGroupState {
	projectGroupContainer: ProjectGroupContainer
}

type InputKoaState =
	& AuthMiddlewareState

type KoaState =
	& InputKoaState
	& ProjectGroupState

export class ProjectGroupMiddlewareFactory {
	constructor(
		private projectGroupDomainMapping: string | undefined,
		private projectGroupConfigHeader: string | undefined,
		private projectGroupConfigCrypto: CryptoWrapper | undefined,
		private projectGroupContainerResolver: ProjectGroupContainerResolver,
	) {
	}

	create(): KoaMiddleware<KoaState> {
		const groupRegex = (
			this.projectGroupDomainMapping
				? new RegExp(
					this.projectGroupDomainMapping.includes('{group}')
						? regexpQuote(this.projectGroupDomainMapping).replace(regexpQuote('{group}'), '([^.]+)')
						: this.projectGroupDomainMapping,
				)
				: undefined
		)
		const projectGroup: KoaMiddleware<KoaState> = async (ctx, next) => {
			let group: string | undefined = undefined
			let config = {}
			if (groupRegex) {
				const match = ctx.request.host.match(groupRegex)
				if (!match) {
					throw new HttpError('Project group not found', 404)
				}
				group = match[1]
				if (this.projectGroupConfigHeader) {
					const configHeader = ctx.request.get(this.projectGroupConfigHeader.toLowerCase())
					if (configHeader === '') {
						throw new HttpError(`${this.projectGroupConfigHeader} header is missing`, 400)
					}
					const configValue = Buffer.from(configHeader, 'base64')
					const decryptedValue = this.projectGroupConfigCrypto ?
						(await this.projectGroupConfigCrypto?.decrypt(configValue, CryptoWrapper.cryptoVersion)).value
						: configValue
					try {
						config = JSON.parse(decryptedValue.toString())
					} catch (e: any) {
						throw new HttpError(`Cannot parse config: ${e.message}`, 400)
					}
				}
			}
			ctx.state.projectGroupContainer = await this.projectGroupContainerResolver.getProjectGroupContainer(group, config)
			return next()
		}
		return projectGroup
	}
}

const regexpQuote = (regexp: string) => regexp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
