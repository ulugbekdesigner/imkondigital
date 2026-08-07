"""Grant demo uchun realistik namuna ma'lumotlar — 30 foydalanuvchi, 10 kurs,
6 vakansiya, 3 xayriya loyihasi. Lorem ipsum yo'q — barchasi haqiqiy
o'zbekcha ism/mazmun bilan.

Ishga tushirish (konteyner ichida): python -m app.scripts.seed_demo
Idempotent EMAS — faqat bo'sh/demo bazada bir marta ishga tushirish uchun
mo'ljallangan (telefon raqamlari band bo'lsa xato beradi).
"""

import asyncio
import random
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.core.usernames import random_suffix, slugify_username
from app.models.course import Course, CourseCategory, CourseModule, Enrollment, Lesson
from app.models.donation import DonationProject
from app.models.employer import Company, CompanyMember, Vacancy
from app.models.enums import (
    CourseStatus,
    DonationProjectStatus,
    EmploymentType,
    EnrollmentStatus,
    LessonStatus,
    RoleCode,
    VacancyStatus,
    WorkFormat,
)
from app.models.user import Region, Role, User, UserRole
from app.modules.courses.service import slugify as course_slugify

FIRST_NAMES_M = [
    "Aziz",
    "Bekzod",
    "Davron",
    "Elyor",
    "Farrux",
    "Jasur",
    "Kamron",
    "Muhammadali",
    "Nodir",
    "Otabek",
    "Rustam",
    "Sardor",
    "Timur",
    "Ulug'bek",
    "Xurshid",
]
FIRST_NAMES_F = [
    "Dilnoza",
    "Feruza",
    "Gulnora",
    "Kamola",
    "Laylo",
    "Madina",
    "Nigora",
    "Sevinch",
    "Shahnoza",
    "Zarina",
    "Malika",
    "Nilufar",
    "Ozoda",
    "Sabina",
    "Yulduz",
]
LAST_NAMES = [
    "Karimov",
    "Yusupov",
    "Rashidov",
    "Toshmatov",
    "Ergashev",
    "Nazarov",
    "Xolmatov",
    "Saidov",
    "Abdullayev",
    "Islomov",
    "Qodirov",
    "Mirzayev",
    "Fayzullayev",
    "Rahimov",
    "Sultonov",
]
REGION_NAMES = [
    "Toshkent shahri",
    "Toshkent viloyati",
    "Samarqand viloyati",
    "Farg'ona viloyati",
    "Andijon viloyati",
    "Buxoro viloyati",
    "Namangan viloyati",
    "Qashqadaryo viloyati",
]


async def get_role_id(db: AsyncSession, code: RoleCode) -> int:
    row = (await db.execute(select(Role).where(Role.code == code.value))).scalar_one()
    return row.id


async def get_region_ids(db: AsyncSession) -> list[int | None]:
    rows = (
        (await db.execute(select(Region).where(Region.name.in_(REGION_NAMES)))).scalars().all()
    )
    ids: list[int | None] = [r.id for r in rows]
    return ids or [None]


async def create_user(
    db: AsyncSession, *, full_name: str, phone: str, role_ids: dict[str, int], roles: list[str]
) -> User:
    user = User(
        phone=phone,
        full_name=full_name,
        username=f"{slugify_username(full_name)}_{random_suffix()}",
        password_hash=hash_password("demo12345"),
        status="active",
    )
    db.add(user)
    await db.flush()
    for code in roles:
        db.add(UserRole(user_id=user.id, role_id=role_ids[code]))
    return user


