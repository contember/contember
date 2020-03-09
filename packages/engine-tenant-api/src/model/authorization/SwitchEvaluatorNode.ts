import { AccessEvaluator, AccessNode, Authorizator } from '@contember/authorization'

export class SwitchEvaluatorNode implements AccessNode {
	constructor(private readonly node: AccessNode, private readonly evaluator: AccessEvaluator) {}

	async isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
		const result = await this.evaluator.evaluate(this.node, action)
		return result
	}
}
