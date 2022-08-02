import { AccessEvaluator, AccessNode, Authorizator } from '@contember/authorization'

type PermissionsMap = {
	[resource: string]: {
		[privilege: string]: (meta: any) => boolean
	}
}

export class DirectPermissionsAccessNode implements AccessNode {
	private permissions: PermissionsMap = {}

	public allow<Meta = undefined>(
		{ resource, privilege }: Authorizator.Action<Meta>,
		verifier: (meta: Meta) => boolean = () => true,
	) {
		this.permissions[resource] ??= {}
		this.permissions[resource][privilege] = verifier
	}

	isAllowed(accessEvaluator: AccessEvaluator, { resource, meta, privilege }: Authorizator.Action): Promise<boolean> {
		return Promise.resolve(this.permissions[resource]?.[privilege]?.(meta) === true)
	}
}
