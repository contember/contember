import { Input, Value } from '@contember/schema'
import { Mapper } from '../Mapper'
import { UpdateBuilder } from './UpdateBuilder'
import * as Context from '../../inputProcessing'
import { UpdateInputProcessor } from '../../inputProcessing'
import { MutationResultList } from '../Result'
import { hasManyProcessor, hasOneProcessor } from '../MutationProcessorHelper'
import { OneHasOneInverseUpdateInputProcessor } from '../relations/OneHasOneInverseUpdateInputProcessor'
import { OneHasOneOwningUpdateInputProcessor } from '../relations/OneHasOneOwningUpdateInputProcessor'
import { OneHasManyInputProcessor } from '../relations/OneHasManyInputProcessor'
import { ManyHasOneInputProcessor } from '../relations/ManyHasOneInputProcessor'
import { ManyHasManyInputProcessor } from '../relations/ManyHasManyInputProcessor'

export class SqlUpdateInputProcessor implements UpdateInputProcessor<MutationResultList> {
	private oneHasOneInverseUpdateInputProcessor = new OneHasOneInverseUpdateInputProcessor(this.primaryValue, this.mapper)
	private oneHasOneOwningUpdateInputProcessor = new OneHasOneOwningUpdateInputProcessor(this.primaryValue, this.mapper, this.updateBuilder)
	private oneHasManyUpdateInputProcessor = new OneHasManyInputProcessor(this.mapper)
	private manyHasOneUpdateInputProcessor = new ManyHasOneInputProcessor(this.mapper)
	private manyHasManyUpdateInputProcessor = new ManyHasManyInputProcessor(this.mapper)

	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly data: Input.UpdateDataInput,
		private readonly updateBuilder: UpdateBuilder,
		private readonly mapper: Mapper,
	) {}

	public column({ entity, column }: Context.ColumnContext) {
		if (this.data[column.name] !== undefined) {
			this.updateBuilder.addFieldValue(column.name, this.data[column.name] as Value.AtomicValue)
		}
		return Promise.resolve([])
	}

	manyHasManyInverse: UpdateInputProcessor<MutationResultList>['manyHasManyInverse'] = {
		connect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connect(ctx, this.primaryValue)),
		create: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.create(ctx, this.primaryValue)),
		connectOrCreate: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connectOrCreate(ctx, this.primaryValue)),
		update: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.update(ctx, this.primaryValue)),
		upsert: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.upsert(ctx, this.primaryValue)),
		delete: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.delete(ctx, this.primaryValue)),
		disconnect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.disconnect(ctx, this.primaryValue)),
	}

	manyHasManyOwning: UpdateInputProcessor<MutationResultList>['manyHasManyOwning'] = {
		connect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connect(ctx, this.primaryValue)),
		create: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.create(ctx, this.primaryValue)),
		connectOrCreate: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.connectOrCreate(ctx, this.primaryValue)),
		update: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.update(ctx, this.primaryValue)),
		upsert: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.upsert(ctx, this.primaryValue)),
		delete: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.delete(ctx, this.primaryValue)),
		disconnect: hasManyProcessor(ctx => this.manyHasManyUpdateInputProcessor.disconnect(ctx, this.primaryValue)),
	}

	manyHasOne: UpdateInputProcessor<MutationResultList>['manyHasOne'] = {
		connect: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.connect(ctx, this.updateBuilder)),
		create: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.create(ctx, this.updateBuilder)),
		connectOrCreate: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.connectOrCreate(ctx, this.updateBuilder)),
		update: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.update(ctx, this.primaryValue)),
		upsert: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.upsert(ctx, this.updateBuilder, this.primaryValue)),
		delete: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.delete(ctx, this.updateBuilder, this.primaryValue)),
		disconnect: hasOneProcessor(ctx => this.manyHasOneUpdateInputProcessor.disconnect(ctx, this.updateBuilder)),
	}

	oneHasMany: UpdateInputProcessor<MutationResultList>['oneHasMany'] = {
		connect: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.connect(ctx, this.primaryValue)),
		create: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.create(ctx, this.primaryValue)),
		connectOrCreate: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.connectOrCreate(ctx, this.primaryValue)),
		update: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.update(ctx, this.primaryValue)),
		upsert: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.upsert(ctx, this.primaryValue)),
		delete: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.delete(ctx, this.primaryValue)),
		disconnect: hasManyProcessor(ctx => this.oneHasManyUpdateInputProcessor.disconnect(ctx, this.primaryValue)),
	}

	oneHasOneInverse: UpdateInputProcessor<MutationResultList>['oneHasOneInverse'] = {
		connect: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.update(ctx)),
		upsert: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.upsert(ctx)),
		delete: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.delete(ctx)),
		disconnect: hasOneProcessor(ctx => this.oneHasOneInverseUpdateInputProcessor.disconnect(ctx)),
	}

	oneHasOneOwning: UpdateInputProcessor<MutationResultList>['oneHasOneOwning'] = {
		connect: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.connectOrCreate(ctx)),
		update: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.update(ctx)),
		upsert: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.upsert(ctx)),
		delete: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.delete(ctx)),
		disconnect: hasOneProcessor(ctx => this.oneHasOneOwningUpdateInputProcessor.disconnect(ctx)),
	}
}
