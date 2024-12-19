import { Input, Model, Value } from '@contember/schema'
import { Mapper } from '../Mapper'
import { UpdateBuilder } from './UpdateBuilder'
import { hasManyProcessor, hasOneProcessor } from '../MutationProcessorHelper'
import { OneHasOneInverseUpdateInputProcessor } from './relations/OneHasOneInverseUpdateInputProcessor'
import { OneHasOneOwningUpdateInputProcessor } from './relations/OneHasOneOwningUpdateInputProcessor'
import { OneHasManyUpdateInputProcessor } from './relations/OneHasManyUpdateInputProcessor'
import { ManyHasManyUpdateInputProcessor } from './relations/ManyHasManyUpdateInputProcessor'
import { UpdateInputProcessor } from '../../inputProcessing'
import { MutationResultList } from '../Result'
import { ManyHasOneUpdateInputProcessor } from './relations/ManyHasOneUpdateInputProcessor'
import { MapperInput } from '../types'

export type SqlUpdateInputProcessorResult = MutationResultList | ((ctx: { primary: Input.PrimaryValue}) => Promise<MutationResultList>)

export class SqlUpdateInputProcessor implements UpdateInputProcessor<SqlUpdateInputProcessorResult> {
	private oneHasOneInverseUpdateInputProcessor: OneHasOneInverseUpdateInputProcessor
	private oneHasOneOwningUpdateInputProcessor: OneHasOneOwningUpdateInputProcessor
	private oneHasManyUpdateInputProcessor: OneHasManyUpdateInputProcessor
	private manyHasOneUpdateInputProcessor: ManyHasOneUpdateInputProcessor
	private manyHasManyUpdateInputProcessor: ManyHasManyUpdateInputProcessor

	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly data: MapperInput.UpdateDataInput,
		private readonly updateBuilder: UpdateBuilder,
		private readonly mapper: Mapper,
	) {
		this.oneHasOneInverseUpdateInputProcessor = new OneHasOneInverseUpdateInputProcessor(this.primaryValue, this.mapper)
		this.oneHasOneOwningUpdateInputProcessor = new OneHasOneOwningUpdateInputProcessor(this.primaryValue, this.mapper, this.updateBuilder)
		this.oneHasManyUpdateInputProcessor = new OneHasManyUpdateInputProcessor(this.mapper)
		this.manyHasOneUpdateInputProcessor = new ManyHasOneUpdateInputProcessor(this.mapper, this.updateBuilder, this.primaryValue)
		this.manyHasManyUpdateInputProcessor = new ManyHasManyUpdateInputProcessor(this.mapper)
	}

	public column({ entity, column }: Model.ColumnContext) {
		if (this.data[column.name] !== undefined) {
			this.updateBuilder.addFieldValue(column.name, this.data[column.name] as Value.AtomicValue)
		}
		return Promise.resolve([])
	}

	manyHasManyInverse: UpdateInputProcessor<SqlUpdateInputProcessorResult>['manyHasManyInverse'] = {
		connect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connect(ctx)),
		create: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.update(ctx)),
		upsert: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.upsert(ctx)),
		delete: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.delete(ctx)),
		disconnect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.disconnect(ctx)),
	}

	manyHasManyOwning: UpdateInputProcessor<SqlUpdateInputProcessorResult>['manyHasManyOwning'] = {
		connect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connect(ctx)),
		create: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.update(ctx)),
		upsert: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.upsert(ctx)),
		delete: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.delete(ctx)),
		disconnect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.disconnect(ctx)),
	}

	manyHasOne: UpdateInputProcessor<SqlUpdateInputProcessorResult>['manyHasOne'] = {
		connect: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.update(ctx)),
		upsert: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.upsert(ctx)),
		delete: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.delete(ctx)),
		disconnect: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.disconnect(ctx)),
	}

	oneHasMany: UpdateInputProcessor<SqlUpdateInputProcessorResult>['oneHasMany'] = {
		connect: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.connect(ctx)),
		create: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.update(ctx)),
		upsert: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.upsert(ctx)),
		delete: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.delete(ctx)),
		disconnect: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.disconnect(ctx)),
	}

	oneHasOneInverse: UpdateInputProcessor<SqlUpdateInputProcessorResult>['oneHasOneInverse'] = {
		connect: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.update(ctx)),
		upsert: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.upsert(ctx)),
		delete: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.delete(ctx)),
		disconnect: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.disconnect(ctx)),
	}

	oneHasOneOwning: UpdateInputProcessor<SqlUpdateInputProcessorResult>['oneHasOneOwning'] = {
		connect: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.update(ctx)),
		upsert: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.upsert(ctx)),
		delete: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.delete(ctx)),
		disconnect: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.disconnect(ctx)),
	}
}
