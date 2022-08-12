import { Value } from '@contember/schema'
import { Mapper } from '../Mapper'
import { InsertBuilder } from './InsertBuilder'
import { Providers, resolveColumnValue } from '@contember/schema-utils'
import * as Context from '../../inputProcessing'
import { CreateInputProcessor } from '../../inputProcessing'
import { MutationResultList } from '../Result'
import { hasManyProcessor, hasOneProcessor } from '../MutationProcessorHelper'
import { OneHasOneInverseCreateInputProcessor } from '../relations/OneHasOneInverseCreateInputProcessor'
import { OneHasOneOwningCreateInputProcessor } from '../relations/OneHasOneOwningCreateInputProcessor'
import { ManyHasManyInputProcessor } from '../relations/ManyHasManyInputProcessor'
import { ManyHasOneInputProcessor } from '../relations/ManyHasOneInputProcessor'
import { OneHasManyInputProcessor } from '../relations/OneHasManyInputProcessor'

export class SqlCreateInputProcessor implements CreateInputProcessor<MutationResultList> {

	private oneHasOneInverseCreateInputProcessor = new OneHasOneInverseCreateInputProcessor(this.insertBuilder, this.mapper)
	private oneHasOneOwningCreateInputProcessor = new OneHasOneOwningCreateInputProcessor(this.insertBuilder, this.mapper)
	private oneHasManyCreateInputProcessor = new OneHasManyInputProcessor(this.mapper)
	private manyHasOneCreateInputProcessor = new ManyHasOneInputProcessor(this.mapper)
	private manyHasManyCreateInputProcessor = new ManyHasManyInputProcessor(this.mapper)

	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
		private readonly providers: Providers,
	) {
	}

	public async column(context: Context.ColumnContext): Promise<MutationResultList> {
		this.insertBuilder.addFieldValue(
			context.column.name,
			((): Value.GenericValueLike<Value.AtomicValue | undefined> => {
				return resolveColumnValue(context, this.providers)
			})(),
		)
		return []
	}

	manyHasManyInverse: CreateInputProcessor<MutationResultList>['manyHasManyInverse'] = {
		connect: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.manyHasManyCreateInputProcessor.connect(ctx, primary)
		}),
		create: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.manyHasManyCreateInputProcessor.create(ctx, primary)
		}),
		connectOrCreate: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.manyHasManyCreateInputProcessor.connectOrCreate(ctx, primary)
		}),
	}

	manyHasManyOwning: CreateInputProcessor<MutationResultList>['manyHasManyOwning'] = {
		connect: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.manyHasManyCreateInputProcessor.connect(ctx, primary)
		}),
		create: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.manyHasManyCreateInputProcessor.create(ctx, primary)
		}),
		connectOrCreate: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.manyHasManyCreateInputProcessor.connectOrCreate(ctx, primary)
		}),
	}

	manyHasOne: CreateInputProcessor<MutationResultList>['manyHasOne'] = {
		nothing: async ctx => {
			this.insertBuilder.addFieldValue(ctx.relation.name, null)
			return []
		},
		connect: hasOneProcessor(ctx => this.manyHasOneCreateInputProcessor.connect(ctx, this.insertBuilder)),
		create: hasOneProcessor(ctx => this.manyHasOneCreateInputProcessor.create(ctx, this.insertBuilder)),
		connectOrCreate: hasOneProcessor(ctx => this.manyHasOneCreateInputProcessor.connectOrCreate(ctx, this.insertBuilder)),
	}

	oneHasMany: CreateInputProcessor<MutationResultList>['oneHasMany'] = {
		connect: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.oneHasManyCreateInputProcessor.connect(ctx, primary)
		}),
		create: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.oneHasManyCreateInputProcessor.create(ctx, primary)
		}),
		connectOrCreate: hasManyProcessor(async ctx => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return this.oneHasManyCreateInputProcessor.connectOrCreate(ctx, primary)
		}),
	}


	oneHasOneOwning: CreateInputProcessor<MutationResultList>['oneHasOneOwning'] = {
		nothing: async ctx => {
			this.insertBuilder.addFieldValue(ctx.relation.name, null)
			return []
		},
		connect: hasOneProcessor(ctx => this.oneHasOneOwningCreateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneOwningCreateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneOwningCreateInputProcessor.connectOrCreate(ctx)),
	}

	oneHasOneInverse: CreateInputProcessor<MutationResultList>['oneHasOneInverse'] = {
		connect: hasOneProcessor(ctx => this.oneHasOneInverseCreateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneInverseCreateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneInverseCreateInputProcessor.connectOrCreate(ctx)),
	}
}
