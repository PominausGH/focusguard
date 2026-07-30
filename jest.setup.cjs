/* eslint-disable no-undef */

// Mock AsyncStorage for unit tests
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Global test timeout
jest.setTimeout(10000);

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  mockAsyncStorage.getItem.mockImplementation(() => Promise.resolve(null));
  mockAsyncStorage.setItem.mockImplementation(() => Promise.resolve());
});
