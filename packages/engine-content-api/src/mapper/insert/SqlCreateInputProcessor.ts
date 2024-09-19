import { Input, Model, Value } from '@contember/schema'
import { Mapper } from '../Mapper'
import { InsertBuilder } from './InsertBuilder'
import { Providers, resolveColumnValue } from '@contember/schema-utils'
import { CreateInputProcessor } from '../../inputProcessing'
import { MutationResultList } from '../Result'
import { hasManyProcessor, hasOneProcessor } from '../MutationProcessorHelper'
import { OneHasOneInverseCreateInputProcessor } from './relations/OneHasOneInverseCreateInputProcessor'
import { OneHasOneOwningCreateInputProcessor } from './relations/OneHasOneOwningCreateInputProcessor'
import { OneHasManyCreateInputProcessor } from './relations/OneHasManyCreateInputProcessor'
import { ManyHasOneCreateInputProcessor } from './relations/ManyHasOneCreateInputProcessor'
import { ManyHasManyCreateInputProcessor } from './relations/ManyHasManyCreateInputProcessor'


export type SqlCreateInputProcessorResult = MutationResultList | ((ctx: { primary: Input.PrimaryValue }) => Promise<MutationResultList>)
export class SqlCreateInputProcessor implements CreateInputProcessor<SqlCreateInputProcessorResult> {

	private oneHasOneInverseCreateInputProcessor:  OneHasOneInverseCreateInputProcessor
	private oneHasOneOwningCreateInputProcessor:  OneHasOneOwningCreateInputProcessor
	private oneHasManyCreateInputProcessor:  OneHasManyCreateInputProcessor
	private manyHasOneCreateInputProcessor: ManyHasOneCreateInputProcessor
	private manyHasManyCreateInputProcessor: ManyHasManyCreateInputProcessor

	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
		private readonly providers: Providers,
	) {
		this.oneHasOneInverseCreateInputProcessor = new OneHasOneInverseCreateInputProcessor(this.mapper)
		this.oneHasOneOwningCreateInputProcessor = new OneHasOneOwningCreateInputProcessor(this.mapper, this.insertBuilder)
		this.oneHasManyCreateInputProcessor = new OneHasManyCreateInputProcessor(this.mapper)
		this.manyHasOneCreateInputProcessor = new ManyHasOneCreateInputProcessor(this.mapper, this.insertBuilder)
		this.manyHasManyCreateInputProcessor = new ManyHasManyCreateInputProcessor(this.mapper)
	}

	public async column(context: Model.ColumnContext & { input: Input.ColumnValue | undefined }): Promise<SqlCreateInputProcessorResult> {
		this.insertBuilder.addFieldValue(
			context.column.name,
			((): Value.GenericValueLike<Value.AtomicValue | undefined> => {
				return resolveColumnValue(context, this.providers)
			})(),
		)
		return []
	}

	manyHasManyInverse: CreateInputProcessor<SqlCreateInputProcessorResult>['manyHasManyInverse'] = {
		connect: hasManyProcessor(ctx => this.manyHasManyCreateInputProcessor.connect(ctx)),
		create: hasManyProcessor(ctx => this.manyHasManyCreateInputProcessor.create(ctx)),
		connectOrCreate: hasManyProcessor(ctx => this.manyHasManyCreateInputProcessor.connectOrCreate(ctx)),
	}

	manyHasManyOwning: CreateInputProcessor<SqlCreateInputProcessorResult>['manyHasManyOwning'] = {
		connect: hasManyProcessor(ctx => this.manyHasManyCreateInputProcessor.connect(ctx)),
		create: hasManyProcessor(ctx => this.manyHasManyCreateInputProcessor.create(ctx)),
		connectOrCreate: hasManyProcessor(ctx => this.manyHasManyCreateInputProcessor.connectOrCreate(ctx)),
	}

	manyHasOne: CreateInputProcessor<SqlCreateInputProcessorResult>['manyHasOne'] = {
		nothing: async ctx => {
			this.insertBuilder.addFieldValue(ctx.relation.name, null)
			return []
		},
		connect: hasOneProcessor(ctx => this.manyHasOneCreateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.manyHasOneCreateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.manyHasOneCreateInputProcessor.connectOrCreate(ctx)),
	}

	oneHasMany: CreateInputProcessor<SqlCreateInputProcessorResult>['oneHasMany'] = {
		connect: hasManyProcessor(ctx => this.oneHasManyCreateInputProcessor.connect(ctx)),
		create: hasManyProcessor(ctx => this.oneHasManyCreateInputProcessor.create(ctx)),
		connectOrCreate: hasManyProcessor(ctx => this.oneHasManyCreateInputProcessor.connectOrCreate(ctx)),
	}


	oneHasOneOwning: CreateInputProcessor<SqlCreateInputProcessorResult>['oneHasOneOwning'] = {
		nothing: async ctx => {
			this.insertBuilder.addFieldValue(ctx.relation.name, null)
			return []
		},
		connect: hasOneProcessor(ctx => this.oneHasOneOwningCreateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneOwningCreateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneOwningCreateInputProcessor.connectOrCreate(ctx)),
	}

	oneHasOneInverse: CreateInputProcessor<SqlCreateInputProcessorResult>['oneHasOneInverse'] = {
		connect: hasOneProcessor(ctx => this.oneHasOneInverseCreateInputProcessor.connect(ctx)),
		create: hasOneProcessor(ctx => this.oneHasOneInverseCreateInputProcessor.create(ctx)),
		connectOrCreate: hasOneProcessor(ctx => this.oneHasOneInverseCreateInputProcessor.connectOrCreate(ctx)),
	}
}
