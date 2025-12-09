import { AbstractControl, ValidatorFn } from "@angular/forms";

export function alphabetsOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null;
    }

    // Updated regex to strictly allow only English letters and spaces
    const alphabetsOnlyRegex = /^[A-Za-z\s]+$/;
    const isValid = alphabetsOnlyRegex.test(control.value);
    return isValid
      ? null
      : {
        alphabetsOnly: {
          valid: false,
          message: "Only English letters and spaces are allowed."
        }
      };
  };
}

export function numbersOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return { required: true };
    }

    const numbersOnlyRegex = /^[0-9]+$/;
    const isValid = numbersOnlyRegex.test(control.value);
    return isValid
      ? null
      : { numbersOnly: { valid: false, message: "Only numbers are allowed." } };
  };
}

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null; // No validation for empty input
    }

    const phoneNumber = control.value.toString().trim();
    
    // Remove any spaces, dashes, or parentheses for validation
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Patterns for different phone number formats
    const patterns = {
      // International formats: +251, +33, etc.
      international: /^\+[1-9]\d{1,14}$/,
      
      // Ethiopian local formats: 09xxxxxxxx, 07xxxxxxxx (10 digits)
      ethiopianLocal: /^(09|07)\d{8}$/,
      
      // Other local formats: 0xxxxxxxxx (10 digits starting with 0)
      otherLocal: /^0\d{9}$/,
      
      // Basic numeric format (fallback)
      basic: /^[+]?[0-9]+$/
    };

    // Check if it matches any of the valid patterns
    const isValidFormat = 
      patterns.international.test(cleanPhoneNumber) ||
      patterns.ethiopianLocal.test(cleanPhoneNumber) ||
      patterns.otherLocal.test(cleanPhoneNumber) ||
      patterns.basic.test(cleanPhoneNumber);

    // Length validation for different formats
    const isValidLength = 
      // International: 7-15 digits (including country code)
      (cleanPhoneNumber.startsWith('+') && cleanPhoneNumber.length >= 7 && cleanPhoneNumber.length <= 15) ||
      // Local formats: exactly 10 digits
      (!cleanPhoneNumber.startsWith('+') && cleanPhoneNumber.length === 10) ||
      // Basic numeric: 7-15 digits
      (!cleanPhoneNumber.startsWith('+') && cleanPhoneNumber.length >= 7 && cleanPhoneNumber.length <= 15);

    if (!isValidFormat || !isValidLength) {
      return {
        invalidPhoneNumber: {
          valid: false,
          message: 'Invalid phone number format. Supported formats: +251xxxxxxxxx, +33xxxxxxxxx, 09xxxxxxxx, 07xxxxxxxx, or 0xxxxxxxxx (10 digits)'
        }
      };
    }

    return null;
  };
}

export function phoneValidator9To14(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null; // No validation for empty input
    }

    const phoneNumber = control.value.toString().trim();
    
    // Remove any spaces, dashes, or parentheses for validation
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's a valid phone number with 9-14 digits
    const phoneRegex = /^(\+[1-9]\d{1,14}|(09|07)\d{8}|0\d{9}|\d{9,14})$/;
    
    if (!phoneRegex.test(cleanPhoneNumber)) {
      return {
        invalidPhoneNumber: {
          valid: false,
          message: 'Phone number must be 9-14 digits. Supported formats: +251xxxxxxxxx, 09xxxxxxxx, 07xxxxxxxx, or 0xxxxxxxxx'
        }
      };
    }

    // Additional length validation for 9-14 digits
    const digitCount = cleanPhoneNumber.replace(/[^0-9]/g, '').length;
    if (digitCount < 9 || digitCount > 14) {
      return {
        invalidPhoneNumber: {
          valid: false,
          message: `Phone number must be 9-14 digits. Current length: ${digitCount} digits`
        }
      };
    }

    return null;
  };
}

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return { required: true };
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const isValid = emailRegex.test(control.value);
    return isValid
      ? null
      : { invalidEmail: { valid: false, message: "Invalid email format." } };
  };
}

export function alphabetsWithSpecialCharsValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null;
    }

    const alphabetsWithSpecialCharsRegex = /^[A-Za-z\s/]+$/; // Alphabets with space and forward slash
    const isValid = alphabetsWithSpecialCharsRegex.test(control.value);
    return isValid
      ? null
      : {
        invalidChars: {
          valid: false,
          message: "Only alphabets with space and forward slash are allowed."
        }
      };
  };
}
export enum REQUEST_STATUS {
  Requesting = 0,
  Submitted,
  Pending,
  Approved,
  Rejected
}

export enum ACADEMIC_STUDENT_STATUS {
  Applicant = 0,
  NewRegisterd,
  Pending,
  Approved,
  Rejected,
  Student,
  Graduated
}
export const REQUEST_STATUS_DESCRIPTIONS: {
  [key in ACADEMIC_STUDENT_STATUS]: string
} = {
  [ACADEMIC_STUDENT_STATUS.Applicant]: "Applicant",
  [ACADEMIC_STUDENT_STATUS.NewRegisterd]: "Applied",
  [ACADEMIC_STUDENT_STATUS.Pending]: "Pending",
  [ACADEMIC_STUDENT_STATUS.Approved]: "Approved Applicant",
  [ACADEMIC_STUDENT_STATUS.Rejected]: "Rejected Applicant ",
  [ACADEMIC_STUDENT_STATUS.Student]: "Student",
  [ACADEMIC_STUDENT_STATUS.Graduated]: "Graduated"
};

export const ACADEMIC_STUDENT_STATUS_DESCRIPTIONS: {
  [key in REQUEST_STATUS]: string
} = {
  [REQUEST_STATUS.Requesting]: "Requesting",
  [REQUEST_STATUS.Submitted]: "Submitted",
  [REQUEST_STATUS.Pending]: "Pending",
  [REQUEST_STATUS.Approved]: "Approved",
  [REQUEST_STATUS.Rejected]: "Rejected"
};
export const Division_Status: any[] = [
  { Id: 1, Description: "Regular" },
  { Id: 2, Description: "Evening" }
];
export const ACADEMIC_TERM_STATUS: any[] = [
  { Id: 1, Description: "Winter" },
  { Id: 2, Description: "Spring" },
  { Id: 3, Description: "Summer" },
  { Id: 4, Description: "Autumn" },
];
export const ACADEMIC_SEMESTER_LIST: any[] = [
  { Id: 1, Description: "Semester I" },
  { Id: 2, Description: "Semester II" },
  { Id: 3, Description: "Semester III" },
  { Id: 4, Description: "Semester IV" },
];
export const ACADEMIC_YEAR_NUMBER_STATUS: any[] = [
  { Id: 1, Description: "First Year" },
  { Id: 2, Description: "Second Year" },
  { Id: 3, Description: "Third Year " },
  { Id: 4, Description: "Fourth Year " },
  { Id: 5, Description: "Fifth Year " }
];
export const APPROVAL_STATUS: any[] = [
  { Id: 1, Description: "Registered" },
  { Id: 2, Description: "Approved" },
  { Id: 3, Description: "Rejected" }
];
export const COURSE_REGISTRATION_STATUS: any[] = [
  { Id: 0, Description: "Registered" },
  { Id: 1, Description: "Dropped" },
  { Id: 2, Description: "Added" },
  { Id: 3, Description: "Assessment" },
  { Id: 4, Description: "Registrar Override" },
  { Id: 5, Description: "Deleted" },
];
export const SECTION_TYPE: any[] = [
  { Id: 0, Description: "Class" },
  { Id: 1, Description: "Lab" },
  { Id: 2, Description: "Manual" }
];
export const REGISTARAR_APPROVAL_STATUS: any[] = [
  { Id: 0, Description: "Pending" },
  { Id: 2, Description: "Rejected" },
  { Id: 3, Description: "Accepted" }
];
export const CURRICULUM_STATUS: any[] = [
  { Id: 1, Description: "Active" },
  { Id: 2, Description: "Phasing Out" },
  { Id: 3, Description: "Retired" },
];
export const PROGRAM_TYPE: any[] = [
  { Id: 1, Description: "Diploma" },
  { Id: 2, Description: "Bachelor's Degree" },
  { Id: 3, Description: "Master's Degree" },
  { Id: 4, Description: "Ph.D." },
  { Id: 5, Description: "Bridging" },
];
export const BANK_TO: any[] = [
  { Id: 1, Description: "Dashen: 7938725387911" },
  // { Id: 2, Description: "CBE:  1000004662249" },
  // { Id: 3, Description: "Hibret:  1601816158019019" },
  // { Id: 4, Description: "Awash: 130402166400" },
  // { Id: 5, Description: "ZamZam: 0000007110301" }
];
export const DATA_MIGRATION: any[] = [

  { Id: 1, Description: "Program" },
  { Id: 2, Description: "Curriculum" },
  { Id: 3, Description: "Course" },
  { Id: 4, Description: "BatchCode" },
  { Id: 5, Description: "Quadrant" },
  { Id: 6, Description: "Quadrant Breakdown" },
  { Id: 7, Description: "Student registration" },
  { Id: 8, Description: "Staff" },
  { Id: 9, Description: "Term Course Offering" },
  { Id: 10, Description: "Student Semester Course Registration" },
  { Id: 11, Description: "Student Grade" },

];
export const EMPLOYMENT_TYPE: any[] = [
  { Id: 1, Description: "Full-Time" },
  { Id: 2, Description: "Part-Time" },
  { Id: 3, Description: "Contract" },
  { Id: 4, Description: "Intern" },
  { Id: 5, Description: "Freelance" },
  { Id: 6, Description: "Volunteer" },
  { Id: 7, Description: "Hourly" },
  { Id: 8, Description: "Consultant" },
];

