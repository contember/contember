import { BindingError, Environment, TreeNodeEnvironmentFactory } from '@contember/binding'
import { Component } from '../coreComponents'
import { recursionTerminatorEnvironmentExtension, RecursionTerminatorProps } from './RecursionTerminator'
import { EnvironmentMiddleware } from '../accessorPropagation'

export const RecursionTerminatorPortal = Component<RecursionTerminatorProps>(({ field, children }) => {
	return <EnvironmentMiddleware args={[field]} create={createEnvWithExtension} >{children}</EnvironmentMiddleware>
})

const createEnvWithExtension = (env: Environment, [{ field, kind }]: [field: RecursionTerminatorProps['field']]) => {
	const envForField = kind === 'hasOne'
		? TreeNodeEnvironmentFactory.createEnvironmentForEntity(env, { field })
		: TreeNodeEnvironmentFactory.createEnvironmentForEntityList(env, { field })

	const parentNode = envForField.getSubTreeNode()
	if (!(parentNode.type === 'entity-list' || parentNode.type === 'entity')) {
		throw new BindingError()
	}
	return env.withExtension(recursionTerminatorEnvironmentExtension, {
		shouldTerminate: args => {
			if (args.environment.getParent().getSubTreeNode() !== env.getSubTreeNode()) {
				return undefined
			}
			const currentNode = args.node
			if (currentNode.type !== 'subtree-entity' || currentNode.entity.name !== parentNode.field.targetEntity) {
				return undefined
			}
			const inverseField = parentNode.field.inversedBy ?? parentNode.field.ownedBy
			if (!inverseField) {
				return false
			}
			return args.field === inverseField
		},
	})
}