async def seed_users(db: AsyncSession) -> dict[str, list[User]]:
    role_codes = [
        RoleCode.USER,
        RoleCode.INSTRUCTOR,
        RoleCode.EMPLOYER,
        RoleCode.DONOR,
        RoleCode.MODERATOR,
    ]
    role_ids = {code.value: await get_role_id(db, code) for code in role_codes}

    students: list[User] = []
    instructors: list[User] = []
    employers: list[User] = []
    donors: list[User] = []

    used_phones: set[str] = set()

    def next_phone() -> str:
        while True:
            p = f"+9989{random.randint(10000000, 99999999)}"
            if p not in used_phones:
                used_phones.add(p)
                return p

    # 5 ustoz
    instructor_names = [
        "Dilnoza Karimova",
        "Sardor Yusupov",
        "Nigora Rashidova",
        "Otabek Toshmatov",
        "Malika Ergasheva",
    ]
    for name in instructor_names:
        u = await create_user(
            db,
            full_name=name,
            phone=next_phone(),
            role_ids=role_ids,
            roles=[RoleCode.USER.value, RoleCode.INSTRUCTOR.value],
        )
        instructors.append(u)

    # 3 ish beruvchi
    employer_names = ["Bekzod Nazarov", "Feruza Xolmatova", "Rustam Saidov"]
    for name in employer_names:
        u = await create_user(
            db,
            full_name=name,
            phone=next_phone(),
            role_ids=role_ids,
            roles=[RoleCode.USER.value, RoleCode.EMPLOYER.value],
        )
        employers.append(u)

    # 2 donor
    donor_names = ["Kamola Abdullayeva", "Jasur Islomov"]
    for name in donor_names:
        u = await create_user(
            db,
            full_name=name,
            phone=next_phone(),
            role_ids=role_ids,
            roles=[RoleCode.USER.value, RoleCode.DONOR.value],
        )
        donors.append(u)

    # 20 oddiy o'quvchi
    used_names: set[str] = set()
    for _ in range(20):
        while True:
            first = random.choice(FIRST_NAMES_M + FIRST_NAMES_F)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            if name not in used_names:
                used_names.add(name)
                break
        u = await create_user(
            db,
            full_name=name,
            phone=next_phone(),
            role_ids=role_ids,
            roles=[RoleCode.USER.value],
        )
        students.append(u)

    await db.flush()
    return {
        "students": students,
        "instructors": instructors,
        "employers": employers,
        "donors": donors,
    }


COURSE_SEED = [
    # (title, category_key, step, is_free, price, lessons)
    ("Kompyuter savodxonligi asoslari", "E", 1, True, 0, [
        "Kompyuter va operatsion tizim bilan tanishuv",
        "Fayllar va papkalar bilan ishlash",
        "Internetdan xavfsiz foydalanish",
    ]),
    ("Tikuvchilik va bichish", "A", 1, True, 0, [
        "Tikuv mashinasi bilan tanishuv",
        "Oddiy ko'ylak bichish",
        "Birinchi buyumni tikish",
    ]),
    ("Pazandachilik: milliy taomlar", "B", 1, False, 45000, [
        "Osh tayyorlash siri",
        "Somsa va noz-neamatlar",
        "Milliy shirinliklar",
    ]),
    ("Data entry va matn terish", "E", 1, True, 0, [
        "Klaviaturada tez terish",
        "Excel jadval asoslari",
        "Onlayn platformalarda ishlash",
    ]),
    ("Grafik dizayn va SMM", "F", 2, False, 120000, [
        "Figma bilan tanishuv",
        "Ijtimoiy tarmoq posti yaratish",
        "Brend uchun logotip",
        "Portfolio tayyorlash",
    ]),
    ("Video montaj asoslari", "F", 2, False, 90000, [
        "Video montaj dasturi bilan tanishuv",
        "Kesish va o'tish effektlari",
        "Ovoz va musiqa qo'shish",
    ]),
    ("Veb-dasturlash: boshlang'ich", "G", 3, False, 250000, [
        "HTML va CSS asoslari",
        "JavaScript bilan tanishuv",
        "Birinchi veb-sahifa",
        "Responsiv dizayn",
    ]),
    ("Data tahlil va Excel", "G", 3, False, 180000, [
        "Excel formulalar",
        "Ma'lumotlarni tahlil qilish",
        "Hisobot tayyorlash",
    ]),
    ("Kichik biznes asoslari", "H", 4, True, 0, [
        "G'oyadan bizneskacha",
        "Narx belgilash strategiyasi",
        "Mijozlar bilan ishlash",
    ]),
    ("Telefon va texnika ta'miri", "D", 1, False, 60000, [
        "Asosiy asboblar bilan tanishuv",
        "Ekran almashtirish",
        "Batareya diagnostikasi",
    ]),
]