export const INSTRUCTOR_TITLES: any[] = [
  { Id: 1, Description: "Mr." },
  { Id: 2, Description: "Mrs." },
  { Id: 3, Description: "Ms." },
  { Id: 4, Description: "Dr." },
  { Id: 5, Description: "Prof." },
  { Id: 6, Description: "Eng." },
  { Id: 7, Description: "Ato" },    // Common Ethiopian title for men
  { Id: 8, Description: "Weizero" }, // Common Ethiopian title for married women
  { Id: 9, Description: "Weizerit" } // Common Ethiopian title for unmarried women
];

export enum RegistrationStatus {
  Regular ,
  Drop ,  
  Add,
  Assessment,
  RegistrarOverride,
  Deleted,
  Equivalent  
}
export function etEnAlphabetValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null;
    }

    // Updated regex to properly support Amharic characters (Unicode range \u1200-\u137F)
    // and English letters with spaces
    const etEnAlphabetRegex = /^[\u1200-\u137F\u0020a-zA-Z]+$/;
    const isValid = etEnAlphabetRegex.test(control.value);
    return isValid
      ? null
      : {
        invalidEtEnAlphabet: {
          valid: false,
          message: "Only Ethiopian and English alphabets with spaces are allowed."
        }
      };
  };
}

export function flexibleNameValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null;
    }

    const value = control.value.toString();
    
    // More flexible regex for names that might contain:
    // - Amharic characters (Unicode range \u1200-\u137F)
    // - English letters (a-zA-Z)
    // - Spaces (\u0020)
    // - Common name punctuation: hyphens (-), apostrophes ('), periods (.)
    // - Numbers (0-9) which are sometimes part of names
    const flexibleNameRegex = /^[\u1200-\u137F\u0020a-zA-Z0-9\-'\.]+$/;
    const isValid = flexibleNameRegex.test(value);
    
    if (!isValid) {
      return {
        invalidName: {
          valid: false,
          message: "Only letters, numbers, spaces, hyphens, apostrophes, and periods are allowed in names."
        }
      };
    }
    
    return null;
  };
}

export function amharicOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null;
    }

    const value = control.value.toString();
    
    // Regex to match only Amharic characters and spaces
    // \u1200-\u137F is the Unicode range for Ethiopian script (Amharic)
    // \u0020 is space character
    const amharicRegex = /^[\u1200-\u137F\u0020]+$/;
    const isValid = amharicRegex.test(value);
    
    // Additional check to ensure no English letters are present
    const hasEnglishLetters = /[A-Za-z]/.test(value);
    
    // Additional check for any other non-Amharic characters
    const hasOtherChars = /[^\u1200-\u137F\u0020]/.test(value);
    
    if (!isValid || hasEnglishLetters || hasOtherChars) {
      return {
        invalidAmharic: {
          valid: false,
          message: "Only Amharic characters and spaces are allowed. English letters and other special characters are not permitted."
        }
      };
    }
    
    return null;
  };
}

