// Test file to verify validators work correctly
import { englishOnlyValidator, amharicOnlyValidator } from './constant';

// Test English validator
console.log('Testing English Validator:');
console.log('English text "John":', englishOnlyValidator()({ value: 'John' } as any));
console.log('Amharic text "አብዱል":', englishOnlyValidator()({ value: 'አብዱል' } as any));
console.log('Mixed text "Johnአብዱል":', englishOnlyValidator()({ value: 'Johnአብዱል' } as any));

// Test Amharic validator
console.log('\nTesting Amharic Validator:');
console.log('Amharic text "አብዱል":', amharicOnlyValidator()({ value: 'አብዱል' } as any));
console.log('English text "John":', amharicOnlyValidator()({ value: 'John' } as any));
console.log('Mixed text "አብዱልJohn":', amharicOnlyValidator()({ value: 'አብዱልJohn' } as any)); 