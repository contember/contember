import { afterEach, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { Environment, Filter, QualifiedEntityList } from '@contember/react-binding'
import { useEffect } from 'react'
import { DataViewFilteringMethodsContext, DataViewFilteringStateContext } from '../src/contexts.js'
import { createDateFilter, DateRangeFilterArtifacts } from '../src/filterTypes/date.js'
import { useDataViewDateFilterInput } from '../src/hooks/filters/date/useDataViewEnumFilterInput.js'
import { useDataViewFiltering } from '../src/internal/hooks/useDataViewFiltering.js'

afterEach(cleanup)

const resolveCondition = (artifact: DateRangeFilterArtifacts) => createDateFilter('createdAt')(artifact, { environment: Environment.create() })

// Before 1891 Prague used local mean time, +00:57:44. Browsers report that offset as fractional or truncated minutes.
const resolveConditionInPrague = (artifact: DateRangeFilterArtifacts): unknown => {
	const result = Bun.spawnSync([
		process.execPath,
		'--conditions=typescript',
		`${import.meta.dir}/fixtures/resolveDateCondition.ts`,
		JSON.stringify(artifact),
	], {
		env: { ...process.env, TZ: 'Europe/Prague' },
	})
	if (!result.success) {
		throw new Error(result.stderr.toString())
	}
	return JSON.parse(result.stdout.toString())
}

test('serializes a date in a regular offset', () => {
	expect(resolveConditionInPrague({ start: '2020-10-30', end: '2020-10-31' })).toEqual({
		createdAt: { and: [{ or: [{ gte: '2020-10-30T00:00:00+01:00', lt: '2020-11-01T00:00:00+01:00' }] }] },
	})
})

test('serializes a historical local mean time offset with whole seconds', () => {
	expect(resolveConditionInPrague({ start: '1890-06-15' })).toEqual({
		createdAt: { and: [{ or: [{ gte: '1890-06-15T00:00:00+00:57:44' }] }] },
	})
})

test('serializes the end of the last four-digit year', () => {
	expect(resolveConditionInPrague({ end: '9999-12-31' })).toEqual({
		createdAt: { and: [{ or: [{ lt: '10000-01-01T00:00:00+01:00' }] }] },
	})
})

test('ignores a bound outside years 1000 to 9999', () => {
	expect(resolveCondition({ start: '0202-10-30', end: '2020-10-30' })).toEqual(resolveCondition({ end: '2020-10-30' }))
	expect(resolveCondition({ start: '20201-10-30', nullCondition: true })).toEqual({
		createdAt: { and: [{ or: [{ isNull: true }] }] },
	})
})

const entities: QualifiedEntityList = {
	entityName: 'Post',
	hasOneRelationPath: [],
	orderBy: undefined,
	offset: undefined,
	limit: undefined,
	filter: undefined,
	alias: undefined,
	expectedMutation: 'anyMutation',
	initialEntityCount: 0,
	isCreating: false,
	isNonbearing: false,
	setOnCreate: undefined,
	eventListeners: undefined,
	childEventListeners: undefined,
}
const filterTypes = { date: createDateFilter('createdAt') }

const DateFilterInput = ({ onFilter }: { onFilter: (filter: Filter<never>) => void }) => {
	const { state, methods } = useDataViewFiltering({ entities, filterTypes, resetPage: () => {} })
	useEffect(() => {
		onFilter(state.filter)
	}, [onFilter, state.filter])
	return (
		<DataViewFilteringStateContext.Provider value={state}>
			<DataViewFilteringMethodsContext.Provider value={methods}>
				<Input />
			</DataViewFilteringMethodsContext.Provider>
		</DataViewFilteringStateContext.Provider>
	)
}

const Input = () => <input data-testid="input" {...useDataViewDateFilterInput({ name: 'date', type: 'start' })} />

const renderInput = () => {
	const filters: unknown[] = []
	const { getByTestId } = render(<DateFilterInput onFilter={it => filters.push(it)} />)
	const input = getByTestId('input')
	if (!(input instanceof HTMLInputElement)) {
		throw new Error('expected an input element')
	}
	const type = (value: string) =>
		act(() => {
			fireEvent.change(input, { target: { value } })
		})
	return { filters, input, type }
}

test('does not change the filter while a year is partially typed', () => {
	const { filters, input, type } = renderInput()

	for (const value of ['0002-10-30', '0020-10-30', '0202-10-30']) {
		type(value)
		expect(input.value).toBe(value)
	}
	expect(filters).toEqual([{ and: [{}] }])

	type('2020-10-30')
	expect(filters.at(-1)).toEqual({ and: [resolveCondition({ start: '2020-10-30' }), {}] })

	type('')
	expect(filters.at(-1)).toEqual({ and: [{}] })
	expect(input.value).toBe('')
})

test('reverts a partially typed year to the filtered date on blur', () => {
	const { filters, input, type } = renderInput()

	type('2020-10-30')
	type('0002-10-30')
	act(() => {
		fireEvent.blur(input)
	})
	expect(input.value).toBe('2020-10-30')
	expect(filters.at(-1)).toEqual({ and: [resolveCondition({ start: '2020-10-30' }), {}] })

	type('')
	type('0002-10-30')
	act(() => {
		fireEvent.blur(input)
	})
	expect(input.value).toBe('')
})
