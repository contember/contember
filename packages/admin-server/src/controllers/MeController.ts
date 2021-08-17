import { BaseController } from './BaseController'
import type { IncomingMessage, ServerResponse } from 'http'
import type { TenantApi } from '../tenant'
import type { S3Manager } from '../s3'

interface MeResponsePayload {
	email: string
	personId: string

	projects: Array<{
		name: string
		slug: string
		roles: string[]
	}>
}

export class MeController extends BaseController {
	constructor(private tenant: TenantApi, private s3: S3Manager) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const token = this.readAuthCookie(req)
		if (token === null) {
			res.writeHead(403)
			res.end('missing auth cookie')
			return
		}

		const me = await this.tenant.getMe(token)
		if (me === null) {
			res.writeHead(403)
			res.end('cookie contains invalid token')
			return
		}

		const projectsWithAdmin = await this.s3.listProjectSlugs()
		const projects = me.projects
			.filter(it => projectsWithAdmin.includes(it.project.slug))
			.map(it => ({ name: it.project.name, slug: it.project.slug, roles: it.memberships.map(it => it.role) }))

		const payload: MeResponsePayload = { email: me.person.email, personId: me.person.id, projects	}
		res.setHeader('Content-Type', 'application/json')
		res.end(JSON.stringify(payload))
	}
}
