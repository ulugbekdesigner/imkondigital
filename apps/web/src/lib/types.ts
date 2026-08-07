/** Backend sxemalariga mos tiplar. */

export interface Me {
  id: number;
  phone: string;
  email: string | null;
  full_name: string;
  username: string;
  passport_visibility: 'public' | 'unlisted' | 'private';
  region_id: number | null;
  birth_date: string | null;
  gender: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  roles: string[];
  disability_verified_status: string | null;
  /** Raqamli Narvon pog'onasi (0-4) — Trajectory.current_step (15 bosqichli
   * "Trayektoriya") bilan ARALASHTIRMASLIK, ular butunlay boshqa ko'rsatkich. */
  ladder_step: number;
}

export interface DisabilityProfileOut {
  group_type: string | null;
  categories: string[];
  work_conditions: Record<string, unknown>;
  verified_status: string;
  verified_at: string | null;
  rejection_reason: string | null;
  doc_url: string | null;
}

export type StepStatus = 'done' | 'current' | 'locked';

export interface TrajectoryStep {
  number: number;
  phase: string;
  title: string;
  status: StepStatus;
}

export interface Trajectory {
  current_step: number;
  steps: TrajectoryStep[];
}

// --- Ta'lim Akademiyasi ---
export interface CourseCard {
  id: number;
  title: string;
  slug: string;
  description: string;
  ladder_step: number;
  is_free: boolean;
  price: number;
  cover_url: string | null;
  status: string;
  rating: number;
  students_count: number;
  income_success_rate: number | null;
  lessons_count: number;
  region_id: number | null;
  region_name: string | null;
  duration_weeks: number | null;
}

export interface LessonMaterialItem {
  id: number;
  title: string;
  file_url: string;
}

export interface LessonItem {
  id: number;
  title: string;
  description: string;
  hls_url: string | null;
  subtitle_url: string | null;
  transcript: string | null;
  duration: number | null;
  status: string;
  sort: number;
  materials: LessonMaterialItem[];
}

export interface AssignmentItem {
  id: number;
  title: string;
  description: string;
  sort: number;
}

export type QuizKind = 'module_check' | 'final_theory';

export interface QuizPublic {
  id: number;
  kind: QuizKind;
  title: string;
  pass_score_pct: number;
  time_limit_seconds: number | null;
  question_count: number;
}

export interface ModuleItem {
  id: number;
  title: string;
  sort: number;
  lessons: LessonItem[];
  assignments: AssignmentItem[];
  quiz: QuizPublic | null;
}

export interface CourseDetail extends CourseCard {
  trailer_url: string | null;
  instructor_name: string;
  final_exam_brief: string | null;
  final_quiz: QuizPublic | null;
  modules: ModuleItem[];
}

export interface CatalogPage {
  items: CourseCard[];
  next_cursor: number | null;
}

export interface Category {
  id: number;
  key: string;
  name: string;
  ladder_step: number;
}

export interface CourseCertificateSummary {
  uid: string;
  pdf_url: string | null;
  issued_at: string;
  confirmed_at: string | null;
}

export interface CourseProgress {
  enrolled: boolean;
  progress_pct: number;
  status: string | null;
  completed_lesson_ids: number[];
  locked_module_ids: number[];
  certificate: CourseCertificateSummary | null;
}

export interface LessonCompleteResult {
  lesson_id: number;
  progress_pct: number;
  course_completed: boolean;
  certificate_uid: string | null;
}

// --- Skills Passport ---
export interface Certificate {
  uid: string;
  course_id: number | null;
  course_title: string | null;
  pdf_url: string | null;
  qr_url: string | null;
  issued_at: string;
  confirmed_at: string | null;
  readiness_pct: number | null;
}

export interface PortfolioStep {
  id: number;
  caption: string;
  media_url: string;
  sort: number;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  media_urls: string[];
  source_type: 'manual' | 'submission';
  task: string;
  result: string;
  client_feedback: string | null;
  skills: string[];
  steps: PortfolioStep[];
  created_at: string;
}

