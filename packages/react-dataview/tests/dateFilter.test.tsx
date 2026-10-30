import { afterAll, afterEach, beforeAll, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { Environment, Filter, QualifiedEntityList } from '@contember/react-binding'
import { useEffect } from 'react'
import { DataViewFilteringMethodsContext, DataViewFilteringStateContext } from '../src/contexts.js'
import { createDateFilter, DateRangeFilterArtifacts } from '../src/filterTypes/date.js'
import { useDataViewDateFilterInput } from '../src/hooks/filters/date/useDataViewEnumFilterInput.js'
import { useDataViewFiltering } from '../src/internal/hooks/useDataViewFiltering.js'

const originalTz = process.env.TZ
beforeAll(() => {
	// Before 1891 Prague used local mean time, +00:57:44
	process.env.TZ = 'Europe/Prague'
})
afterAll(() => {
	process.env.TZ = originalTz
})
afterEach(cleanup)

const resolveCondition = (artifact: DateRangeFilterArtifacts) => createDateFilter('createdAt')(artifact, { environment: Environment.create() })

test('serializes a date in a regular offset', () => {
	expect(resolveCondition({ start: '2020-10-30', end: '2020-10-31' })).toEqual({
		createdAt: { and: [{ or: [{ gte: '2020-10-30T00:00:00+01:00', lt: '2020-11-01T00:00:00+01:00' }] }] },
	})
})

test('serializes a historical local mean time offset with whole seconds', () => {
	const condition = resolveCondition({ start: '0020-10-30' })
	expect(condition).toEqual({ createdAt: { and: [{ or: [{ gte: '0020-10-30T00:00:00+00:57:44', lt: undefined }] }] } })
	// the same instant the serialized offset describes: 00:00:00 minus 00:57:44
	expect(new Date('0020-10-30T00:00:00').toISOString()).toBe('0020-10-29T23:02:16.000Z')
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

test('does not change the filter while a year is partially typed', () => {
	const filters: Filter<never>[] = []
	const { getByTestId } = render(<DateFilterInput onFilter={it => filters.push(it)} />)
	const input = getByTestId('input') as HTMLInputElement
	const type = (value: string) =>
		act(() => {
			fireEvent.change(input, { target: { value } })
		})

	for (const value of ['0002-10-30', '0020-10-30', '0202-10-30']) {
		type(value)
		expect(input.value).toBe(value)
	}
	expect(filters).toEqual([{ and: [{}] }])

	type('2020-10-30')
	expect(filters.at(-1)).toEqual({ and: [{ createdAt: { and: [{ or: [{ gte: '2020-10-30T00:00:00+01:00', lt: undefined }] }] } }, {}] })

	type('')
	expect(filters.at(-1)).toEqual({ and: [{}] })
	expect(input.value).toBe('')
})
