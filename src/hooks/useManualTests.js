import { useState, useEffect } from 'react';
import { MANUAL_TESTS, TEST_STATUS } from '@/lib/testDefinitions';

const STORAGE_KEY = 'keysfood_manual_tests_results';

export const useManualTests = () => {
  const [results, setResults] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setResults(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load test results', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage whenever results change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    }
  }, [results, isLoaded]);

  const saveTestResult = (testId, status, notes = '') => {
    setResults(prev => ({
      ...prev,
      [testId]: {
        status,
        notes,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const clearAllResults = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer tous les résultats de tests ?")) {
      setResults({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getTestResult = (testId) => {
    return results[testId] || { status: TEST_STATUS.NOT_RUN, notes: '', timestamp: null };
  };

  const calculateStats = () => {
    const total = MANUAL_TESTS.length;
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    let notRun = total;

    Object.keys(results).forEach(key => {
      const status = results[key].status;
      if (status === TEST_STATUS.PASS) passed++;
      if (status === TEST_STATUS.FAIL) failed++;
      if (status === TEST_STATUS.WARNING) warnings++;
    });

    notRun = total - (passed + failed + warnings);
    const completed = passed + failed + warnings;
    const successRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;
    const totalProgress = Math.round((completed / total) * 100);

    return { total, passed, failed, warnings, notRun, completed, successRate, totalProgress };
  };

  return {
    results,
    saveTestResult,
    clearAllResults,
    getTestResult,
    calculateStats,
    tests: MANUAL_TESTS
  };
};