async def seed_courses(db: AsyncSession, instructors: list[User]) -> list[Course]:
    categories = {c.key: c for c in (await db.execute(select(CourseCategory))).scalars().all()}
    courses: list[Course] = []
    for i, (title, cat_key, step, is_free, price, lesson_titles) in enumerate(COURSE_SEED):
        instructor = instructors[i % len(instructors)]
        course = Course(
            instructor_id=instructor.id,
            category_id=categories[cat_key].id if cat_key in categories else None,
            title=title,
            slug=course_slugify(title),
            description=(
                f"{title} — amaliy mashg'ulotlar va real topshiriqlar bilan. "
                "Kurs oxirida sertifikat olasiz."
            ),
            ladder_step=step,
            price=price,
            is_free=is_free,
            status=CourseStatus.PUBLISHED,
            rating=round(random.uniform(4.2, 5.0), 1),
            students_count=0,
        )
        db.add(course)
        await db.flush()

        module = CourseModule(course_id=course.id, title="1-modul", sort=0)
        db.add(module)
        await db.flush()

        for j, lesson_title in enumerate(lesson_titles):
            db.add(
                Lesson(
                    module_id=module.id,
                    title=lesson_title,
                    description=f"{lesson_title} haqida video darslik.",
                    duration=random.randint(300, 900),
                    status=LessonStatus.DRAFT,
                    sort=j,
                )
            )
        courses.append(course)
    await db.flush()
    return courses


async def seed_enrollments(
    db: AsyncSession, students: list[User], courses: list[Course]
) -> None:
    for course in courses:
        enrolled_students = random.sample(students, k=min(len(students), random.randint(3, 9)))
        for student in enrolled_students:
            progress = random.choice([15, 30, 45, 60, 80, 100])
            db.add(
                Enrollment(
                    user_id=student.id,
                    course_id=course.id,
                    progress_pct=progress,
                    status=(
                        EnrollmentStatus.COMPLETED
                        if progress == 100
                        else EnrollmentStatus.ACTIVE
                    ),
                    completed_at=datetime.now(UTC) if progress == 100 else None,
                )
            )
            course.students_count += 1
    await db.flush()


COMPANY_SEED = [
    ("TezYetkaz Logistika", 45),
    ("Alfa Telekom Servis", 120),
    ("Oson IT Solutions", 18),
]

VACANCY_SEED = [
    # (company_idx, title, step, work_format, employment_type, salary_from, salary_to, skills)
    (
        0,
        "Call-markaz operatori",
        1,
        WorkFormat.REMOTE,
        EmploymentType.FULL_TIME,
        2500000,
        3500000,
        ["Muloqot", "Telefon savodxonligi"],
    ),
    (
        0,
        "Data entry mutaxassisi",
        1,
        WorkFormat.REMOTE,
        EmploymentType.PART_TIME,
        1800000,
        2500000,
        ["Excel", "Diqqat"],
    ),
    (
        1,
        "SMM menejeri",
        2,
        WorkFormat.REMOTE,
        EmploymentType.FULL_TIME,
        3500000,
        5000000,
        ["SMM", "Grafik dizayn"],
    ),
    (
        1,
        "Grafik dizayner",
        2,
        WorkFormat.HYBRID,
        EmploymentType.PROJECT,
        4000000,
        6000000,
        ["Figma", "Adobe Photoshop"],
    ),
    (
        2,
        "Junior frontend dasturchi",
        3,
        WorkFormat.REMOTE,
        EmploymentType.FULL_TIME,
        6000000,
        9000000,
        ["HTML", "CSS", "JavaScript"],
    ),
    (
        2,
        "Data tahlilchi",
        3,
        WorkFormat.HYBRID,
        EmploymentType.FULL_TIME,
        7000000,
        10000000,
        ["Excel", "SQL"],
    ),
]


