from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.client import Client
from app.models.workspace import Workspace
from app.models.campaign import Campaign
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.schemas.campaign import CampaignRead

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientRead])
def list_clients(db: Session = Depends(get_db)) -> list[Client]:
    return db.query(Client).order_by(Client.created_at.desc()).all()


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)) -> Client:
    client = Client(**payload.model_dump())
    db.add(client)
    db.flush()
    # Auto-create a default workspace for the client
    ws = Workspace(client_id=client.id, notes="Default workspace")
    db.add(ws)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientRead)
def get_client(client_id: int, db: Session = Depends(get_db)) -> Client:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int, payload: ClientUpdate, db: Session = Depends(get_db)
) -> Client:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(client, k, v)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}/campaigns", response_model=list[CampaignRead])
def list_client_campaigns(client_id: int, db: Session = Depends(get_db)) -> list[Campaign]:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return (
        db.query(Campaign)
        .join(Workspace, Workspace.id == Campaign.workspace_id)
        .filter(Workspace.client_id == client_id)
        .order_by(Campaign.created_at.desc())
        .all()
    )
