export function parseBooleanEnv(
  value: unknown,
  key: string,
  fallback = false,
): boolean {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }
  }

  throw new Error(`${key} must be "true" or "false"`);
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...config,
    TYPEORM_MIGRATIONS_RUN: parseBooleanEnv(
      config.TYPEORM_MIGRATIONS_RUN,
      'TYPEORM_MIGRATIONS_RUN',
    ),
    INIT_DATABASE: parseBooleanEnv(config.INIT_DATABASE, 'INIT_DATABASE'),
  };
}
