import { describe, it, expect } from 'vitest'
import { COUNT_NEW_TESTS, MATCH_FAILURE_TYPE } from './shared'
import { EDIT } from './operations/edit'
import { OVERWRITE } from './operations/overwrite'

describe('shared prompt constants', () => {
  it('COUNT_NEW_TESTS is embedded in EDIT', () => {
    expect(EDIT).toContain(COUNT_NEW_TESTS)
  })

  it('COUNT_NEW_TESTS is embedded in OVERWRITE', () => {
    expect(OVERWRITE).toContain(COUNT_NEW_TESTS)
  })

  it('MATCH_FAILURE_TYPE is embedded in EDIT', () => {
    expect(EDIT).toContain(MATCH_FAILURE_TYPE)
  })

  it('MATCH_FAILURE_TYPE is embedded in OVERWRITE', () => {
    expect(OVERWRITE).toContain(MATCH_FAILURE_TYPE)
  })
})
