from typing import Optional
from datetime import datetime, date
from sqlalchemy import ForeignKey, String, DateTime, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[Optional[int ]] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=True
    )
    campaign_id: Mapped[Optional[int ]] = mapped_column(
        ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="todo", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    due_date: Mapped[Optional[date ]] = mapped_column(Date, nullable=True)
    assignee_id: Mapped[Optional[int ]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    client = relationship("Client", back_populates="tasks")
    campaign = relationship("Campaign", back_populates="tasks")
