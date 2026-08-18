import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { GraphQlClientError } from '@contember/graphql-client'
import { TenantForm } from '../src/components/forms/TenantForm.js'
import { useForm } from '../src/contexts.js'
import { FormContextValue } from '../src/types/forms.js'

type ProbeFormContextValue = FormContextValue<{ value: string }, 'SOME_ERROR'>

const request = { url: '/tenant', query: '', variables: {} }

const forbiddenError = new GraphQlClientError('Forbidden', 'response errors', request, undefined, [
	{ message: 'You are not allowed to set project secrets', extensions: { code: 'ForbiddenError' } },
])

const ErrorProbe = () => {
	const form = useForm()
	return <span>{form.errors.map(it => it.code).join(',')}</span>
}

const renderProbe = (execute: () => Promise<never>) => {
	const result = render(
		<TenantForm<ProbeFormContextValue> initialValues={{ value: '' }} execute={execute}>
			<form>
				<ErrorProbe />
				<button type="submit">submit</button>
			</form>
		</TenantForm>,
	)
	return result
}

// Unmount between the cases: without it the second render leaves two forms in the document and
// getByText('submit') fails on the duplicate. Auto-cleanup only kicks in when the testing library
// sees a global afterEach, which it doesn't reliably do here.
afterEach(cleanup)

describe('TenantForm error codes', () => {
	it('reports a denied mutation as FORBIDDEN', async () => {
		const { getByText, findByText } = renderProbe(async () => {
			throw forbiddenError
		})
		fireEvent.click(getByText('submit'))
		expect(await findByText('FORBIDDEN')).toBeTruthy()
	})

	it('reports a genuine failure as UNKNOWN_ERROR', async () => {
		const { getByText, findByText } = renderProbe(async () => {
			throw new GraphQlClientError('Boom', 'server error', request)
		})
		fireEvent.click(getByText('submit'))
		expect(await findByText('UNKNOWN_ERROR')).toBeTruthy()
	})
})
