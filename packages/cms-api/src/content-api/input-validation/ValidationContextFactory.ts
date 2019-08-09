import DependencyCollector from './DependencyCollector'
import CreateInputVisitor from '../inputProcessing/CreateInputVisitor'
import { acceptFieldVisitor } from '../../content-schema/modelUtils'
import UpdateInputVisitor from '../inputProcessing/UpdateInputVisitor'
import { Input, Model, Value } from '@contember/schema'
import ValidationDataSelector from './ValidationDataSelector'
import CreateInputContextFactoryProcessor from './CreateInputContextFactoryProcessor'
import UpdateInputContextFactoryProcessor from './UpdateInputContextFactoryProcessor'
import ValidationContext from './ValidationContext'
import DependencyPruner from './DependencyPruner'

export default class ValidationContextFactory {
	constructor(
		private readonly model: Model.Schema,
		private readonly dataSelector: ValidationDataSelector,
		private readonly dependencyPruner: DependencyPruner,
	) {}

	public async createForCreate(
		entity: Model.Entity,
		data: Input.CreateDataInput,
		dependencies: DependencyCollector.Dependencies,
	): Promise<ValidationContext.NodeType> {
		const contextFactoryProcessor = new CreateInputContextFactoryProcessor(this, dependencies, this.dataSelector)
		const visitor = new CreateInputVisitor(contextFactoryProcessor, this.model, data)

		const results = await Promise.all(
			Object.keys(dependencies).map(async field => {
				return [field, await acceptFieldVisitor(this.model, entity, field, visitor)]
			}),
		)

		return results.reduce((acc, [field, value]) => ({ ...acc, [field]: value }), {})
	}

	public async createForUpdate(
		entity: Model.Entity,
		input: { node: Value.Object } | { where: Input.UniqueWhere },
		data: Input.UpdateDataInput,
		dependencies: DependencyCollector.Dependencies,
	): Promise<ValidationContext.NodeType | undefined> {
		// const prunedDependencies = this.dependencyPruner.pruneDependencies(entity, dependencies, data)
		const prunedDependencies = dependencies
		const node = 'where' in input ? await this.dataSelector.select(entity, input.where, prunedDependencies) : input.node
		if (!node) {
			return undefined
		}

		const contextFactoryProcessor = new UpdateInputContextFactoryProcessor(node, this, dependencies, this.dataSelector)
		const visitor = new UpdateInputVisitor(contextFactoryProcessor, this.model, data)
		await Promise.all(
			Object.keys(dependencies).map(async field => {
				return await acceptFieldVisitor<void>(this.model, entity, field, visitor)
			}),
		)

		return node
	}
}
