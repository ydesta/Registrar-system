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

export const ETHIOPIAN_MOBILE_ERROR =
  'Use Ethio Telecom (09) or Safaricom (07). Examples: +2519xxxxxxxx, 09xxxxxxxx, 9xxxxxxxx, 07xxxxxxxx';

export const ETHIOPIAN_HOME_PHONE_ERROR =
  'Use +251, 01, 03, 04, 09, or 07. Examples: +2519xxxxxxxx, 011xxxxxxx, 0342xxxxxx, 09xxxxxxxx, 07xxxxxxxx';

function toEthiopianHomeNationalDigits(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const raw = value.toString().trim();
  if (!raw) {
    return null;
  }
  const cleaned = raw.replace(/[\s\-\(\)]/g, '');
  if (!/^\+?\d+$/.test(cleaned)) {
    return null;
  }
  let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (digits.length < 9 || digits.length > 15) {
    return null;
  }
  if (digits.startsWith('251')) {
    digits = digits.slice(3);
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length < 8 || digits.length > 12) {
    return null;
  }
  if (!/^[13479]\d+$/.test(digits)) {
    return null;
  }
  return digits;
}

function toEthiopianNationalDigits(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const raw = value.toString().trim();
  if (!raw) {
    return null;
  }
  const cleaned = raw.replace(/[\s\-\(\)]/g, '');
  if (!/^\+?\d+$/.test(cleaned)) {
    return null;
  }
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (digits.startsWith('251') && digits.length === 12) {
    return digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return digits.slice(1);
  }
  if (digits.length === 9) {
    return digits;
  }
  return null;
}

export function normalizeEthiopianMobile(value: unknown): string | null {
  const national = toEthiopianNationalDigits(value);
  if (!national || !/^[79]\d{8}$/.test(national)) {
    return null;
  }
  return `+251${national}`;
}

export function normalizeEthiopianHomePhone(value: unknown): string | null {
  const national = toEthiopianHomeNationalDigits(value);
  if (!national) {
    return null;
  }
  return `+251${national}`;
}

export function ethiopianMobileValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }
    if (normalizeEthiopianMobile(control.value)) {
      return null;
    }
    return {
      invalidPhoneNumber: {
        valid: false,
        message: ETHIOPIAN_MOBILE_ERROR
      }
    };
  };
}

export function ethiopianHomePhoneValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }
    if (normalizeEthiopianHomePhone(control.value)) {
      return null;
    }
    return {
      invalidPhoneNumber: {
        valid: false,
        message: ETHIOPIAN_HOME_PHONE_ERROR
      }
    };
  };
}

export function phoneValidator(): ValidatorFn {
  return ethiopianMobileValidator();
}

export function phoneValidator9To14(): ValidatorFn {
  return ethiopianMobileValidator();
}

export function applyEthiopianMobileControl(control: AbstractControl | null | undefined): void {
  if (!control) {
    return;
  }
  const normalized = normalizeEthiopianMobile(control.value);
  if (normalized && normalized !== control.value) {
    control.setValue(normalized, { emitEvent: false });
  }
}

export function applyEthiopianHomePhoneControl(control: AbstractControl | null | undefined): void {
  if (!control) {
    return;
  }
  const normalized = normalizeEthiopianHomePhone(control.value);
  if (normalized && normalized !== control.value) {
    control.setValue(normalized, { emitEvent: false });
  }
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
export const CREDIT_HOUR_LIMIT_LEVEL: any[] = [
  { Id: 0, Description: "Student" },
  { Id: 1, Description: "Batch" },
  { Id: 2, Description: "Term / Year" },
  { Id: 3, Description: "Global" },
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
export const APPLICANT_TYPE_STATUS: any[] = [
  { Id: 1, Description: "Fresh" },
  { Id: 2, Description: "Transfer" }
];
export const APPROVAL_STATUS: any[] = [
  { Id: 1, Description: "Registered" },
  { Id: 2, Description: "Approved" },
  { Id: 3, Description: "Rejected" }
];
export const COURSE_REGISTRATION_STATUS: any[] = [
  { Id: 0, Description: "Regular" },
  { Id: 1, Description: "Dropped" },
  { Id: 2, Description: "Added" },
  { Id: 3, Description: "Assessment" },
  { Id: 4, Description: "Manual Registration" },
  { Id: 5, Description: "Deleted" },
  { Id: 6, Description: "Equivalent" },
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