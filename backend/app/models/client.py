from typing import Optional
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[Optional[str ]] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    service_type: Mapped[Optional[str ]] = mapped_column(String(120), nullable=True)
    reporting_frequency: Mapped[Optional[str ]] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    workspaces = relationship("Workspace", back_populates="client", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="client", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="client", cascade="all, delete-orphan")
