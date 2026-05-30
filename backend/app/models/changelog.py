from typing import Optional
from datetime import datetime
from sqlalchemy import ForeignKey, String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChangelogEntry(Base):
    __tablename__ = "changelog_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"))
    change_type: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    hypothesis: Mapped[Optional[str ]] = mapped_column(Text, nullable=True)
    expected_impact: Mapped[Optional[str ]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[int ]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    campaign = relationship("Campaign", back_populates="changelog_entries")
