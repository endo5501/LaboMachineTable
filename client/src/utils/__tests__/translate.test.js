import translate from '../translate';

describe('translate utility', () => {
  test('returns Japanese translation for existing key', () => {
    expect(translate('Equipment Layout')).toBe('装置の配置');
    expect(translate('Login')).toBe('ログイン');
    expect(translate('Username')).toBe('ユーザ名');
  });

  test('returns original text for non-existing key', () => {
    expect(translate('Non-existing text')).toBe('Non-existing text');
  });

  test('returns empty string for null or undefined input', () => {
    expect(translate(null)).toBe('');
    expect(translate(undefined)).toBe('');
    expect(translate('')).toBe('');
  });

  test('handles edge cases properly', () => {
    expect(translate(0)).toBe('');
    expect(translate(false)).toBe('');
    expect(translate({})).toStrictEqual({});
  });
});
