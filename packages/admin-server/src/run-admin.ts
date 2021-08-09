#!/usr/bin/env node
import dic from './dic'

dic.httpServer.listen(dic.env.CONTEMBER_PORT)
