# Testing Guide

This document provides comprehensive information about the test suite for the Rhythmic Gymnastics Attendance Management System.

## Overview

The project includes comprehensive unit tests for both server-side (Node.js) and client-side (React) code using Jest as the test framework.

## Test Structure

```
server/
├── jest.config.js                              # Jest configuration for server
├── utils/__tests__/
│   └── safeJsonParse.test.js                  # Safe JSON parsing utility tests
├── middleware/__tests__/
│   └── auth.test.js                           # JWT verification middleware tests
└── controllers/__tests__/
    ├── authController.test.js                 # Authentication controller tests
    └── studentController.test.js              # Student CRUD controller tests

client/
├── jest.config.js                              # Jest configuration for client
├── .babelrc                                    # Babel configuration for JSX
├── src/
│   ├── setupTests.js                          # Test setup (React Testing Library)
│   ├── utils/__tests__/
│   │   ├── tokenStorage.test.js              # Token storage with dual strategy tests
│   │   └── dateHelpers.test.js               # Age calculation and date formatting tests
│   └── hooks/__tests__/
│       └── useMediaQuery.test.js             # useIsMobile responsive hook tests
```

## Installation

### Server Tests

```bash
cd server
npm install
```

This will install Jest as specified in `package.json`.

### Client Tests

```bash
cd client
npm install
```

This will install:
- `jest` - Test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM
- `babel-jest` - Babel transformer for Jest
- `jest-environment-jsdom` - DOM environment for Jest

## Running Tests

### Server Tests

```bash
cd server

# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Client Tests

```bash
cd client

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Server-Side Tests

#### 1. `safeJsonParse.test.js` - Safe JSON Parsing Utility
**File:** `/Users/jay/Documents/Projects/rg-manager/rg-manager/server/utils/__tests__/safeJsonParse.test.js`

**Coverage:**
- ✅ Valid JSON parsing (arrays, objects, nested structures)
- ✅ Invalid JSON handling with default values
- ✅ Edge cases (null, undefined, empty string)
- ✅ Custom default values
- ✅ Type preservation (numbers, booleans, null)
- ✅ Error logging verification
- ✅ Special characters in JSON

**Test Count:** 16 tests

#### 2. `auth.test.js` - JWT Verification Middleware
**File:** `/Users/jay/Documents/Projects/rg-manager/rg-manager/server/middleware/__tests__/auth.test.js`

**Coverage:**
- ✅ Valid token verification (with/without Bearer prefix)
- ✅ Missing token handling (401 response)
- ✅ Expired token detection (TokenExpiredError)
- ✅ Invalid token signature (401 response)
- ✅ Malformed token handling
- ✅ Server error handling (500 response)
- ✅ Token extraction logic
- ✅ req.user population with decoded payload

**Test Count:** 15 tests

#### 3. `authController.test.js` - Authentication Controller
**File:** `/Users/jay/Documents/Projects/rg-manager/rg-manager/server/controllers/__tests__/authController.test.js`

**Coverage:**
- ✅ Login with valid/invalid credentials
- ✅ Signup with duplicate username validation
- ✅ JWT token generation and verification
- ✅ Password exclusion from responses
- ✅ User CRUD operations with role-based access (admin-only)
- ✅ Token verification endpoint
- ✅ User data transfer (admin-only)
- ✅ Username update with duplicate validation
- ✅ Kakao OAuth integration (getKakaoAuthUrl, kakaoCallback)
- ✅ Error handling for all endpoints

**Test Count:** 20 tests

#### 4. `studentController.test.js` - Student CRUD Controller
**File:** `/Users/jay/Documents/Projects/rg-manager/rg-manager/server/controllers/__tests__/studentController.test.js`

**Coverage:**
- ✅ Get students (admin vs user filtering)
- ✅ Create student with validation (name, birthdate required)
- ✅ Update student with role-based access
- ✅ Delete student with cascade handling
- ✅ Admin filter by user ID
- ✅ Input validation (null, undefined, empty strings)
- ✅ Error handling for all endpoints

**Test Count:** 18 tests

### Client-Side Tests

#### 1. `tokenStorage.test.js` - Dual Storage Strategy
**File:** `/Users/jay/Documents/Projects/rg-manager/rg-manager/client/src/utils/__tests__/tokenStorage.test.js`

**Coverage:**
- ✅ Save/retrieve token from localStorage
- ✅ Save/retrieve token from cookie (fallback)
- ✅ **Dual storage strategy** (localStorage + cookie for iOS Safari)
- ✅ Token restoration from cookie to localStorage
- ✅ localStorage error handling (QuotaExceededError, SecurityError)
- ✅ User object storage/retrieval with JSON parsing
- ✅ clearAuth function (removes both token and user)
- ✅ Cookie attributes (path, max-age, SameSite)
- ✅ Browser close simulation (localStorage cleared, cookie persists)
- ✅ Special characters handling (JWT tokens, Korean usernames)

**Test Count:** 26 tests

**Key Feature:** Tests verify the iOS Safari workaround where tokens are stored in both localStorage AND cookies, ensuring login persistence even after browser closure.

#### 2. `dateHelpers.test.js` - Age Calculation & Date Formatting
**File:** `/Users/jay/Documents/Projects/rg-manager/rg-manager/client/src/utils/__tests__/dateHelpers.test.js`

