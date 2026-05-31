"""Seed script: populate the database with rich demo data for the MVP.

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
    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    u1 = User(name="Andrés Paid Lead", email="andres@digisap.com")
    u2 = User(name="Hernán Strategist", email="hernan@digisap.com")
    u3 = User(name="Lucía Performance", email="lucia@digisap.com")
    db.add_all([u1, u2, u3])
    db.flush()

    # ------------------------------------------------------------------
    # Clients (3 - varied industries)
    # ------------------------------------------------------------------
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
    c3 = Client(
        name="CapitalSafe Finance",
        industry="Finance",
        status="active",
        service_type="Full Funnel + Brand",
        reporting_frequency="monthly",
    )
    db.add_all([c1, c2, c3])
    db.flush()

    # ------------------------------------------------------------------
    # Workspaces (4 - some clients have 2)
    # ------------------------------------------------------------------
    w1 = Workspace(client_id=c1.id, owner_id=u1.id, notes="Workspace Clínica Smile - LATAM")
    w2 = Workspace(client_id=c2.id, owner_id=u2.id, notes="Workspace EcoMarket - Colombia")
    w3 = Workspace(client_id=c2.id, owner_id=u3.id, notes="Workspace EcoMarket - México (expansión)")
    w4 = Workspace(client_id=c3.id, owner_id=u2.id, notes="Workspace CapitalSafe - Brand + Lead Gen")
    db.add_all([w1, w2, w3, w4])
    db.flush()

    # ------------------------------------------------------------------
    # Campaigns (7 - all platforms, varied stages)
    # ------------------------------------------------------------------
    today = date.today()

    # 1) Meta + build stage (Healthcare)
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
    # 2) Google Ads + qa stage (Healthcare)
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
    # 3) Meta + operate stage (Retail CO)
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
    # 4) Google Ads + launch stage (Retail MX)
    camp4 = Campaign(
        workspace_id=w3.id,
        name="EcoMarket - Google Performance Max MX",
        platform="google_ads",
        campaign_type="GADS_SEARCH_LEADGEN",
        objective="conversions",
        budget_total=4500.0,
        start_date=today - timedelta(days=2),
        end_date=today + timedelta(days=60),
        stage="launch",
        owner_id=u3.id,
        status="active",
        health_score=100,
    )
    # 5) LinkedIn + intake stage (Finance)
    camp5 = Campaign(
        workspace_id=w4.id,
        name="CapitalSafe - LinkedIn ABM Q3",
        platform="linkedin",
        campaign_type="LINKEDIN_LEADGEN",
        objective="lead_gen",
        budget_total=6000.0,
        start_date=today + timedelta(days=14),
        end_date=today + timedelta(days=90),
        stage="intake",
        owner_id=u2.id,
        status="active",
        health_score=100,
    )
    # 6) TikTok + operate stage (Retail CO) - awareness
    camp6 = Campaign(
        workspace_id=w2.id,
        name="EcoMarket - TikTok Awareness CO",
        platform="tiktok",
        campaign_type="TIKTOK_AWARENESS",
        objective="awareness",
        budget_total=2200.0,
        start_date=today - timedelta(days=20),
        end_date=today + timedelta(days=20),
        stage="operate",
        owner_id=u3.id,
        status="active",
        health_score=100,
    )
    # 7) Mixed (cross-platform) + operate stage (Finance) - the at-risk one
    camp7 = Campaign(
        workspace_id=w4.id,
        name="CapitalSafe - Mixed Performance Always-On",
        platform="mixed",
        campaign_type="MIXED_FULLFUNNEL",
        objective="conversions",
        budget_total=12000.0,
        start_date=today - timedelta(days=60),
        end_date=today + timedelta(days=120),
        stage="operate",
        owner_id=u2.id,
        status="active",
        health_score=100,
    )

    campaigns = [camp1, camp2, camp3, camp4, camp5, camp6, camp7]
    db.add_all(campaigns)
    db.flush()

    # ------------------------------------------------------------------
    # Checklists from templates
    # ------------------------------------------------------------------
    for camp in campaigns:
        create_checklist_from_template(db, camp.id, camp.campaign_type, "build")
        create_checklist_from_template(db, camp.id, camp.campaign_type, "qa")
    db.flush()

    # Set per-campaign progress (some 0%, some 100%, varied)
    # camp4 (launch stage) and camp3 (operate) must have qa = 100%
    # camp1 (build) partial build
    # camp2 (qa) build complete, qa partial
    # camp5 (intake) untouched
    # camp6 (operate) qa complete to keep healthy
    # camp7 (operate) qa NOT complete + many issues -> risk
    progress_map = [
        (camp1, 0.4, 0.0),
        (camp2, 1.0, 0.6),
        (camp3, 1.0, 1.0),
        (camp4, 1.0, 1.0),
        (camp5, 0.0, 0.0),
        (camp6, 1.0, 1.0),
        (camp7, 0.8, 0.3),
    ]

    for camp, build_pct, qa_pct in progress_map:
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

    # ------------------------------------------------------------------
    # Incidents (5 - varied severity & status)
    # ------------------------------------------------------------------
    incidents = [
        Incident(
            client_id=c1.id,
            campaign_id=camp2.id,
            title="Conversiones de Google Ads no se reciben",
            description="Las conversiones importadas no han recibido señales en las últimas 24h.",
            severity="high",
            status="investigating",
            owner_id=u1.id,
            opened_at=datetime.utcnow() - timedelta(hours=6),
            target_resolution_at=datetime.utcnow() + timedelta(hours=12),
        ),
        Incident(
            client_id=c2.id,
            campaign_id=camp3.id,
            title="CPL por encima del objetivo",
            description="El CPL subió 35% en los últimos 3 días, revisar segmentación y creativos.",
            severity="medium",
            status="new",
            owner_id=u2.id,
            opened_at=datetime.utcnow() - timedelta(days=1),
        ),
        Incident(
            client_id=c1.id,
            campaign_id=None,
            title="Cliente solicita nuevo landing page",
            description="Requiere ajustes generales no asociados a una campaña.",
            severity="low",
            status="resolved",
            owner_id=u1.id,
            opened_at=datetime.utcnow() - timedelta(days=5),
            closed_at=datetime.utcnow() - timedelta(days=1),
        ),
        # Critical + open incident on camp7 (mixed) -> contributes to risk score
        Incident(
            client_id=c3.id,
            campaign_id=camp7.id,
            title="Caída total de tracking server-side",
            description="El endpoint de Conversion API devuelve 500. Sin datos de conversión hace 8 horas.",
            severity="critical",
            status="investigating",
            owner_id=u2.id,
            opened_at=datetime.utcnow() - timedelta(hours=8),
            target_resolution_at=datetime.utcnow() + timedelta(hours=4),
        ),
        # High severity, mitigated (still open per OPEN_INCIDENT_STATUSES)
        Incident(
            client_id=c3.id,
            campaign_id=camp7.id,
            title="Frecuencia muy alta en audiencias core",
            description="Frecuencia >6 en audiencia principal. Riesgo de fatiga creativa.",
            severity="high",
            status="mitigated",
            owner_id=u3.id,
            opened_at=datetime.utcnow() - timedelta(days=2),
            target_resolution_at=datetime.utcnow() + timedelta(days=1),
        ),
    ]
    db.add_all(incidents)

    # ------------------------------------------------------------------
    # Tasks (8 - varied priorities, some overdue)
    # ------------------------------------------------------------------
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
            due_date=today - timedelta(days=1),  # OVERDUE
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
        Task(
            client_id=c2.id,
            campaign_id=camp4.id,
            title="Configurar feed de productos para PMax",
            status="in_progress",
            priority="high",
            due_date=today + timedelta(days=1),
            assignee_id=u3.id,
        ),
        Task(
            client_id=c3.id,
            campaign_id=camp5.id,
            title="Recibir lista de cuentas ABM del cliente",
            status="todo",
            priority="low",
            due_date=today + timedelta(days=10),
            assignee_id=u2.id,
        ),
        # Overdue critical on the risk campaign
        Task(
            client_id=c3.id,
            campaign_id=camp7.id,
            title="Reparar Conversion API server-side",
            status="in_progress",
            priority="critical",
            due_date=today - timedelta(days=3),  # OVERDUE
            assignee_id=u2.id,
        ),
        # Another overdue on risk campaign
        Task(
            client_id=c3.id,
            campaign_id=camp7.id,
            title="Renovar pool de creativos para reducir frecuencia",
            status="todo",
            priority="high",
            due_date=today - timedelta(days=2),  # OVERDUE
            assignee_id=u3.id,
        ),
    ]
    db.add_all(tasks)

    # ------------------------------------------------------------------
    # Changelog entries (4)
    # ------------------------------------------------------------------
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
        ChangelogEntry(
            campaign_id=camp4.id,
            change_type="bid_strategy",
            description="Cambio de Maximize Conversions a Target ROAS 350%",
            hypothesis="Hay suficiente data histórica para optimizar por ROAS",
            expected_impact="+20% ROAS, volumen estable",
            created_by=u3.id,
        ),
    ]
    db.add_all(cl_entries)

    db.flush()

    # ------------------------------------------------------------------
    # Refresh health on all campaigns
    # camp7 should fall into 'risk' (<60) due to:
    #   - critical incident (-40)
    #   - high mitigated incident (-25)
    #   - 2 overdue tasks (-10)
    #   - qa incomplete in operate stage (-15)
    # ------------------------------------------------------------------
    for camp in campaigns:
        refresh_campaign_health(camp, db)

    db.commit()

    print("Seed completed.")
    print(
        f"  Users: 3 | Clients: 3 | Workspaces: 4 | Campaigns: {len(campaigns)}"
    )
    print(
        f"  Incidents: {len(incidents)} | Tasks: {len(tasks)} | "
        f"Changelog entries: {len(cl_entries)}"
    )
    print("  Campaign health scores:")
    for camp in campaigns:
        tag = " [RISK]" if camp.health_score < 60 else ""
        print(f"    - {camp.name}: {camp.health_score}{tag}")


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
