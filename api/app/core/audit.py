"""Audit jurnali yozuvi — admin/moderator kritik amallarida chaqiriladi.

`write_audit_log` `db.flush()` qiladi, lekin commit qilmaydi — chaqiruvchi
o'z tranzaksiyasi ichida (asosiy amal bilan bir xil commit'da) yozadi.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def write_audit_log(
    db: AsyncSession,
    *,
    actor_id: int,
    action: str,
    target_type: str,
    target_id: str | int,
    meta: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            meta=meta or {},
        )
    )
    await db.flush()
