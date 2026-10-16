import { parseBooleanEnv, validateEnvironment } from './environment';

describe('environment validation', () => {
  it.each([undefined, null, ''])(
    'defaults an absent value (%p) to false',
    (value) => {
      expect(parseBooleanEnv(value, 'FLAG')).toBe(false);
    },
  );

  it.each([
    [true, true],
    [false, false],
    ['true', true],
    [' TRUE ', true],
    ['false', false],
    [' False ', false],
  ])('parses %p as %p', (value, expected) => {
    expect(parseBooleanEnv(value, 'FLAG')).toBe(expected);
  });

  it('rejects ambiguous values instead of enabling a mutating flag', () => {
    expect(() => parseBooleanEnv('yes', 'INIT_DATABASE')).toThrow(
      'INIT_DATABASE must be "true" or "false"',
    );
  });

  it('normalizes both database mutation flags and preserves other values', () => {
    expect(
      validateEnvironment({
        DATABASE_HOST: 'localhost',
        TYPEORM_MIGRATIONS_RUN: 'false',
        INIT_DATABASE: 'true',
      }),
    ).toEqual({
      DATABASE_HOST: 'localhost',
      TYPEORM_MIGRATIONS_RUN: false,
      INIT_DATABASE: true,
    });
  });
});
