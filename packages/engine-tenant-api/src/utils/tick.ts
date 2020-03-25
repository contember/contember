export const waitForTick = () => new Promise(resolve => process.nextTick(resolve))
