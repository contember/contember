export const MIN_PASSWORD_LENGTH = 6
export const isWeakPassword = (password: string) => password.length < MIN_PASSWORD_LENGTH
