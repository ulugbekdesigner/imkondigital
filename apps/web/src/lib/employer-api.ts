import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type {
  ApplicantOut,
  ApplicationOut,
  BlindTaskSubmissionOut,
  Company,
  CompanyStats,
  EmployerPublicStatsOut,
  VacancyDetail,
  VacancyPage,
  VacancyTaskOut,
} from './types';

export async function getVacancyCatalog(params: {
  step?: number;
  workFormat?: string;
  regionId?: number;
  minSalary?: number;
}): Promise<VacancyPage> {
  const search = new URLSearchParams();
  if (params.step !== undefined) search.set('step', String(params.step));
  if (params.workFormat) search.set('work_format', params.workFormat);
  if (params.regionId !== undefined) search.set('region_id', String(params.regionId));
  if (params.minSalary !== undefined) search.set('min_salary', String(params.minSalary));

  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/vacancies?${search.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return { items: [], next_cursor: null };
  return (await res.json()) as VacancyPage;
}

export async function getVacancy(id: number): Promise<VacancyDetail | null> {
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/vacancies/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as VacancyDetail;
}

export async function getMyApplications(): Promise<ApplicationOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/applications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as ApplicationOut[];
}

export async function getMyCompanies(): Promise<Company[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/companies`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as Company[];
}

export async function getVerifiedCompanies(): Promise<Company[]> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/companies/verified`, {
    next: { revalidate: 300 },
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as Company[];
}

export async function getEmployerPublicStats(): Promise<EmployerPublicStatsOut | null> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/employer/public-stats`, {
    next: { revalidate: 300 },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as EmployerPublicStatsOut;
}

export async function getMyVacancies(
  companyId: number,
): Promise<{ id: number; title: string; status: string }[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/companies/${companyId}/vacancies`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as { id: number; title: string; status: string }[];
}

export async function getCompanyStats(companyId: number): Promise<CompanyStats | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/companies/${companyId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as CompanyStats;
}

/** Vakansiyani egasi sifatida ko'radi — /vacancies/{id} farqli, statusdan
 * qat'i nazar (qoralama/yopilgan vakansiya arizachilar sahifasida kerak). */
export async function getOwnedVacancy(
  vacancyId: number,
): Promise<{ id: number; title: string; status: string; task: VacancyTaskOut | null } | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/vacancies/${vacancyId}/owner`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as {
    id: number;
    title: string;
    status: string;
    task: VacancyTaskOut | null;
  };
}

export async function getApplicants(vacancyId: number): Promise<ApplicantOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/vacancies/${vacancyId}/applicants`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as ApplicantOut[];
}

export async function getTaskSubmissions(vacancyId: number): Promise<BlindTaskSubmissionOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/vacancies/${vacancyId}/task-submissions`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as BlindTaskSubmissionOut[];
}
