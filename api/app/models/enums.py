"""Domen enum'lari — DB'da String sifatida saqlanadi (migratsiya-do'st)."""

from enum import StrEnum


class RoleCode(StrEnum):
    USER = "user"
    INSTRUCTOR = "instructor"
    EMPLOYER = "employer"
    MENTOR = "mentor"
    DONOR = "donor"
    GOV = "gov"
    MODERATOR = "moderator"
    ADMIN = "admin"


class UserStatus(StrEnum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    BLOCKED = "blocked"


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"


class DisabilityGroup(StrEnum):
    """Nogironlik guruhi (O'zbekiston klassifikatsiyasi)."""

    GROUP_1 = "1"
    GROUP_2 = "2"
    GROUP_3 = "3"
    CHILD = "child"  # nogironligi bor bola


class VerifiedStatus(StrEnum):
    NONE = "none"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class CourseStatus(StrEnum):
    DRAFT = "draft"
    PENDING = "pending"  # moderatsiyada
    PUBLISHED = "published"
    ARCHIVED = "archived"


class LessonStatus(StrEnum):
    DRAFT = "draft"  # video hali yuklanmagan
    PROCESSING = "processing"  # transcode navbatda / jarayonda
    READY = "ready"  # HLS tayyor
    FAILED = "failed"  # transcode xato


class EnrollmentStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"


class SubmissionStatus(StrEnum):
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class PassportVisibility(StrEnum):
    """Digital Skills Passport maxfiylik darajasi (Vision Book 3.15)."""

    PUBLIC = "public"  # ochiq — qidiruvga ham ochiq
    UNLISTED = "unlisted"  # faqat havola bilan — indekslanmaydi
    PRIVATE = "private"  # faqat egasi ko'radi


class PortfolioSource(StrEnum):
    MANUAL = "manual"  # foydalanuvchi qo'lda qo'shgan
    SUBMISSION = "submission"  # tasdiqlangan topshiriqdan avtomatik


class WorkFormat(StrEnum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    OFFICE = "office"


class EmploymentType(StrEnum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    PROJECT = "project"


class VacancyStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class ApplicationStatus(StrEnum):
    SUBMITTED = "submitted"
    VIEWED = "viewed"
    INTERVIEW = "interview"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class CompanyMemberRole(StrEnum):
    OWNER = "owner"
    RECRUITER = "recruiter"


class GigStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"


class OrderStatus(StrEnum):
    """Escrow holat mashinasi — app/core/escrow.py da o'tishlar cheklanadi."""

    CREATED = "created"  # buyurtma yaratildi, to'lov kutilmoqda
    FUNDED = "funded"  # to'lov tasdiqlandi, pul escrow'da ushlab turiladi
    IN_PROGRESS = "in_progress"  # freelancer ishni boshladi
    DELIVERED = "delivered"  # freelancer natijani topshirdi
    ACCEPTED = "accepted"  # mijoz qabul qildi
    PAID = "paid"  # pul freelancerga chiqarildi (yakuniy)
    DISPUTED = "disputed"  # nizo ochilgan
    REFUNDED = "refunded"  # nizo mijoz foydasiga hal qilindi (yakuniy)
    CANCELLED = "cancelled"  # to'lovdan oldin bekor qilindi (yakuniy)


class DisputeStatus(StrEnum):
    OPEN = "open"
    RESOLVED_FREELANCER = "resolved_freelancer"
    RESOLVED_CLIENT = "resolved_client"


class PaymentProvider(StrEnum):
    PAYME = "payme"
    CLICK = "click"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class BenefitCategory(StrEnum):
    MOLIYAVIY = "moliyaviy"
    SOLIQ = "soliq"
    TRANSPORT = "transport"
    TALIM = "talim"
    BANDLIK = "bandlik"
    TIBBIY = "tibbiy"
    BOSHQA = "boshqa"


class BenefitAudience(StrEnum):
    USER = "user"  # nogironligi bor shaxsning o'ziga
    EMPLOYER = "employer"  # ish beruvchiga (masalan, soliq imtiyozi)


class BenefitProvider(StrEnum):
    DAVLAT = "davlat"
    KOMPANIYA = "kompaniya"


class BenefitStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"


class NotificationType(StrEnum):
    APPLICATION_STATUS = "application_status"
    ORDER_STATUS = "order_status"
    ORDER_MESSAGE = "order_message"
    CERTIFICATE_ISSUED = "certificate_issued"
    MENTORSHIP = "mentorship"
    INSTRUCTOR_MESSAGE = "instructor_message"
    SYSTEM = "system"
    BENEFIT_MATCH = "benefit_match"
    ASSIGNMENT_REVIEWED = "assignment_reviewed"
    STUDENT_PLACED = "student_placed"
    SUBSCRIPTION_ACTIVATED = "subscription_activated"
    SUBSCRIPTION_EXPIRING = "subscription_expiring"


class NotificationCategory(StrEnum):
    """Bildirishnoma paneli 3-tab'i (KENGAYISH_PLAN_3.md 2-bo'lim)."""

    LEARNING = "learning"  # Mening o'qishim
    OPPORTUNITY = "opportunity"  # Imkoniyatlar
    GOVERNMENT = "government"  # Davlat yangiliklari


class AiFeature(StrEnum):
    CAREER_COACH = "career_coach"
    CV_BUILDER = "cv_builder"
    INTERVIEW_COACH = "interview_coach"
    STUDY_BUDDY = "study_buddy"
    EXAM_GRADER = "exam_grader"
    ZIYO = "ziyo"
    CASE_STORY = "case_story"
    PLACEMENT_TEST = "placement_test"


class SubscriptionPlan(StrEnum):
    """FREE — sukut bo'yicha (qatorsiz), PLUS/PRO — Subscription qatori bilan."""

    FREE = "free"
    PLUS = "plus"
    PRO = "pro"


class SubscriptionGrantedBy(StrEnum):
    ADMIN = "admin"
    STIPEND = "stipend"
    PURCHASE = "purchase"


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"


class InterviewSessionStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"


class MentorshipStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    DECLINED = "declined"


class DonorProgramStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"


class ProgramEnrollmentStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class SuccessStoryStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"


class SupportResourceCategory(StrEnum):
    """Professional yo'naltirish — KENGAYISH_PLAN_3.md 7.1-bo'lim, 3-qatlam."""

    HOTLINE = "hotline"
    PSYCHOLOGIST = "psychologist"
    NGO = "ngo"
    GOVERNMENT = "government"


class DonationProjectStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    FUNDED = "funded"
    COMPLETED = "completed"


class QuizKind(StrEnum):
    MODULE_CHECK = "module_check"  # video dan keyingi mustahkamlash mini-testi
    FINAL_THEORY = "final_theory"  # yakuniy baholash nazariy testi (kurs darajasida)


class AssessmentVerdict(StrEnum):
    READY = "ready"  # mustaqil ishlashga tayyor
    NEEDS_PRACTICE = "needs_practice"  # amaliyot kerak
    RETAKE = "retake"  # kursni qayta ko'rish tavsiya
