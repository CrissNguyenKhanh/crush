import axios from '../config/interceptor';

export type MatchingRecommendationStatus =
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ALLOCATED';

export interface MatchingTarget {
  id: string;
  name: string;
  pm?: { id: string; fullName: string };
  sprints?: Array<{ id: string; name?: string; status: string }>;
}

export interface MatchingRecommendation {
  id: string;
  status: MatchingRecommendationStatus;
  note: string;
  decisionNote?: string | null;
  createdAt: string;
  employee: { id: string; fullName: string; title?: string };
  project: { id: string; name: string };
  sprint?: { id: string; name?: string } | null;
  skill?: { id: string; name: string } | null;
  hr?: { id: string; fullName: string };
}

export const matchingRecommendationsApi = {
  getTargets: () =>
    axios.get<IBackendRes<MatchingTarget[]>>('/matching-recommendations/targets') as unknown as Promise<IBackendRes<MatchingTarget[]>>,
  getHrMine: () =>
    axios.get<IBackendRes<MatchingRecommendation[]>>('/matching-recommendations/hr') as unknown as Promise<IBackendRes<MatchingRecommendation[]>>,
  getPmMine: () =>
    axios.get<IBackendRes<MatchingRecommendation[]>>('/matching-recommendations/pm') as unknown as Promise<IBackendRes<MatchingRecommendation[]>>,
  create: (data: {
    employeeId: string;
    projectId: string;
    sprintId?: string;
    skillId?: string;
    note: string;
  }) => axios.post('/matching-recommendations', data),
  decide: (
    id: string,
    data: { status: 'ACCEPTED' | 'REJECTED'; decisionNote?: string },
  ) => axios.patch(`/matching-recommendations/${id}/status`, data),
};
