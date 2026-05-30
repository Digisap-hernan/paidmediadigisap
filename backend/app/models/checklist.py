from typing import Optional
from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime, Boolean, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Checklist(Base):
    __tablename__ = "checklists"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="incomplete", nullable=False)
    completion_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    campaign = relationship("Campaign", back_populates="checklists")
    items = relationship(
        "ChecklistItem", back_populates="checklist", cascade="all, delete-orphan"
    )


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    checklist_id: Mapped[int] = mapped_column(ForeignKey("checklists.id", ondelete="CASCADE"))
    label: Mapped[str] = mapped_column(String(500), nullable=False)
    is_blocking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    evidence_text: Mapped[Optional[str ]] = mapped_column(Text, nullable=True)
    evidence_url: Mapped[Optional[str ]] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    checklist = relationship("Checklist", back_populates="items")
