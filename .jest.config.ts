// @ts-ignore
import { isLernaPackage } from '@umijs/utils'
import { existsSync } from 'fs'
import { join } from 'path'
// import type { Config } from '@jest/types'

const testMatchTypes = ['spec', 'test', 'e2e']

const isLerna = isLernaPackage(process.cwd())
const hasPackage = false
const testMatchPrefix = hasPackage ? `**/packages/1/` : ''
const hasSrc = existsSync(join(process.cwd(), 'src'))

const config = {
  collectCoverageFrom: [
    'index.{js,jsx,ts,tsx}',
    hasSrc && 'src/**/*.{js,jsx,ts,tsx}',
    isLerna && 'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/typings/**',
    '!**/types/**',
    '!**/fixtures/**',
    '!**/examples/**',
    '!**/*.d.ts'
  ].filter((dict) => typeof dict === 'string') as string[],
  coveragePathIgnorePatterns: ['/node_modules/', '.umi', '.umi-production', 'demos', '__test__'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss|stylus)$': require.resolve('identity-obj-proxy')
  },
  setupFiles: [
    require.resolve('@umijs/test/helpers/setupFiles/shim'),
    require.resolve('./src/JsonSchemaEditor/__test__/setupTest')
  ],
  setupFilesAfterEnv: [require.resolve('@umijs/test/helpers/setupFiles/jasmine')],
  testEnvironment: require.resolve('jest-environment-jsdom-fourteen'),
  testMatch: [`${testMatchPrefix}**/?*.(${testMatchTypes.join('|')}).(j|t)s?(x)`],
  testPathIgnorePatterns: ['/node_modules/', '/fixtures/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': require.resolve('@umijs/test/helpers/transformers/javascript'),
    '^.+\\.(css|less|sass|scss|stylus)$': require.resolve('@umijs/test/helpers/transformers/css'),
    '^(?!.*\\.(js|jsx|ts|tsx|css|less|sass|scss|stylus|json)$)': require.resolve(
      '@umijs/test/helpers/transformers/file'
    )
  },
  verbose: true,
  transformIgnorePatterns: [
    // 加 [^/]*? 是为了兼容 tnpm 的目录结构
    // 比如：_umi-test@1.5.5@umi-test
    // `node_modules/(?!([^/]*?umi|[^/]*?umi-test)/)`,
  ],
  // 用于设置 jest worker 启动的个数
  ...(process.env.MAX_WORKERS ? { maxWorkers: Number(process.env.MAX_WORKERS) } : {})
}

console.log('cpu-pro: 已使用 .jest.config.ts 作为 jest 配置文件。')

export default config