**Coverage:**
- ✅ Age calculation with birthday before/after today
- ✅ Month boundary cases
- ✅ Leap year handling (Feb 29)
- ✅ Edge cases (null, undefined, empty string, invalid date)
- ✅ Future birthdate handling (negative age)
- ✅ Year-end/year-start boundaries (Dec 31, Jan 1)
- ✅ Date formatting in 3 formats (full, short, compact)
- ✅ Korean weekday display (일, 월, 화, 수, 목, 금, 토)
- ✅ Different input formats (ISO, Date object)

**Test Count:** 40+ tests

#### 3. `useMediaQuery.test.js` - Responsive Hook
**File:** `/Users/jay/Documents/Projects/rg-manager/rg-manager/client/src/hooks/__tests__/useMediaQuery.test.js`

**Coverage:**
- ✅ Mobile detection (≤768px default)
- ✅ Desktop detection (>768px)
- ✅ Custom breakpoint support
- ✅ Window resize event handling
- ✅ Multiple resize events
- ✅ Breakpoint prop changes
- ✅ Event listener cleanup on unmount
- ✅ Common device widths (iPhone, iPad, laptops, 4K)
- ✅ Edge cases (0px, negative width, very large width)
- ✅ Memory leak prevention

**Test Count:** 25+ tests

## Test Patterns

### Server-Side Pattern

```javascript
describe('ControllerName', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it('should handle valid request', async () => {
    // Arrange
    req.body = { name: 'Test' };
    Model.method.mockResolvedValue({ id: 1, name: 'Test' });

    // Act
    await controller.method(req, res);

    // Assert
    expect(Model.method).toHaveBeenCalledWith(expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});
```

### Client-Side Pattern

```javascript
describe('utilityFunction', () => {
  it('should return expected result for valid input', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = utilityFunction(input);

    // Assert
    expect(result).toBe('expected');
  });

  it('should handle edge case gracefully', () => {
    expect(utilityFunction(null)).toBe(defaultValue);
  });
});
```

### React Hook Pattern

```javascript
import { renderHook, act } from '@testing-library/react';

describe('useCustomHook', () => {
  it('should update state on action', () => {
    const { result } = renderHook(() => useCustomHook());

    act(() => {
      result.current.action();
    });

    expect(result.current.state).toBe(expectedValue);
  });
});
```

## Mocking Strategies

### Server-Side Mocks

1. **Model Mocks:**
   ```javascript
   jest.mock('../../models/User.js');
   User.getByUsername.mockResolvedValue({ id: 1, username: 'test' });
   ```

2. **JWT Mocks:**
   ```javascript
   const token = jwt.sign(payload, JWT_SECRET);
   ```

3. **Console Mocks:**
   ```javascript
   const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
   ```

### Client-Side Mocks

1. **localStorage Mock:**
   ```javascript
   beforeEach(() => {
     localStorage.clear();
   });
   ```

2. **document.cookie Mock:**
   ```javascript
   Object.defineProperty(document, 'cookie', {
     get: jest.fn(() => 'key=value'),
     set: jest.fn(),
   });
   ```

3. **window.innerWidth Mock:**
   ```javascript
   Object.defineProperty(window, 'innerWidth', {
     writable: true,
     value: 768,
   });
   ```

## Key Testing Principles

1. **Arrange-Act-Assert (AAA):** All tests follow this pattern
2. **Isolation:** Each test is independent and can run in any order
3. **Descriptive Names:** Test names clearly describe what is being tested
4. **Edge Cases:** Comprehensive coverage of null, undefined, empty, and invalid inputs
5. **Error Handling:** All error paths are tested
6. **Cleanup:** All mocks and spies are cleared/restored

## Continuous Integration (CI) Ready

All tests are designed to run in CI environments:
- No external dependencies required (mocked)
- Deterministic results (no random data)
- Fast execution (unit tests only)
- Clear pass/fail criteria

## Coverage Goals

Current coverage targets:
- **Utility Functions:** 100%
- **Middleware:** 95%+
- **Controllers:** 90%+
- **Hooks:** 95%+

Run `npm run test:coverage` to see detailed coverage reports.

## Troubleshooting

### Common Issues

1. **ESM Module Error (Server):**
   - Ensure `"type": "module"` is in `server/package.json`
   - Use `node --experimental-vm-modules` in test script

2. **React/JSX Transform Error (Client):**
   - Ensure `.babelrc` is configured with `@babel/preset-react`
   - Check that `babel-jest` is installed

3. **localStorage/Cookie Not Defined:**
   - Use `jest-environment-jsdom` for client tests
   - Mock browser APIs in test setup

4. **Async Tests Timing Out:**
   - Increase `testTimeout` in jest.config.js
   - Ensure all promises are awaited

## Best Practices

1. **Test One Thing:** Each test should verify a single behavior
2. **Use Descriptive Names:** Korean or English matching project style
3. **Mock External Dependencies:** Never call real databases or APIs
4. **Avoid Testing Implementation:** Test behavior, not internal structure
5. **Write Resilient Tests:** Tests should survive refactoring

## Contributing

When adding new features:
1. Write tests first (TDD) or alongside the feature
2. Ensure all tests pass: `npm test`
3. Maintain or improve coverage: `npm run test:coverage`
4. Follow existing test patterns and conventions

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)
