import {RequestHandler, Request, Response, NextFunction} from 'express'
import ApiKeyManager from '../tenant-api/model/service/ApiKeyManager'

class AuthMiddlewareFactory {
  constructor(
    private apiKeyManager: ApiKeyManager,
  ) {}

  create(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.header('Authorization')
      const authHeaderPattern = /^Bearer\s+(\w+)$/i

      if (typeof authHeader !== 'string') {
        return next()
      }

      const match = authHeader.match(authHeaderPattern)
      if (match === null) {
        return next()
      }

      const [, token] = match
      res.locals.authResult = await this.apiKeyManager.verify(token)
      next()
    }
  }
}

namespace AuthMiddlewareFactory {
  export type ResponseWithAuthResult = Response & {
    locals: {
      authResult?: ApiKeyManager.VerifyResult
    }
  }
}

export default AuthMiddlewareFactory
