import AccessEvaluator from './AccessEvaluator'
import Authorizator from './Authorizator'

interface AccessNode {
	isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean>
}

namespace AccessNode {
	interface Composite extends AccessNode {
		getNodes(): AccessNode[]
	}

	export class Fixed implements AccessNode {
		constructor(private readonly result: boolean) {}

		public static allowed(): Fixed {
			return new Fixed(true)
		}

		public static denied(): Fixed {
			return new Fixed(false)
		}

		public isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
			return Promise.resolve(this.result)
		}
	}

	export class Intersection implements Composite {
		constructor(private readonly nodes: AccessNode[]) {}

		public async isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
			if (this.nodes.length === 0) {
				return Promise.resolve(false)
			}
			for (let node of this.nodes) {
				if (!(await node.isAllowed(accessEvaluator, action))) {
					return Promise.resolve(false)
				}
			}
			return Promise.resolve(true)
		}

		public getNodes(): AccessNode[] {
			return this.nodes
		}
	}

	export class Union implements Composite {
		constructor(private readonly nodes: AccessNode[]) {}

		public async isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
			for (let node of this.nodes) {
				if (await node.isAllowed(accessEvaluator, action)) {
					return Promise.resolve(true)
				}
			}
			return Promise.resolve(false)
		}

		public getNodes(): AccessNode[] {
			return this.nodes
		}
	}

	export class Negate implements AccessNode {
		constructor(private readonly node: AccessNode) {}

		async isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
			return !(await this.node.isAllowed(accessEvaluator, action))
		}
	}

	export class Roles implements AccessNode {
		constructor(public readonly roles: string[]) {}

		isAllowed(accessEvaluator: AccessEvaluator, action: Authorizator.Action): Promise<boolean> {
			return accessEvaluator.evaluate(this, action)
		}
	}
}

export default AccessNode
