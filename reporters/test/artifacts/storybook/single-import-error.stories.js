import { expect } from '@storybook/test'
import { NonExistent } from './non-existent-module' // This module doesn't exist

export default {
  title: 'Calculator',
}

export const Primary = {
  name: 'should add numbers correctly',
  play: async () => {
    await expect(true).toBe(true)
  },
}
