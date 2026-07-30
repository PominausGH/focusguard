import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  sanitizeInput,
  getPasswordStrength,
} from '../../services/validation';

describe('validateEmail', () => {
  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('should reject whitespace-only email', () => {
    const result = validateEmail('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
      'missing.at.sign.com',
    ];

    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });
  });

  it('should accept valid email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.org',
      'user+tag@example.co.uk',
      'simple@test.io',
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject emails that are too long', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    const result = validateEmail(longEmail);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email address is too long');
  });

  it('should trim whitespace from emails', () => {
    const result = validateEmail('  test@example.com  ');
    expect(result.isValid).toBe(true);
  });
});

describe('validatePassword', () => {
  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password is required');
  });

  it('should reject passwords shorter than 8 characters', () => {
    const result = validatePassword('abc123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters long');
  });

  it('should reject passwords longer than 128 characters', () => {
    const longPassword = 'Aa1' + 'x'.repeat(130);
    const result = validatePassword(longPassword);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password is too long (max 128 characters)');
  });

  it('should reject passwords without letters', () => {
    const result = validatePassword('12345678');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least one letter');
  });

  it('should reject passwords without numbers', () => {
    const result = validatePassword('abcdefgh');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least one number');
  });

  it('should reject common weak passwords', () => {
    const weakPasswords = ['password123', 'qwerty123', 'admin123', 'welcome1'];

    weakPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This password is too common. Please choose a stronger password');
    });
  });

  it('should accept valid strong passwords', () => {
    const validPasswords = ['MySecure1', 'Testing123', 'ValidPass99', 'Str0ngP@ss'];

    validPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});

describe('validateDisplayName', () => {
  it('should reject empty name', () => {
    const result = validateDisplayName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('should reject names shorter than 2 characters', () => {
    const result = validateDisplayName('A');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name must be at least 2 characters long');
  });

  it('should reject names longer than 100 characters', () => {
    const longName = 'A'.repeat(101);
    const result = validateDisplayName(longName);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name is too long (max 100 characters)');
  });

  it('should reject names with invalid characters', () => {
    const invalidNames = ['John123', 'User@Name', 'Test!', 'Name#1'];

    invalidNames.forEach((name) => {
      const result = validateDisplayName(name);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
    });
  });

  it('should accept valid names', () => {
    // Note: José would fail with current ASCII-only regex - that's a known limitation
    const validNames = ['John', 'John Smith', "O'Brien", 'Mary-Jane'];

    validNames.forEach((name) => {
      const result = validateDisplayName(name);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});

describe('sanitizeInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('should remove angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should preserve normal text', () => {
    expect(sanitizeInput('Normal text here')).toBe('Normal text here');
  });
});

describe('getPasswordStrength', () => {
  it('should return weak for simple passwords', () => {
    const result = getPasswordStrength('abcd1234');
    expect(result.strength).toBe('weak');
    expect(result.score).toBeLessThanOrEqual(2);
  });

  it('should return medium for moderate passwords', () => {
    const result = getPasswordStrength('Abcd1234');
    expect(result.strength).toBe('medium');
    expect(result.score).toBe(3);
  });

  it('should return strong for complex passwords', () => {
    const result = getPasswordStrength('MyP@ssw0rd!');
    expect(result.strength).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(4);
  });

  it('should give higher score for longer passwords', () => {
    const short = getPasswordStrength('Abc12345');
    const long = getPasswordStrength('Abc123456789');
    expect(long.score).toBeGreaterThan(short.score);
  });

  it('should give higher score for special characters', () => {
    const noSpecial = getPasswordStrength('Abcd1234');
    const withSpecial = getPasswordStrength('Abcd1234!');
    expect(withSpecial.score).toBeGreaterThan(noSpecial.score);
  });
});
