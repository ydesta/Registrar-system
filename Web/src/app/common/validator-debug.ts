// Debug file to test validators
export function debugValidators() {
  // Test data
  const testCases = [
    { name: 'English only', value: 'John', expected: 'valid' },
    { name: 'Amharic only', value: 'አብዱል', expected: 'invalid for English' },
    { name: 'Mixed', value: 'Johnአብዱል', expected: 'invalid for both' },
    { name: 'Empty', value: '', expected: 'valid' },
    { name: 'Numbers', value: 'John123', expected: 'invalid' },
    { name: 'Special chars', value: 'John@', expected: 'invalid' }
  ];

  console.log('=== VALIDATOR DEBUG ===');
  
  testCases.forEach(testCase => {
    console.log(`\nTesting: ${testCase.name}`);
    console.log(`Value: "${testCase.value}"`);
    
    // Test English validator
    const englishResult = englishOnlyValidator()({ value: testCase.value } as any);
    console.log(`English validator result:`, englishResult);
    
    // Test Amharic validator  
    const amharicResult = amharicOnlyValidator()({ value: testCase.value } as any);
    console.log(`Amharic validator result:`, amharicResult);
  });
}

// Import the validators
import { englishOnlyValidator, amharicOnlyValidator } from './constant';

// Run the debug
debugValidators(); 