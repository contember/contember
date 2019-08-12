class ImplementationException {
	constructor(public readonly message: string = '') {}
}

namespace ImplementationException {
	export const Throw = (message: string = '') => {
		throw new ImplementationException(message)
	}
}

export { ImplementationException }
