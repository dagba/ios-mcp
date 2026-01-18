/**
 * Unit tests for build error parser
 *
 * Tests follow the AAA (Arrange-Act-Assert) pattern:
 * - Arrange: Set up test data and dependencies
 * - Act: Execute the method under test
 * - Assert: Verify the expected results
 *
 * These tests verify parsing of xcodebuild compiler output into structured BuildError objects.
 */

import { describe, test, expect } from 'vitest';
import { parseBuildErrors } from '../../src/shared/xcodebuild.js';

describe('parseBuildErrors', () => {
  describe('single error parsing', () => {
    test('test_parseBuildErrors_withSwiftCompilerError_shouldExtractFileLineColumnAndMessage', () => {
      // Arrange
      const compilerOutput = `
/Users/dev/MyApp/MyApp/ContentView.swift:15:9: error: cannot find 'invalidFunction' in scope
        invalidFunction()
        ^~~~~~~~~~~~~~~
`;
      const expectedError = {
        file: '/Users/dev/MyApp/MyApp/ContentView.swift',
        line: 15,
        column: 9,
        type: 'error',
        message: "cannot find 'invalidFunction' in scope"
      };

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
      expect(errors[0].type).toBe('error'); // Verify it's classified as error
      expect(errors[0].file).toContain('ContentView.swift'); // Verify file path
    });

    test('test_parseBuildErrors_withErrorMissingColumn_shouldParseWithUndefinedColumn', () => {
      // Arrange
      const compilerOutput = `
/Users/dev/MyApp/MyApp/ContentView.swift:15: error: some error message
`;
      const expectedError = {
        file: '/Users/dev/MyApp/MyApp/ContentView.swift',
        line: 15,
        column: undefined,
        type: 'error',
        message: 'some error message'
      };

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
      expect(errors[0].column).toBeUndefined(); // Verify column is undefined when not present
    });
  });

  describe('multiple errors parsing', () => {
    test('test_parseBuildErrors_withMultipleErrors_shouldParseAllErrorsInOrder', () => {
      // Arrange
      const compilerOutput = `
/Users/dev/MyApp/MyApp/ContentView.swift:15:9: error: cannot find 'invalidFunction' in scope
        invalidFunction()
        ^~~~~~~~~~~~~~~
/Users/dev/MyApp/MyApp/Model.swift:22:13: error: value of type 'String' has no member 'invalidProperty'
            text.invalidProperty
            ~~~~ ^~~~~~~~~~~~~~~~
`;
      const expectedFirstFile = '/Users/dev/MyApp/MyApp/ContentView.swift';
      const expectedSecondFile = '/Users/dev/MyApp/MyApp/Model.swift';

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors).toHaveLength(2);
      expect(errors[0].file).toBe(expectedFirstFile);
      expect(errors[1].file).toBe(expectedSecondFile);

      // Verify both are errors (not warnings)
      expect(errors[0].type).toBe('error');
      expect(errors[1].type).toBe('error');
    });
  });

  describe('warnings parsing', () => {
    test('test_parseBuildErrors_withWarningsAndErrors_shouldParseBothTypes', () => {
      // Arrange
      const compilerOutput = `
/Users/dev/MyApp/MyApp/ContentView.swift:10:5: warning: variable 'unused' was never used
    let unused = 42
    ^~~~~~
/Users/dev/MyApp/MyApp/ContentView.swift:15:9: error: cannot find 'invalidFunction' in scope
        invalidFunction()
        ^~~~~~~~~~~~~~~
`;

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe('warning'); // First should be warning
      expect(errors[1].type).toBe('error'); // Second should be error

      // Verify warning details
      expect(errors[0].message).toContain('unused');
      expect(errors[0].line).toBe(10);
    });

    test('test_parseBuildErrors_withOnlyWarnings_shouldParseWarnings', () => {
      // Arrange
      const compilerOutput = `
/Users/dev/MyApp/MyApp/ContentView.swift:10:5: warning: variable 'unused' was never used
    let unused = 42
    ^~~~~~
/Users/dev/MyApp/MyApp/Model.swift:5:1: warning: immutable value 'x' was never used
`;

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors).toHaveLength(2);
      expect(errors.every(e => e.type === 'warning')).toBe(true); // All should be warnings
    });
  });

  describe('edge cases', () => {
    test('test_parseBuildErrors_withSuccessfulBuild_shouldReturnEmptyArray', () => {
      // Arrange
      const successOutput = `
Build Succeeded
** BUILD SUCCEEDED **
`;

      // Act
      const errors = parseBuildErrors(successOutput);

      // Assert
      expect(errors).toEqual([]);
      expect(errors).toHaveLength(0);
    });

    test('test_parseBuildErrors_withEmptyString_shouldReturnEmptyArray', () => {
      // Arrange
      const emptyOutput = '';

      // Act
      const errors = parseBuildErrors(emptyOutput);

      // Assert
      expect(errors).toEqual([]);
      expect(errors).toHaveLength(0);
    });

    test('test_parseBuildErrors_withExtraWhitespace_shouldTrimMessage', () => {
      // Arrange
      const compilerOutput = `
/Users/dev/MyApp/MyApp/ContentView.swift:15:9: error:    too much whitespace
`;
      const expectedMessage = 'too much whitespace';

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors[0].message).toBe(expectedMessage);
      expect(errors[0].message).not.toContain('   '); // No extra spaces
    });

    test('test_parseBuildErrors_withMixedLineEndings_shouldParseCorrectly', () => {
      // Arrange
      const compilerOutput = '/Users/dev/MyApp/ContentView.swift:10:5: error: first error\r\n/Users/dev/MyApp/Model.swift:20:3: error: second error\n';

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('first error');
      expect(errors[1].message).toBe('second error');
    });
  });

  describe('error message content', () => {
    test('test_parseBuildErrors_withLongErrorMessage_shouldCaptureFullMessage', () => {
      // Arrange
      const longMessage = 'cannot convert value of type \'String\' to expected argument type \'Int\' in this context';
      const compilerOutput = `/Users/dev/MyApp/Model.swift:30:15: error: ${longMessage}`;

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe(longMessage);
      expect(errors[0].message.length).toBeGreaterThan(50); // Verify it's actually long
    });

    test('test_parseBuildErrors_withSpecialCharactersInMessage_shouldPreserveCharacters', () => {
      // Arrange
      const messageWithSpecialChars = 'cannot find \'func<T>\' in scope';
      const compilerOutput = `/Users/dev/MyApp/Code.swift:5:1: error: ${messageWithSpecialChars}`;

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors[0].message).toBe(messageWithSpecialChars);
      expect(errors[0].message).toContain('<T>'); // Verify special chars preserved
      expect(errors[0].message).toContain("'"); // Verify quotes preserved
    });
  });

  describe('file path handling', () => {
    test('test_parseBuildErrors_withAbsolutePath_shouldPreserveFullPath', () => {
      // Arrange
      const absolutePath = '/Users/developer/Projects/MyApp/Sources/Main.swift';
      const compilerOutput = `${absolutePath}:10:5: error: test error`;

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors[0].file).toBe(absolutePath);
      expect(errors[0].file).toContain('/Users/'); // Verify it's absolute
    });

    test('test_parseBuildErrors_withNestedDirectories_shouldCaptureFullPath', () => {
      // Arrange
      const nestedPath = '/Users/dev/MyApp/Sources/ViewModels/Authentication/LoginViewModel.swift';
      const compilerOutput = `${nestedPath}:42:10: error: nested error`;

      // Act
      const errors = parseBuildErrors(compilerOutput);

      // Assert
      expect(errors[0].file).toBe(nestedPath);
      expect(errors[0].file).toContain('ViewModels/Authentication'); // Verify nested structure
    });
  });
});
