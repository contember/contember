import sinon from 'sinon'
import * as uuid from '../../src/utils/uuid'
import * as tenant from '@contember/engine-tenant-api'

export const testUuidPrefix = '123e4567-e89b-12d3-a456-'
export const testUuid = (number: number) => {
	return testUuidPrefix + number.toString().padStart(12, '0')
}

export const withMockedUuid = async <R>(cb: () => R | Promise<R>): Promise<R> => {
	let id = 1
	const uuidStub = sinon.stub(uuid, 'uuid').callsFake(() => testUuid(id++))
	const uuidStub2 = sinon.stub(tenant, 'uuid').callsFake(() => testUuid(id++))
	try {
		return await cb()
	} finally {
		uuidStub.restore()
		uuidStub2.restore()
	}
}
