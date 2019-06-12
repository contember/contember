import sinon from 'sinon'
import * as date from '../../src/utils/date'

export const withMockedDate = async <R>(cb: () => R | Promise<R>): Promise<R> => {
	const nowStub = sinon.stub(date, 'now').callsFake(() => new Date('2018-10-12T08:00:00.000Z'))
	try {
		return await cb()
	} finally {
		nowStub.restore()
	}
}
