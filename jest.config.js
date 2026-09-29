module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src', '<rootDir>/supabase/functions'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
