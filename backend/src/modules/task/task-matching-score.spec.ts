import { calculateWeightedSkillMatch } from './task-matching-score';

describe('calculateWeightedSkillMatch', () => {
  const requirements = [
    { identifier: 'nestjs', label: 'NestJS', minLevel: 4, weight: 3 },
    { identifier: 'mysql', label: 'MySQL', minLevel: 2, weight: 1 },
  ];

  it('prioritizes the higher weighted requirement', () => {
    expect(
      calculateWeightedSkillMatch(requirements, [
        { skillId: 'nestjs', level: 4 },
      ]),
    ).toEqual({
      score: 75,
      matchedSkills: ['NestJS'],
      missingSkills: ['MySQL'],
    });
  });

  it('gives explainable partial credit below the requested level', () => {
    expect(
      calculateWeightedSkillMatch(requirements, [
        { skillId: 'nestjs', level: 2 },
        { skillId: 'mysql', level: 2 },
      ]),
    ).toEqual({
      score: 63,
      matchedSkills: ['MySQL'],
      missingSkills: ['NestJS'],
    });
  });

  it('returns zero when the task has no requirements', () => {
    expect(calculateWeightedSkillMatch([], [])).toEqual({
      score: 0,
      matchedSkills: [],
      missingSkills: [],
    });
  });

  it('normalizes non-finite legacy values and always returns a bounded score', () => {
    const result = calculateWeightedSkillMatch(
      [
        {
          identifier: 'nestjs',
          label: 'NestJS',
          minLevel: Number.NaN,
          weight: Number.POSITIVE_INFINITY,
        },
      ],
      [{ skillId: 'nestjs', level: Number.NaN }],
    );

    expect(result.score).toBe(0);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.missingSkills).toEqual(['NestJS']);
  });
});