export interface PortfolioItemUpdate {
  title?: string;
  description?: string;
  task?: string;
  result?: string;
  client_feedback?: string | null;
  skills?: string[];
}

export interface Passport {
  full_name: string;
  username: string;
  visibility: 'public' | 'unlisted' | 'private';
  region_name: string | null;
  member_since: string;
  certificates: Certificate[];
  portfolio: PortfolioItem[];
  generosity_tier: 'bronze' | 'silver' | 'gold' | null;
}

// --- Bandlik ---
export type WorkFormat = 'remote' | 'hybrid' | 'office';
export type EmploymentType = 'full_time' | 'part_time' | 'project';

export interface Company {
  id: number;
  name: string;
  inn: string | null;
  logo_url: string | null;
  description: string;
  employee_count: number | null;
  inclusive_rating: number;
  verified: boolean;
  quota_recommended: number | null;
}

export interface VacancyCard {
  id: number;
  title: string;
  company_name: string;
  company_verified: boolean;
  ladder_step: number;
  work_format: WorkFormat;
  employment_type: EmploymentType;
  salary_from: number | null;
  salary_to: number | null;
  region_name: string | null;
  status: string;
  created_at: string;
  match_score: number | null;
  is_inclusive: boolean;
}

export interface VacancyDetail extends VacancyCard {
  description: string;
  accommodations: Record<string, unknown>;
  skills_required: string[];
  company_id: number;
}

export interface VacancyPage {
  items: VacancyCard[];
  next_cursor: number | null;
}

