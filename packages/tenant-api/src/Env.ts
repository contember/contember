export default class Env {
  constructor(
    public readonly DB_HOST: string,
    public readonly DB_PORT: string,
    public readonly DB_USER: string,
    public readonly DB_PASSWORD: string,
    public readonly DB_DATABASE: string,
  ) {}

  static fromUnsafe(unsafe: any): Env {
    const getString = (key: keyof Env): string => {
      if (typeof unsafe[key] !== 'string') {
        throw new Error(`Missing required environment variable ${key}`);
      }
      return unsafe[key]
    }

    return new Env(
      getString('DB_HOST'),
      getString('DB_PORT'),
      getString('DB_USER'),
      getString('DB_PASSWORD'),
      getString('DB_DATABASE'),
    )
  }
}
