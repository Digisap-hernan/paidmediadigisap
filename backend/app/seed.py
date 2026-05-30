"""Seed script: populate the database with demo data for the MVP.

Run with:
    python -m app.seed
"""
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.database import Base, SessionLocal, engine
from app.models.campaign import Campaign
from app.models.changelog import ChangelogEntry
from app.models.checklist import Checklist, ChecklistItem
from app.models.client import Client
from app.models.incident import Incident
from app.models.task import Task
from app.models.user import User
from app.models.workspace import Workspace
from app.services.qa import create_checklist_from_template, recompute_checklist_status
from app.services.health_score import refresh_campaign_health


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed(db: Session) -> None:
    # Users
    u1 = User(name="Andrés Paid Lead", email="andres@digisap.com")
    u2 = User(name="Hernán Strategist", email="hernan@digisap.com")
    db.add_all([u1, u2])
    db.flush()

    # Clients
    c1 = Client(
        name="Clínica Smile",
        industry="Healthcare",
        status="active",
        service_type="Lead Gen",
        reporting_frequency="weekly",
    )
    c2 = Client(
        name="EcoMarket",
        industry="Retail",
        status="active",
        service_type="Lead Gen + Performance",
        reporting_frequency="biweekly",
    )
    db.add_all([c1, c2])
    db.flush()

    # Workspaces
    w1 = Workspace(client_id=c1.id, owner_id=u1.id, notes="Workspace Clínica Smile")
    w2 = Workspace(client_id=c2.id, owner_id=u2.id, notes="Workspace EcoMarket")
    db.add_all([w1, w2])
    db.flush()

    # Campaigns
    today = date.today()
    camp1 = Campaign(
        workspace_id=w1.id,
        name="Smile - Meta Leads MX - 2026Q2",
        platform="meta",
        campaign_type="META_LEADGEN",
        objective="lead_gen",
        budget_total=2500.0,
        start_date=today,
        end_date=today + timedelta(days=30),
        stage="build",
        owner_id=u1.id,
        status="active",
        health_score=100,
    )
    camp2 = Campaign(
        workspace_id=w1.id,
        name="Smile - Google Search MX - 2026Q2",
        platform="google_ads",
        campaign_type="GADS_SEARCH_LEADGEN",
        objective="lead_gen",
        budget_total=1800.0,
        start_date=today,
        end_date=today + timedelta(days=30),
        stage="qa",
        owner_id=u1.id,
        status="active",
        health_score=100,
    )
    camp3 = Campaign(
        workspace_id=w2.id,
        name="EcoMarket - Meta Leads CO - 2026Q2",
        platform="meta",
        campaign_type="META_LEADGEN",
        objective="lead_gen",
        budget_total=3200.0,
        start_date=today - timedelta(days=10),
        end_date=today + timedelta(days=45),
        stage="operate",
        owner_id=u2.id,
        status="active",
        health_score=100,
    )
    db.add_all([camp1, camp2, camp3])
    db.flush()

    # Checklists for each campaign
    for camp in (camp1, camp2, camp3):
        create_checklist_from_template(db, camp.id, camp.campaign_type, "build")
        create_checklist_from_template(db, camp.id, camp.campaign_type, "qa")

    db.flush()

    # Mark some checklist items as done to show progress
    # camp2 (qa stage) - mark most build items done, half qa items done
    for camp, build_pct, qa_pct in [
        (camp1, 0.4, 0.0),
        (camp2, 1.0, 0.5),
        (camp3, 1.0, 1.0),
    ]:
        build = (
            db.query(Checklist)
            .filter(Checklist.campaign_id == camp.id, Checklist.type == "build")
            .first()
        )
        qa = (
            db.query(Checklist)
            .filter(Checklist.campaign_id == camp.id, Checklist.type == "qa")
            .first()
        )
        if build:
            items = build.items
            n = int(len(items) * build_pct)
            for it in items[:n]:
                it.status = "done"
            recompute_checklist_status(build)
        if qa:
            items = qa.items
            n = int(len(items) * qa_pct)
            for it in items[:n]:
                it.status = "done"
            recompute_checklist_status(qa)

    db.flush()

    # Incidents
    inc1 = Incident(
        client_id=c1.id,
        campaign_id=camp2.id,
        title="Conversiones de Google Ads no se reciben",
        description="Las conversiones importadas no han recibido señales en las últimas 24h.",
        severity="high",
        status="investigating",
        owner_id=u1.id,
        opened_at=datetime.utcnow() - timedelta(hours=6),
        target_resolution_at=datetime.utcnow() + timedelta(hours=12),
    )
    inc2 = Incident(
        client_id=c2.id,
        campaign_id=camp3.id,
        title="CPL por encima del objetivo",
        description="El CPL subió 35% en los últimos 3 días, revisar segmentación y creativos.",
        severity="medium",
        status="new",
        owner_id=u2.id,
        opened_at=datetime.utcnow() - timedelta(days=1),
    )
    inc3 = Incident(
        client_id=c1.id,
        campaign_id=None,
        title="Cliente solicita nuevo landing page",
        description="Requiere ajustes generales no asociados a una campaña.",
        severity="low",
        status="new",
        owner_id=u1.id,
        opened_at=datetime.utcnow() - timedelta(days=2),
    )
    db.add_all([inc1, inc2, inc3])

    # Tasks
    tasks = [
        Task(
            client_id=c1.id,
            campaign_id=camp1.id,
            title="Subir creativos aprobados al ads manager",
            status="in_progress",
            priority="high",
            due_date=today + timedelta(days=2),
            assignee_id=u1.id,
        ),
        Task(
            client_id=c1.id,
            campaign_id=camp2.id,
            title="Verificar conversiones en Tag Assistant",
            status="todo",
            priority="critical",
            due_date=today - timedelta(days=1),
            assignee_id=u1.id,
        ),
        Task(
            client_id=c2.id,
            campaign_id=camp3.id,
            title="Optimizar audiencias frías - próximo sprint",
            status="todo",
            priority="medium",
            due_date=today + timedelta(days=7),
            assignee_id=u2.id,
        ),
        Task(
            client_id=c2.id,
            campaign_id=camp3.id,
            title="Preparar reporte quincenal",
            status="todo",
            priority="medium",
            due_date=today + timedelta(days=4),
            assignee_id=u2.id,
        ),
    ]
    db.add_all(tasks)

    # Changelog entries
    cl_entries = [
        ChangelogEntry(
            campaign_id=camp3.id,
            change_type="budget",
            description="Incremento de presupuesto diario de $80 a $110",
            hypothesis="Hay más demanda los lunes y martes",
            expected_impact="+15% leads sin perder CPL",
            created_by=u2.id,
        ),
        ChangelogEntry(
            campaign_id=camp3.id,
            change_type="creative",
            description="Reemplazo de creativo principal por uno con testimonio",
            hypothesis="Aumentará CTR y reducirá CPL",
            expected_impact="-10% CPL",
            created_by=u2.id,
        ),
        ChangelogEntry(
            campaign_id=camp2.id,
            change_type="keywords",
            description="Pausadas 12 keywords broad con CPA alto",
            hypothesis="Estaban canibalizando inversión",
            expected_impact="Mejorar CPA global",
            created_by=u1.id,
        ),
    ]
    db.add_all(cl_entries)

    db.flush()

    # Refresh health on all campaigns
    for camp in (camp1, camp2, camp3):
        refresh_campaign_health(camp, db)

    db.commit()
    print("Seed completed.")
    print(f"  Users: 2 | Clients: 2 | Workspaces: 2 | Campaigns: 3")
    print(f"  Incidents: 3 | Tasks: {len(tasks)} | Changelog entries: {len(cl_entries)}")


def main() -> None:
    print("Resetting database schema...")
    reset_database()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
