export interface MatchingRequirement {
  identifier: string;
  label: string;
  minLevel: number;
  weight: number;
}

export interface MatchingUserSkill {
  skillId: string;
  level: number;
}

export const calculateWeightedSkillMatch = (
  requirements: MatchingRequirement[],
  userSkills: MatchingUserSkill[],
) => {
  const finiteOr = (value: unknown, fallback: number) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  const totalWeight = requirements.reduce(
    (sum, requirement) => sum + Math.max(1, finiteOr(requirement.weight, 1)),
    0,
  );

  if (totalWeight === 0) {
    return { score: 0, matchedSkills: [], missingSkills: [] };
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let matchedWeight = 0;

  for (const requirement of requirements) {
    const userSkill = userSkills.find(
      (skill) => skill.skillId === requirement.identifier,
    );

    if (!userSkill) {
      missingSkills.push(requirement.label);
      continue;
    }

    const level = Math.max(0, finiteOr(userSkill.level, 0));
    const requiredLevel = Math.max(1, finiteOr(requirement.minLevel, 1));
    const weight = Math.max(1, finiteOr(requirement.weight, 1));
    matchedWeight += weight * Math.min(1, level / requiredLevel);

    if (level >= requiredLevel) matchedSkills.push(requirement.label);
    else missingSkills.push(requirement.label);
  }

  return {
    score: Math.max(
      0,
      Math.min(100, Math.round((matchedWeight / totalWeight) * 100)),
    ),
    matchedSkills,
    missingSkills,
  };
};