export function englishOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === "") {
      return null;
    }

    const value = control.value.toString();
    
    // Check if string contains only English letters and spaces
    const englishRegex = /^[A-Za-z\s]+$/;
    const isValid = englishRegex.test(value);
    
    // Additional check to ensure no Amharic characters are present
    const hasAmharicChars = /[\u1200-\u137F]/.test(value);
    
    // Additional check for any other non-English characters
    const hasOtherChars = /[^A-Za-z\s]/.test(value);
    
    if (!isValid || hasAmharicChars || hasOtherChars) {
      return {
        invalidEnglish: {
          valid: false,
          message: "Only English letters and spaces are allowed. Amharic characters and other special characters are not permitted."
        }
      };
    }
    
    return null;
  };
}

// Country interface
export interface Country {
  name: string;
  nationality: string;
  flag: string;
}

// Countries list with flags and nationalities
export const COUNTRIES: Country[] = [
  { name: 'Afghanistan', nationality: 'Afghan', flag: '🇦🇫' },
  { name: 'Albania', nationality: 'Albanian', flag: '🇦🇱' },
  { name: 'Algeria', nationality: 'Algerian', flag: '🇩🇿' },
  { name: 'Argentina', nationality: 'Argentine', flag: '🇦🇷' },
  { name: 'Australia', nationality: 'Australian', flag: '🇦🇺' },
  { name: 'Austria', nationality: 'Austrian', flag: '🇦🇹' },
  { name: 'Bangladesh', nationality: 'Bangladeshi', flag: '🇧🇩' },
  { name: 'Belgium', nationality: 'Belgian', flag: '🇧🇪' },
  { name: 'Brazil', nationality: 'Brazilian', flag: '🇧🇷' },
  { name: 'Bulgaria', nationality: 'Bulgarian', flag: '🇧🇬' },
  { name: 'Cambodia', nationality: 'Cambodian', flag: '🇰🇭' },
  { name: 'Cameroon', nationality: 'Cameroonian', flag: '🇨🇲' },
  { name: 'Canada', nationality: 'Canadian', flag: '🇨🇦' },
  { name: 'Chile', nationality: 'Chilean', flag: '🇨🇱' },
  { name: 'China', nationality: 'Chinese', flag: '🇨🇳' },
  { name: 'Colombia', nationality: 'Colombian', flag: '🇨🇴' },
  { name: 'Costa Rica', nationality: 'Costa Rican', flag: '🇨🇷' },
  { name: 'Croatia', nationality: 'Croatian', flag: '🇭🇷' },
  { name: 'Cuba', nationality: 'Cuban', flag: '🇨🇺' },
  { name: 'Czech Republic', nationality: 'Czech', flag: '🇨🇿' },
  { name: 'Denmark', nationality: 'Danish', flag: '🇩🇰' },
  { name: 'Dominican Republic', nationality: 'Dominican', flag: '🇩🇴' },
  { name: 'Ecuador', nationality: 'Ecuadorian', flag: '🇪🇨' },
  { name: 'Egypt', nationality: 'Egyptian', flag: '🇪🇬' },
  { name: 'El Salvador', nationality: 'Salvadoran', flag: '🇸🇻' },
  { name: 'Eritrea', nationality: 'Eritrean', flag: '🇪🇷' },
  { name: 'Estonia', nationality: 'Estonian', flag: '🇪🇪' },
  { name: 'Ethiopia', nationality: 'Ethiopian', flag: '🇪🇹' },
  { name: 'Finland', nationality: 'Finnish', flag: '🇫🇮' },
  { name: 'France', nationality: 'French', flag: '🇫🇷' },
  { name: 'Germany', nationality: 'German', flag: '🇩🇪' },
  { name: 'Ghana', nationality: 'Ghanaian', flag: '🇬🇭' },
  { name: 'Greece', nationality: 'Greek', flag: '🇬🇷' },
  { name: 'Guatemala', nationality: 'Guatemalan', flag: '🇬🇹' },
  { name: 'Haiti', nationality: 'Haitian', flag: '🇭🇹' },
  { name: 'Honduras', nationality: 'Honduran', flag: '🇭🇳' },
  { name: 'Hong Kong', nationality: 'Hong Konger', flag: '🇭🇰' },
  { name: 'Hungary', nationality: 'Hungarian', flag: '🇭🇺' },
  { name: 'Iceland', nationality: 'Icelandic', flag: '🇮🇸' },
  { name: 'India', nationality: 'Indian', flag: '🇮🇳' },
  { name: 'Indonesia', nationality: 'Indonesian', flag: '🇮🇩' },
  { name: 'Iran', nationality: 'Iranian', flag: '🇮🇷' },
  { name: 'Iraq', nationality: 'Iraqi', flag: '🇮🇶' },
  { name: 'Ireland', nationality: 'Irish', flag: '🇮🇪' },
  { name: 'Israel', nationality: 'Israeli', flag: '🇮🇱' },
  { name: 'Italy', nationality: 'Italian', flag: '🇮🇹' },
  { name: 'Jamaica', nationality: 'Jamaican', flag: '🇯🇲' },
  { name: 'Japan', nationality: 'Japanese', flag: '🇯🇵' },
  { name: 'Jordan', nationality: 'Jordanian', flag: '🇯🇴' },
  { name: 'Kazakhstan', nationality: 'Kazakh', flag: '🇰🇿' },
  { name: 'Kenya', nationality: 'Kenyan', flag: '🇰🇪' },
  { name: 'Kuwait', nationality: 'Kuwaiti', flag: '🇰🇼' },
  { name: 'Latvia', nationality: 'Latvian', flag: '🇱🇻' },
  { name: 'Lebanon', nationality: 'Lebanese', flag: '🇱🇧' },
  { name: 'Libya', nationality: 'Libyan', flag: '🇱🇾' },
  { name: 'Lithuania', nationality: 'Lithuanian', flag: '🇱🇹' },
  { name: 'Luxembourg', nationality: 'Luxembourgish', flag: '🇱🇺' },
  { name: 'Malaysia', nationality: 'Indonesian', flag: '🇲🇾' },
  { name: 'Mali', nationality: 'Malian', flag: '🇲🇱' },
  { name: 'Malta', nationality: 'Maltese', flag: '🇲🇹' },
  { name: 'Mauritania', nationality: 'Mauritanian', flag: '🇲🇷' },
  { name: 'Mauritius', nationality: 'Mauritian', flag: '🇲🇺' },
  { name: 'Mexico', nationality: 'Mexican', flag: '🇲🇽' },
  { name: 'Monaco', nationality: 'Monacan', flag: '🇲🇨' },
  { name: 'Mongolia', nationality: 'Mongolian', flag: '🇲🇳' },
  { name: 'Morocco', nationality: 'Moroccan', flag: '🇲🇦' },
  { name: 'Mozambique', nationality: 'Mozambican', flag: '🇲🇿' },
  { name: 'Myanmar', nationality: 'Burmese', flag: '🇲🇲' },
  { name: 'Namibia', nationality: 'Namibian', flag: '🇳🇦' },
  { name: 'Nepal', nationality: 'Nepalese', flag: '🇳🇵' },
  { name: 'Netherlands', nationality: 'Dutch', flag: '🇳🇱' },
  { name: 'New Zealand', nationality: 'New Zealander', flag: '🇳🇿' },
  { name: 'Nigeria', nationality: 'Nigerian', flag: '🇳🇬' },
  { name: 'North Korea', nationality: 'North Korean', flag: '🇰🇵' },
  { name: 'Norway', nationality: 'Norwegian', flag: '🇳🇴' },
  { name: 'Oman', nationality: 'Omani', flag: '🇴🇲' },
  { name: 'Pakistan', nationality: 'Pakistani', flag: '🇵🇰' },
  { name: 'Panama', nationality: 'Panamanian', flag: '🇵🇦' },
  { name: 'Paraguay', nationality: 'Paraguayan', flag: '🇵🇾' },
  { name: 'Peru', nationality: 'Peruvian', flag: '🇵🇪' },
  { name: 'Philippines', nationality: 'Filipino', flag: '🇵🇭' },
  { name: 'Poland', nationality: 'Polish', flag: '🇵🇱' },
  { name: 'Portugal', nationality: 'Portuguese', flag: '🇵🇹' },
  { name: 'Qatar', nationality: 'Qatari', flag: '🇶🇦' },
  { name: 'Romania', nationality: 'Romanian', flag: '🇷🇴' },
  { name: 'Russia', nationality: 'Russian', flag: '🇷🇺' },
  { name: 'Rwanda', nationality: 'Rwandan', flag: '🇷🇼' },
  { name: 'Saudi Arabia', nationality: 'Saudi', flag: '🇸🇦' },
  { name: 'Senegal', nationality: 'Senegalese', flag: '🇸🇳' },
  { name: 'Serbia', nationality: 'Serbian', flag: '🇷🇸' },
  { name: 'Singapore', nationality: 'Singaporean', flag: '🇸🇬' },
  { name: 'Slovakia', nationality: 'Slovak', flag: '🇸🇰' },
  { name: 'Slovenia', nationality: 'Slovenian', flag: '🇸🇮' },
  { name: 'Somalia', nationality: 'Somali', flag: '🇸🇴' },
  { name: 'South Africa', nationality: 'South African', flag: '🇿🇦' },
  { name: 'South Korea', nationality: 'South Korean', flag: '🇰🇷' },
  { name: 'Spain', nationality: 'Spanish', flag: '🇪🇸' },
  { name: 'Sri Lanka', nationality: 'Sri Lankan', flag: '🇱🇰' },
  { name: 'Sudan', nationality: 'Sudanese', flag: '🇸🇩' },
  { name: 'Sweden', nationality: 'Swedish', flag: '🇸🇪' },
  { name: 'Switzerland', nationality: 'Swiss', flag: '🇨🇭' },
  { name: 'Syria', nationality: 'Syrian', flag: '🇸🇾' },
  { name: 'Taiwan', nationality: 'Taiwanese', flag: '🇹🇼' },
  { name: 'Tanzania', nationality: 'Tanzanian', flag: '🇹🇿' },
  { name: 'Thailand', nationality: 'Thai', flag: '🇹🇭' },
  { name: 'Tunisia', nationality: 'Tunisian', flag: '🇹🇳' },
  { name: 'Turkey', nationality: 'Turkish', flag: '🇹🇷' },
  { name: 'Uganda', nationality: 'Ugandan', flag: '🇺🇬' },
  { name: 'Ukraine', nationality: 'Ukrainian', flag: '🇺🇦' },
  { name: 'United Arab Emirates', nationality: 'Emirati', flag: '🇦🇪' },
  { name: 'United Kingdom', nationality: 'British', flag: '🇬🇧' },
  { name: 'United States', nationality: 'American', flag: '🇺🇸' },
  { name: 'Uruguay', nationality: 'Uruguayan', flag: '🇺🇾' },
  { name: 'Venezuela', nationality: 'Venezuelan', flag: '🇻🇪' },
  { name: 'Vietnam', nationality: 'Vietnamese', flag: '🇻🇳' },
  { name: 'Yemen', nationality: 'Yemeni', flag: '🇾🇪' },
  { name: 'Zimbabwe', nationality: 'Zimbabwean', flag: '🇿🇼' }
];

// Education level options for the select dropdown
export const EDUCATION_LEVEL_OPTIONS = [
  { label: 'High School Complete', value: 'High School Complete' },
  { label: 'Certificate/Diploma', value: 'Certificate/Diploma' },
  { label: 'Associate\'s Degree', value: 'Associate\'s Degree' },
  { label: 'Bachelor\'s Degree', value: 'Bachelor\'s Degree' },
  { label: 'Master\'s Degree', value: 'Master\'s Degree' },
  { label: 'Doctorate (Ph.D.)', value: 'Doctorate (Ph.D.)' },
  { label: 'Other', value: 'Other' }
];