async def seed_employer_data(
    db: AsyncSession, employers: list[User], region_ids: list[int | None]
) -> None:
    companies: list[Company] = []
    for i, (name, emp_count) in enumerate(COMPANY_SEED):
        company = Company(
            name=name,
            description=(
                f"{name} — O'zbekistonda inklyuziv ish o'rinlarini "
                "qo'llab-quvvatlovchi kompaniya."
            ),
            employee_count=emp_count,
            verified=True,
            inclusive_rating=round(random.uniform(3.5, 5.0), 1),
        )
        db.add(company)
        await db.flush()
        db.add(
            CompanyMember(
                company_id=company.id, user_id=employers[i % len(employers)].id, role="owner"
            )
        )
        companies.append(company)
    await db.flush()

    for company_idx, title, step, work_format, emp_type, sfrom, sto, skills in VACANCY_SEED:
        db.add(
            Vacancy(
                company_id=companies[company_idx].id,
                title=title,
                description=(
                    f"{title} lavozimiga nogironligi bor insonlar uchun "
                    "moslashtirilgan sharoitlar bilan taklif qilamiz."
                ),
                ladder_step=step,
                work_format=work_format,
                employment_type=emp_type,
                salary_from=sfrom,
                salary_to=sto,
                region_id=random.choice(region_ids),
                skills_required=skills,
                status=VacancyStatus.PUBLISHED,
            )
        )
    await db.flush()


DONATION_SEED = [
    (
        "Xorazmlik 20 ayolga SMM kursi",
        "Xorazm viloyatidagi 20 nafar ayolga ijtimoiy tarmoqlarni boshqarish va SMM asoslarini "
        "o'rgatish orqali ularga uydan turib daromad topish imkonini beramiz.",
        15_000_000,
        8_400_000,
    ),
    (
        "10 ta noutbuk granti",
        "Moliyaviy imkoniyati cheklangan, lekin IT sohasida rivojlanishni xohlaydigan 10 nafar "
        "iqtidorli o'quvchiga noutbuk grantlari beramiz.",
        35_000_000,
        12_000_000,
    ),
    (
        "Imo-ishora tili kutubxonasi",
        "Eshitish qobiliyati cheklangan foydalanuvchilar uchun video darslarga imo-ishora tili "
        "tarjimasi qo'shish loyihasi — bilim hammaga teng ochiq bo'lishi kerak.",
        20_000_000,
        4_500_000,
    ),
]


async def seed_donations(db: AsyncSession, donors: list[User]) -> None:
    for i, (title, story, target, collected) in enumerate(DONATION_SEED):
        db.add(
            DonationProject(
                owner_id=donors[i % len(donors)].id,
                title=title,
                story=story,
                target_amount=target,
                collected_amount=collected,
                deadline=date.today() + timedelta(days=45),
                status=DonationProjectStatus.ACTIVE,
                report="",
            )
        )
    await db.flush()


async def main() -> None:
    async with SessionLocal() as db:
        print("Foydalanuvchilar yaratilmoqda...")
        users = await seed_users(db)
        print(
            f"  {len(users['students'])} o'quvchi, {len(users['instructors'])} ustoz, "
            f"{len(users['employers'])} ish beruvchi, {len(users['donors'])} donor"
        )

        print("Kurslar yaratilmoqda...")
        courses = await seed_courses(db, users["instructors"])
        print(f"  {len(courses)} kurs")

        print("Ro'yxatlar (enrollments) yaratilmoqda...")
        await seed_enrollments(db, users["students"], courses)

        region_ids = await get_region_ids(db)
        print("Kompaniyalar va vakansiyalar yaratilmoqda...")
        await seed_employer_data(db, users["employers"], region_ids)
        print(f"  {len(COMPANY_SEED)} kompaniya, {len(VACANCY_SEED)} vakansiya")

        print("Xayriya loyihalari yaratilmoqda...")
        await seed_donations(db, users["donors"])
        print(f"  {len(DONATION_SEED)} loyiha")

        await db.commit()
        print("Tayyor! Barcha demo ma'lumotlar bazaga yozildi.")
        print("Demo parol (barcha yangi foydalanuvchilar uchun): demo12345")


if __name__ == "__main__":
    asyncio.run(main())
