export const maskToken = (token: string) => token.replace(/^(\w{3}).+(\w{3})$/, '$1***$2')
