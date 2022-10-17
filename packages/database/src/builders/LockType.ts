export enum LockType {
	forUpdate = 'for update',
	forNoKeyUpdate = 'for no key update',
	forShare = 'for share',
	forKeyShare = 'for key share',
}

export enum LockModifier {
	nowait = 'nowait',
	skipLocked = 'skip locked',
}
