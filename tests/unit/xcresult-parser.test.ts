/**
 * Unit tests for xcresult parser
 */

import { describe, test, expect } from 'vitest';
import { parseXCResult } from '../../src/tools/test/xcresult-parser.js';
import type { TestResults } from '../../src/shared/types.js';

describe('parseXCResult', () => {
  test('parses successful test results with no failures', () => {
    const xcresultOutput = JSON.stringify({
      actions: {
        _values: [
          {
            actionResult: {
              testsRef: {
                id: {
                  _value: 'test-summary'
                }
              }
            }
          }
        ]
      }
    });

    const testSummary = JSON.stringify({
      summaries: {
        _values: [
          {
            testableSummaries: {
              _values: [
                {
                  tests: {
                    _values: [
                      {
                        subtests: {
                          _values: [
                            {
                              name: {
                                _value: 'MyAppTests'
                              },
                              subtests: {
                                _values: [
                                  {
                                    name: {
                                      _value: 'testExample()'
                                    },
                                    testStatus: {
                                      _value: 'Success'
                                    },
                                    duration: {
                                      _value: 0.042
                                    }
                                  },
                                  {
                                    name: {
                                      _value: 'testAnotherCase()'
                                    },
                                    testStatus: {
                                      _value: 'Success'
                                    },
                                    duration: {
                                      _value: 0.018
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    });

    const results = parseXCResult(xcresultOutput, testSummary);

    expect(results.totalTests).toBe(2);
    expect(results.passedTests).toBe(2);
    expect(results.failedTests).toBe(0);
    expect(results.skippedTests).toBe(0);
    expect(results.failures).toEqual([]);
    expect(results.duration).toBeCloseTo(0.06, 2);
  });

  test('parses test results with failures', () => {
    const xcresultOutput = JSON.stringify({
      actions: {
        _values: [
          {
            actionResult: {
              testsRef: {
                id: {
                  _value: 'test-summary'
                }
              }
            }
          }
        ]
      }
    });

    const testSummary = JSON.stringify({
      summaries: {
        _values: [
          {
            testableSummaries: {
              _values: [
                {
                  tests: {
                    _values: [
                      {
                        subtests: {
                          _values: [
                            {
                              name: {
                                _value: 'MyAppTests'
                              },
                              subtests: {
                                _values: [
                                  {
                                    name: {
                                      _value: 'testFailingCase()'
                                    },
                                    testStatus: {
                                      _value: 'Failure'
                                    },
                                    duration: {
                                      _value: 0.005
                                    },
                                    failureSummaries: {
                                      _values: [
                                        {
                                          message: {
                                            _value: 'XCTAssertEqual failed: ("1") is not equal to ("2")'
                                          },
                                          fileName: {
                                            _value: '/Users/dev/MyApp/MyAppTests/MyAppTests.swift'
                                          },
                                          lineNumber: {
                                            _value: 25
                                          }
                                        }
                                      ]
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    });

    const results = parseXCResult(xcresultOutput, testSummary);

    expect(results.totalTests).toBe(1);
    expect(results.passedTests).toBe(0);
    expect(results.failedTests).toBe(1);
    expect(results.failures).toHaveLength(1);
    expect(results.failures[0]).toEqual({
      testCase: 'MyAppTests',
      testMethod: 'testFailingCase()',
      message: 'XCTAssertEqual failed: ("1") is not equal to ("2")',
      file: '/Users/dev/MyApp/MyAppTests/MyAppTests.swift',
      line: 25
    });
  });

  test('handles skipped tests', () => {
    const xcresultOutput = JSON.stringify({
      actions: {
        _values: [
          {
            actionResult: {
              testsRef: {
                id: {
                  _value: 'test-summary'
                }
              }
            }
          }
        ]
      }
    });

    const testSummary = JSON.stringify({
      summaries: {
        _values: [
          {
            testableSummaries: {
              _values: [
                {
                  tests: {
                    _values: [
                      {
                        subtests: {
                          _values: [
                            {
                              name: {
                                _value: 'MyAppTests'
                              },
                              subtests: {
                                _values: [
                                  {
                                    name: {
                                      _value: 'testSkipped()'
                                    },
                                    testStatus: {
                                      _value: 'Skipped'
                                    },
                                    duration: {
                                      _value: 0.0
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    });

    const results = parseXCResult(xcresultOutput, testSummary);

    expect(results.totalTests).toBe(1);
    expect(results.passedTests).toBe(0);
    expect(results.failedTests).toBe(0);
    expect(results.skippedTests).toBe(1);
  });

  test('calculates total duration from all tests', () => {
    const xcresultOutput = JSON.stringify({
      actions: {
        _values: [
          {
            actionResult: {
              testsRef: {
                id: {
                  _value: 'test-summary'
                }
              }
            }
          }
        ]
      }
    });

    const testSummary = JSON.stringify({
      summaries: {
        _values: [
          {
            testableSummaries: {
              _values: [
                {
                  tests: {
                    _values: [
                      {
                        subtests: {
                          _values: [
                            {
                              name: {
                                _value: 'MyAppTests'
                              },
                              subtests: {
                                _values: [
                                  {
                                    name: {
                                      _value: 'test1()'
                                    },
                                    testStatus: {
                                      _value: 'Success'
                                    },
                                    duration: {
                                      _value: 1.5
                                    }
                                  },
                                  {
                                    name: {
                                      _value: 'test2()'
                                    },
                                    testStatus: {
                                      _value: 'Success'
                                    },
                                    duration: {
                                      _value: 2.3
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    });

    const results = parseXCResult(xcresultOutput, testSummary);

    expect(results.duration).toBeCloseTo(3.8, 1);
  });
});
