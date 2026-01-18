/**
 * Parser for Xcode .xcresult bundles
 */

import type { TestResults, TestFailure } from '../../shared/types.js';

/**
 * Parse xcresult JSON output into TestResults structure
 */
export function parseXCResult(
  xcresultOutput: string,
  testSummaryOutput: string
): TestResults {
  const results: TestResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    duration: 0,
    failures: []
  };

  try {
    const summary = JSON.parse(testSummaryOutput);

    // Navigate the nested structure to find test results
    const summaries = summary.summaries?._values || [];

    for (const summaryItem of summaries) {
      const testableSummaries = summaryItem.testableSummaries?._values || [];

      for (const testable of testableSummaries) {
        const tests = testable.tests?._values || [];

        for (const test of tests) {
          const subtests = test.subtests?._values || [];

          for (const testCase of subtests) {
            const testCaseName = testCase.name?._value || 'Unknown';
            const methods = testCase.subtests?._values || [];

            for (const method of methods) {
              const methodName = method.name?._value || 'unknown';
              const status = method.testStatus?._value;
              const duration = method.duration?._value || 0;

              results.totalTests++;
              results.duration += duration;

              if (status === 'Success') {
                results.passedTests++;
              } else if (status === 'Failure') {
                results.failedTests++;

                // Extract failure details
                const failureSummaries = method.failureSummaries?._values || [];

                for (const failure of failureSummaries) {
                  results.failures.push({
                    testCase: testCaseName,
                    testMethod: methodName,
                    message: failure.message?._value || 'Test failed',
                    file: failure.fileName?._value,
                    line: failure.lineNumber?._value
                  });
                }
              } else if (status === 'Skipped') {
                results.skippedTests++;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // If parsing fails, return empty results
    console.error('Failed to parse xcresult:', error);
  }

  return results;
}