export interface ApplicationOut {
  id: number;
  vacancy_id: number;
  vacancy_title: string;
  company_name: string;
  match_score: number;
  status: 'submitted' | 'viewed' | 'interview' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Placement {
  id: number;
  application_id: number;
  started_at: string;
  checkin_1w: boolean;
  checkin_1m: boolean;
  checkin_3m: boolean;
  stable_confirmed_at: string | null;
}

export interface ApplicantOut {
  id: number;
  user_id: number;
  full_name: string;
  username: string;
  match_score: number;
  status: string;
  created_at: string;
  ladder_step: number;
  portfolio_count: number;
  certificates_count: number;
  disability: { group_type: string | null; categories: string[] } | null;
  placement: Placement | null;
}

export interface CompanyStats {
  active_vacancies: number;
  new_applications: number;
  hired: number;
}

export interface EmployerPublicStatsOut {
  avg_days_to_hire: number | null;
  retention_3m_pct: number | null;
}

// --- Freelancer Marketplace ---
export interface GigCard {
  id: number;
  title: string;
  category: string;
  price_from: number;
  delivery_days: number;
  freelancer_id: number;
  freelancer_name: string;
  freelancer_username: string;
  freelancer_avatar_url: string | null;
  is_new_talent: boolean;
  average_rating: number | null;
  review_count: number;
}

export interface GigDetail extends GigCard {
  description: string;
}

export interface GigPage {
  items: GigCard[];
  next_cursor: number | null;
}

export interface MilestoneOut {
  id: number;
  title: string;
  amount: number;
  sort: number;
}

export interface OrderCard {
  id: number;
  title: string;
  amount: number;
  status: string;
  client_id: number;
  freelancer_id: number;
  client_name: string;
  freelancer_name: string;
  created_at: string;
}

export interface OrderDetail extends OrderCard {
  description: string;
  delivered_note: string | null;
  delivered_file_url: string | null;
  milestones: MilestoneOut[];
  payment_status: string | null;
}

export interface MessageOut {
  id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  file_url: string | null;
  created_at: string;
}

export interface CheckoutOut {
  provider: string;
  checkout_url: string;
}

// --- Imtiyozlar Markazi ---
export interface BenefitCard {
  id: number;
  title: string;
  category: string;
  provider_type: 'davlat' | 'kompaniya';
  audience: 'user' | 'employer';
  region_id: number | null;
  region_name: string | null;
  disability_categories: string[];
  status: string;
  is_relevant_to_me: boolean | null;
  is_saved: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface BenefitDetail extends BenefitCard {
  description: string;
  how_to_apply: string;
  external_url: string | null;
}

export interface BenefitPage {
  items: BenefitCard[];
}

// --- Notification Center ---
export type NotificationCategory = 'learning' | 'opportunity' | 'government';

export interface NotificationOut {
  id: number;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPage {
  items: NotificationOut[];
  unread_count: number;
}

export interface TelegramLinkCodeOut {
  code: string;
  bot_username: string;
  expires_in_minutes: number;
}

export interface TelegramLinkStatusOut {
  linked: boolean;
}

// --- AI qatlami ---
export interface CareerCoachMessageOut {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface GeneratedCvOut {
  content: string;
  pdf_url: string | null;
  generated_at: string;
}

export interface InterviewMessageOut {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface InterviewSessionCard {
  id: number;
  vacancy_id: number | null;
  vacancy_title: string | null;
  status: 'active' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export interface InterviewSessionDetail extends InterviewSessionCard {
  messages: InterviewMessageOut[];
}

export interface PlacementTestMessageOut {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface PlacementTestSessionCard {
  id: number;
  language: 'en' | 'ru';
  status: 'active' | 'completed';
  cefr_level: string | null;
  level_feedback: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PlacementTestSessionDetail extends PlacementTestSessionCard {
  messages: PlacementTestMessageOut[];
}

export interface CaseStoryMessageOut {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface CaseStorySessionCard {
  id: number;
  portfolio_item_id: number;
  portfolio_item_title: string;
  status: 'active' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export interface CaseStorySessionDetail extends CaseStorySessionCard {
  messages: CaseStoryMessageOut[];
}

// --- Ustoz (Mentor) kabineti ---
export interface MentorCard {
  id: number;
  full_name: string;
  username: string;
}

export interface MentorCheckinOut {
  id: number;
  note: string;
  created_at: string;
}

export interface MentorshipOut {
  id: number;
  mentor_id: number;
  mentor_name: string;
  mentee_id: number;
  mentee_name: string;
  mentee_ladder_step: number;
  message: string | null;
  status: 'pending' | 'active' | 'completed' | 'declined';
  requested_at: string;
  responded_at: string | null;
}

export interface MentorshipDetail extends MentorshipOut {
  checkins: MentorCheckinOut[];
}

// --- Moderatsiya ---
export interface DisabilityQueueItem {
  user_id: number;
  full_name: string;
  region_name: string | null;
  group_type: string | null;
  categories: string[];
  verified_status: string;
  submitted_at: string;
  doc_url: string | null;
}

// --- Admin panel ---
export interface AdminUserOut {
  id: number;
  phone: string;
  email: string | null;
  full_name: string;
  username: string;
  status: string;
  created_at: string;
  roles: string[];
  subscription_plan: 'free' | 'plus' | 'pro';
}

export interface AdminUserPage {
  items: AdminUserOut[];
  next_cursor: number | null;
}

export interface AdminUserStats {
  total: number;
  blocked: number;
}

export interface AuditLogOut {
  id: number;
  actor_id: number;
  actor_name: string;
  action: string;
  action_label: string;
  target_type: string;
  target_id: string;
  target_name: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogPage {
  items: AuditLogOut[];
  next_cursor: number | null;
}

export interface AdminCourseOut {
  id: number;
  title: string;
  slug: string;
  status: string;
  instructor_name: string;
  students_count: number;
}

export interface AdminDisputeOut {
  id: number;
  order_id: number;
  order_title: string;
  amount: number;
  opened_by_name: string;
  client_name: string;
  freelancer_name: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface AdminDisputePage {
  items: AdminDisputeOut[];
  next_cursor: number | null;
}

export interface AdminCoursePage {
  items: AdminCourseOut[];
  next_cursor: number | null;
}

export interface AdminCompanyOut {
  id: number;
  name: string;
  inn: string | null;
  employee_count: number | null;
  verified: boolean;
  vacancies_count: number;
  created_at: string;
}

export interface AdminCompanyPage {
  items: AdminCompanyOut[];
  next_cursor: number | null;
}

export interface AdminInstructorOut {
  id: number;
  full_name: string;
  phone: string;
  username: string;
  status: string;
  courses_count: number;
  published_courses_count: number;
  total_students: number;
  average_rating: number;
  generosity_tier: 'bronze' | 'silver' | 'gold' | null;
}

export interface AdminInstructorPage {
  items: AdminInstructorOut[];
  next_cursor: number | null;
}

export interface AdminInstructorCourseOut {
  id: number;
  title: string;
  slug: string;
  status: string;
  is_free: boolean;
  students_count: number;
  views_count: number;
  rating: number;
  completion_rate_pct: number;
  review_count: number;
}

export interface AdminInstructorDetail {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  username: string;
  status: string;
  created_at: string;
  generosity_tier: 'bronze' | 'silver' | 'gold' | null;
  courses: AdminInstructorCourseOut[];
}

// --- Donor dasturlari ---
export interface DonorProgramOut {
  id: number;
  donor_id: number;
  donor_name: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  enrolled_count: number;
  created_at: string;
}

export interface ProgramEnrollmentOut {
  id: number;
  program_id: number;
  user_id: number;
  applicant_name: string;
  region_name: string | null;
  ladder_step: number;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  decided_at: string | null;
}

// --- Analitika (anonim agregat) ---
export interface BucketStat {
  label: string;
  count: number | null;
}

export interface AdminOverview {
  total_users: number;
  active_users: number;
  verified_disability_profiles: number;
  published_courses: number;
  total_enrollments: number;
  completed_enrollments: number;
  published_vacancies: number;
  placements: number;
  active_gigs: number;
  paid_orders_volume: number;
  benefit_claims: number;
  active_mentorships: number;
}

export interface DailyBucket {
  date: string;
  count: number;
}

export interface RegistrationsDaily {
  days: DailyBucket[];
}

export interface DonorOverview {
  programs_count: number;
  total_applicants: number;
  approved_enrollees: number;
  completed_courses_among_enrollees: number;
  placements_among_enrollees: number;
  region_breakdown: BucketStat[];
  disability_group_breakdown: BucketStat[];
}

export interface GovOverview {
  total_students: number;
  total_employed: number;
  total_companies: number;
  region_coverage: number;
  total_verified_disability_profiles: number;
  employment_rate_pct: number;
  course_completion_rate_pct: number;
  marketplace_volume_som: number;
  benefit_claims: number;
  region_employment_breakdown: BucketStat[];
  region_breakdown: BucketStat[];
  disability_group_breakdown: BucketStat[];
}

// --- Ochiq Xayriya (V2-2) ---
export interface DonationProjectOut {
  id: number;
  owner_id: number;
  owner_name: string;
  title: string;
  story: string;
  target_amount: number;
  collected_amount: number;
  progress_pct: number;
  deadline: string | null;
  status: 'draft' | 'active' | 'funded' | 'completed';
  report: string;
  donors_count: number;
  created_at: string;
}

export interface DonateOut {
  donation_id: number;
  checkout_url: string;
}

export interface DonationOut {
  id: number;
  amount: number;
  donor_name: string | null;
  is_anonymous: boolean;
  status: string;
  created_at: string;
}

// --- O'quvchi kabineti 2.0 (V2-3) ---
export interface SubmissionOut {
  id: number;
  assignment_id: number;
  text: string;
  file_url: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  feedback: string | null;
  created_at: string;
}

export interface MySubmissionOut {
  id: number;
  assignment_id: number;
  assignment_title: string;
  course_id: number;
  course_title: string;
  course_slug: string;
  text: string;
  file_url: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  feedback: string | null;
  created_at: string;
}

export interface EnrollmentOut {
  id: number;
  course_id: number;
  progress_pct: number;
  status: string;
  started_at: string;
  completed_at: string | null;
}

export interface MyEnrollment {
  enrollment: EnrollmentOut;
  course_title: string;
  course_slug: string;
}

export interface CourseGalleryItem {
  id: number;
  title: string;
  description: string;
  media_urls: string[];
  student_name: string;
  student_username: string;
  created_at: string;
}

export interface QuizQuestionPublic {
  id: number;
  prompt: string;
  choices: string[];
}

export interface QuizQuestionOut extends QuizQuestionPublic {
  correct_index: number;
  points: number;
  sort: number;
}

export interface QuizDetailForInstructor extends QuizPublic {
  questions: QuizQuestionOut[];
}

export interface QuizAttemptStart {
  attempt_id: number;
  quiz_id: number;
  pass_score_pct: number;
  time_limit_seconds: number | null;
  started_at: string;
  questions: QuizQuestionPublic[];
}

export interface QuizAttemptResult {
  attempt_id: number;
  score_pct: number;
  passed: boolean;
  expired: boolean;
  pass_score_pct: number;
  review_lesson_titles: string[];
}

export interface FinalExamSubmissionOut {
  id: number;
  course_id: number;
  text: string;
  file_url: string | null;
  submitted_at: string;
}

export type AssessmentVerdict = 'ready' | 'needs_practice' | 'retake';

export interface SkillsAssessmentOut {
  id: number;
  course_id: number;
  ai_score_pct: number;
  ai_readiness_pct: number;
  ai_feedback: string;
  ai_verdict: AssessmentVerdict;
  mentor_verdict: AssessmentVerdict | null;
  mentor_feedback: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface FinalAssessmentStatus {
  final_quiz_passed: boolean;
  submission: FinalExamSubmissionOut | null;
  assessment: SkillsAssessmentOut | null;
}

export interface MentorReviewQueueItem {
  assessment: SkillsAssessmentOut;
  course_title: string;
  student_name: string;
  student_id: number;
}

export interface StudyBuddyMessageOut {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// --- 'Mening yo'lim' bosh sahifasi (V2-3) ---
export interface ActiveEnrollmentItem {
  course_id: number;
  course_title: string;
  course_slug: string;
  progress_pct: number;
}

export interface NextLessonItem {
  course_slug: string;
  course_title: string;
  lesson_id: number;
  lesson_title: string;
}

export interface MentorNoteItem {
  mentor_name: string;
  note: string;
  created_at: string;
}

export interface AssessmentResultItem {
  course_title: string;
  verdict: AssessmentVerdict;
  confirmed_at: string;
}

export interface LearningHomeOut {
  trajectory: Trajectory;
  active_enrollments: ActiveEnrollmentItem[];
  next_lesson: NextLessonItem | null;
  latest_mentor_note: MentorNoteItem | null;
  recent_assessment_results: AssessmentResultItem[];
}

// --- Ustoz Studiyasi 2.0 (V2-4) ---
export interface CourseReviewOut {
  id: number;
  course_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  instructor_reply: string | null;
  created_at: string;
}

export interface StudentProgressItem {
  user_id: number;
  full_name: string;
  progress_pct: number;
  status: string;
  last_activity_at: string;
  is_stuck: boolean;
}

export interface CourseStatsOut {
  views_count: number;
  students_count: number;
  completion_rate_pct: number;
  average_rating: number;
  review_count: number;
  most_dropped_lesson_title: string | null;
  most_dropped_lesson_pct: number | null;
  income_available: boolean;
}

export interface ImpactCertificateOut {
  pdf_url: string;
  total_students_helped: number;
  generated_at: string;
}

export interface InstructorStudentItem {
  user_id: number;
  full_name: string;
  course_id: number;
  course_title: string;
  progress_pct: number;
  status: string;
  last_activity_at: string;
  is_stuck: boolean;
}

export interface InstructorSubmissionItem {
  id: number;
  course_id: number;
  course_title: string;
  assignment_id: number;
  assignment_title: string;
  student_name: string;
  student_username: string;
  text: string;
  file_url: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  feedback: string | null;
  created_at: string;
}

export interface SubscriptionOut {
  plan: 'free' | 'plus' | 'pro';
  granted_by: 'admin' | 'stipend' | 'purchase' | null;
  started_at: string | null;
  expires_at: string | null;
}

export interface SubscriptionPricing {
  plus_price_som: number;
  pro_price_som: number;
}

export interface SubscriptionCheckoutOut {
  purchase_id: number;
  checkout_url: string;
}

export interface PeerSupportRoomOut {
  id: number;
  key: string;
  title: string;
  description: string;
}

export interface PeerSupportPostOut {
  id: number;
  room_id: number;
  author_id: number;
  author_name: string;
  body: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  is_own: boolean;
  created_at: string;
}

export interface LiveLessonOut {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  description: string;
  scheduled_at: string;
  meeting_url: string;
  is_past: boolean;
  created_at: string;
}

export interface InstructorReviewItem {
  id: number;
  course_id: number;
  course_title: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  instructor_reply: string | null;
  created_at: string;
}

export interface InstructorDashboardOut {
  new_students_today: number;
  ungraded_submissions_count: number;
  average_rating: number | null;
  oldest_ungraded: InstructorSubmissionItem[];
  courses_count: number;
  students_count: number;
  new_students_this_month: number;
  completion_rate_pct: number;
  most_dropped_lesson_title: string | null;
  most_dropped_lesson_pct: number | null;
  free_completions_count: number;
}

export interface StreakOut {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  active_today: boolean;
}

export interface Region {
  id: number;
  name: string;
  slug: string;
}

export interface RegionStats {
  open_vacancies: number;
  published_benefits: number;
  registered_users: number;
  placed_count: number;
}

export interface RegionCard extends Region {
  stats: RegionStats;
}

export interface RegionDetail extends RegionCard {
  vacancies_preview: VacancyCard[];
}

export interface SearchCourseHit {
  id: number;
  title: string;
  slug: string;
  is_free: boolean;
  ladder_step: number;
}

export interface SearchVacancyHit {
  id: number;
  title: string;
  company_name: string;
  match_score: number | null;
}

export interface SearchBenefitHit {
  id: number;
  title: string;
}

export interface SearchMaterialHit {
  id: number;
  title: string;
  course_slug: string;
  course_title: string;
}

export interface SearchResults {
  query: string;
  courses: SearchCourseHit[];
  vacancies: SearchVacancyHit[];
  benefits: SearchBenefitHit[];
  materials: SearchMaterialHit[];
}

export interface ExternalJobCard {
  id: number;
  source: string;
  title: string;
  title_uz: string | null;
  company_name: string;
  tags: string[];
  location_note: string | null;
  source_url: string;
  posted_at: string | null;
  ladder_step: number | null;
  match_score: number | null;
}

export interface ExternalJobDetail extends ExternalJobCard {
  description: string;
  description_uz: string | null;
}

export interface ExternalJobPage {
  items: ExternalJobCard[];
  next_cursor: number | null;
}

export interface ExternalJobSourceResult {
  source: string;
  fetched: number;
  created: number;
  updated: number;
  deactivated: number;
  translation_failures: number;
}

export interface ExternalJobSyncResult {
  sources: ExternalJobSourceResult[];
  synced_at: string;
}

export interface ExternalJobsSyncStatus {
  last_synced_at: string | null;
  active_count: number;
}

export interface SupportContent {
  id: number;
  title: string;
  topic: string;
  body_text: string;
  media_url: string | null;
  status: string;
  created_at: string;
}

export interface SupportResource {
  id: number;
  name: string;
  category: 'hotline' | 'psychologist' | 'ngo' | 'government';
  description: string;
  phone: string | null;
  url: string | null;
  audience_note: string | null;
  is_free: boolean;
  sort: number;
  status: string;
  created_at: string;
}
