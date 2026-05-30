from typing import Optional
from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"))
    campaign_id: Mapped[Optional[int ]] = mapped_column(
        ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str ]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="new", nullable=False)
    owner_id: Mapped[Optional[int ]] = mapped_column(ForeignKey("users.id"), nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    target_resolution_at: Mapped[Optional[datetime ]] = mapped_column(DateTime, nullable=True)
    closed_at: Mapped[Optional[datetime ]] = mapped_column(DateTime, nullable=True)

    client = relationship("Client", back_populates="incidents")
    campaign = relationship("Campaign", back_populates="incidents")
