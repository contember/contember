import { getJestConfig } from './../../build/getJestConfig.js'

export default {...getJestConfig(), testEnvironment: 'jsdom'}
