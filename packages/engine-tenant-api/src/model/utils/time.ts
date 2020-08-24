const SECOND = 1000
const MINUTE = SECOND * 60

export const plusMinutes = (now: Date, mins: number) => new Date(now.getTime() + mins * MINUTE)
