import { Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper.js'
import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { getInsertPrimary, MutationResultList, prependPath } from '../../Result.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor.js'
import { ImplementationException } from '../../../exception.js'

type HasManyContext =
	| Model.OneHasManyContext
	| Model.ManyHasManyOwningContext
	| Model.ManyHasManyInverseContext

/**
 * The subset of {@link UpdateInputProcessor.HasManyRelationInputProcessor} methods reused by `set`.
 * Each method returns either a result list or a thunk that finalizes once the owner primary is known.
 */
interface SetCapableProcessor<Context> {
	connect(context: Context & { input: Input.UniqueWhere | CheckedPrimary; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	create(context: Context & { input: MapperInput.CreateDataInput; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput; index: number; alias?: string },
	): Promise<SqlUpdateInputProcessorResult>
	update(context: Context & { input: UpdateInputProcessor.UpdateManyInput; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	upsert(context: Context & { input: UpdateInputProcessor.UpsertManyInput; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	disconnect(context: Context & { input: Input.UniqueWhere; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	delete(context: Context & { input: Input.UniqueWhere; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
}

const runStep = async (result: SqlUpdateInputProcessorResult, primary: Input.PrimaryValue): Promise<MutationResultList> => {
	return typeof result === 'function' ? await result({ primary }) : await result
}

/**
 * Implements the declarative `set` operation for has-many relations.
 *
 * The resulting collection consists exactly of the entities described by `items`. The desired
 * members are connected/created/updated first, then any entity that was a member before the
 * operation but is not in the desired set is removed according to `orphanStrategy`
 * (`disconnect` by default, or `delete`).
 *
 * Orphan removal runs *after* the desired members are established so that entities both in the
 * current and the desired set are never transiently removed.
 */
export const processSetManyRelationInput = async <Context extends HasManyContext>(
	mapper: Mapper,
	context: Context,
	ownerPrimary: Input.PrimaryValue,
	processor: SetCapableProcessor<Context>,
	input: UpdateInputProcessor.SetManyInput,
): Promise<MutationResultList> => {
	const { targetEntity } = context
	const results: MutationResultList = []
	const desiredPrimaries = new Set<string>()

	const markDesired = (primary: Input.PrimaryValue | undefined) => {
		if (primary !== undefined && primary !== null) {
			desiredPrimaries.add(String(primary))
		}
	}

	// An orphan is a member from *before* the operation that the input does not mention, so the
	// snapshot must be taken up front. Reading it afterwards would classify rows created by this
	// very input as orphans whenever their primary cannot be recovered from the step result -
	// e.g. manyHasMany `connectOrCreate`, which returns junction results only.
	const currentPrimaries = await mapper.fetchHasManyPrimaries(context, ownerPrimary)

	let index = 0
	for (const item of input.items) {
		const alias = item.alias
		const path = [{ index, alias }]
		let stepResult: MutationResultList
		if ('connect' in item) {
			const [primary, err] = await mapper.getPrimaryValue(targetEntity, item.connect)
			if (err) {
				return [...results, ...prependPath(path, [err])]
			}
			markDesired(primary)
			stepResult = await runStep(await processor.connect({ ...context, input: new CheckedPrimary(primary), index, alias }), ownerPrimary)
		} else if ('create' in item) {
			stepResult = await runStep(await processor.create({ ...context, input: item.create, index, alias }), ownerPrimary)
			markDesired(getInsertPrimary(stepResult))
		} else if ('connectOrCreate' in item) {
			const [existing] = await mapper.getPrimaryValue(targetEntity, item.connectOrCreate.connect)
			stepResult = await runStep(await processor.connectOrCreate({ ...context, input: item.connectOrCreate, index, alias }), ownerPrimary)
			markDesired(getInsertPrimary(stepResult) ?? existing)
		} else if ('update' in item) {
			const [primary, err] = await mapper.getPrimaryValue(targetEntity, item.update.by)
			if (err) {
				return [...results, ...prependPath(path, [err])]
			}
			markDesired(primary)
			stepResult = await runStep(
				await processor.update({ ...context, input: { where: item.update.by, data: item.update.data }, index, alias }),
				ownerPrimary,
			)
		} else if ('upsert' in item) {
			const [existing] = await mapper.getPrimaryValue(targetEntity, item.upsert.by)
			stepResult = await runStep(
				await processor.upsert({
					...context,
					input: { where: item.upsert.by, update: item.upsert.update, create: item.upsert.create },
					index,
					alias,
				}),
				ownerPrimary,
			)
			// An upsert whose `by` matches a non-member falls back to an insert, so the inserted primary wins.
			markDesired(getInsertPrimary(stepResult) ?? existing)
		} else {
			throw new ImplementationException('Unknown "set" item operation; the input visitor should have rejected it.')
		}
		results.push(...prependPath(path, stepResult))
		if (stepResult.some(it => it.error)) {
			return results
		}
		index++
	}

	for (const current of currentPrimaries) {
		if (desiredPrimaries.has(String(current))) {
			continue
		}
		const where: Input.UniqueWhere = { [targetEntity.primary]: current }
		const orphanResult = input.orphanStrategy === Input.OrphanRemovalStrategy.delete
			? await runStep(await processor.delete({ ...context, input: where, index, alias: undefined }), ownerPrimary)
			: await runStep(await processor.disconnect({ ...context, input: where, index, alias: undefined }), ownerPrimary)
		results.push(...orphanResult)
		if (orphanResult.some(it => it.error)) {
			return results
		}
	}

	return results
}
