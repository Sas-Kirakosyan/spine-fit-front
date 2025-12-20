# Setup Testing for Spine-Fit

## Quick Setup

Run these commands in your **Git Bash** terminal (not PowerShell):

```bash
# Install testing dependencies
npm install

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (no watch mode)
npm run test:run
```

## If PowerShell Shows Execution Policy Error

You have two options:

### Option 1: Use Git Bash (Recommended)
1. Open Git Bash terminal
2. Navigate to your project: `cd ~/OneDrive/Desktop/spine-fit-front`
3. Run: `npm install`
4. Run: `npm test`

### Option 2: Enable PowerShell Scripts (If you prefer PowerShell)
Run this in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try `npm install` again.

## What Was Added

1. **vitest** - Fast unit test framework that works with Vite
2. **@vitest/ui** - Visual test interface
3. **jsdom** - DOM environment for testing
4. **vitest.config.ts** - Test configuration
5. **Test scripts** in package.json:
   - `npm test` - Run tests in watch mode
   - `npm run test:ui` - Run tests with visual UI
   - `npm run test:run` - Run tests once

## Running Tests

After installing dependencies:

```bash
# Watch mode (auto-reruns on file changes)
npm test

# Single run
npm run test:run

# With UI (opens browser)
npm run test:ui
```

## Test Files

- `src/utils/__tests__/planGenerator.test.ts` - Main test file
- `src/utils/__tests__/setup.ts` - Test setup/mocks
- `vitest.config.ts` - Vitest configuration

## Quick Manual Test (No Installation Needed)

If you want to test without installing anything:

1. Open your app in browser
2. Open DevTools Console (F12)
3. Copy and paste the code from `src/utils/__tests__/manualTest.js`
4. Press Enter

This will check all your localStorage data and generated plans.
