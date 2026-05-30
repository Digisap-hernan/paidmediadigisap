from typing import Optional
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"))
    owner_id: Mapped[Optional[int ]] = mapped_column(ForeignKey("users.id"), nullable=True)
    notes: Mapped[Optional[str ]] = mapped_column(Text, nullable=True)

    client = relationship("Client", back_populates="workspaces")
    campaigns = relationship(
        "Campaign", back_populates="workspace", cascade="all, delete-orphan"
    )
