"""Checklist item templates for setup/build and QA, per campaign type."""
from typing import TypedDict


class TemplateItem(TypedDict):
    label: str
    is_blocking: bool


META_LEADGEN_SETUP: list[TemplateItem] = [
    {"label": "Cuenta publicitaria correcta seleccionada", "is_blocking": True},
    {"label": "Moneda y zona horaria revisadas", "is_blocking": True},
    {"label": "Página de Facebook e Instagram conectadas", "is_blocking": True},
    {"label": "Permisos correctos — no usar perfil personal", "is_blocking": True},
    {"label": "Pixel de Meta instalado correctamente", "is_blocking": True},
    {"label": "Eventos estándar configurados: Lead, CompleteRegistration", "is_blocking": True},
    {"label": "Conversiones personalizadas creadas si aplica", "is_blocking": False},
    {"label": "Dominio verificado", "is_blocking": True},
    {"label": "Sin eventos duplicados", "is_blocking": True},
    {"label": "Naming convention aplicada", "is_blocking": False},
    {"label": "Objetivo de campaña correcto: Leads", "is_blocking": True},
    {"label": "Segmentación geo, idioma y exclusiones configuradas", "is_blocking": True},
    {"label": "Optimización acorde al objetivo", "is_blocking": True},
    {"label": "Audiencias frías creadas", "is_blocking": False},
    {"label": "Audiencias calientes creadas", "is_blocking": False},
    {"label": "Exclusión de clientes existentes si procede", "is_blocking": False},
    {"label": "Piezas aprobadas", "is_blocking": True},
    {"label": "Formato correcto", "is_blocking": False},
    {"label": "URL de destino correcta", "is_blocking": True},
    {"label": "Parámetros UTM aplicados", "is_blocking": True},
    {"label": "Presupuesto coherente con el plan", "is_blocking": True},
    {"label": "Tipo de puja acorde a la estrategia", "is_blocking": False},
]


META_LEADGEN_QA: list[TemplateItem] = [
    {"label": "Evento de conversión recibe datos en tiempo real", "is_blocking": True},
    {"label": "No hay eventos duplicados en la misma acción", "is_blocking": True},
    {"label": "Todos los enlaces de anuncios funcionan y cargan rápido", "is_blocking": True},
    {"label": "Formulario funcional y conectado a CRM / Zap", "is_blocking": True},
    {"label": "Naming convention respetada en campañas, conjuntos y anuncios", "is_blocking": True},
    {"label": "UTMs presentes con todos los campos obligatorios", "is_blocking": True},
    {"label": "Políticas revisadas", "is_blocking": False},
    {"label": "Ortografía y gramática en copy", "is_blocking": False},
    {"label": "Estándares de marca", "is_blocking": False},
]


GADS_SEARCH_LEADGEN_SETUP: list[TemplateItem] = [
    {"label": "Cuenta y MCC correctos", "is_blocking": True},
    {"label": "Zona horaria / moneda correctas", "is_blocking": True},
    {"label": "Conversiones importadas correctamente", "is_blocking": True},
    {"label": "Ventanas de conversión razonables", "is_blocking": True},
    {"label": "Etiqueta Google Ads / GA4 verificada", "is_blocking": True},
    {"label": "Naming convention aplicada", "is_blocking": False},
    {"label": "Tipo de campaña correcto: Search", "is_blocking": True},
    {"label": "Presupuesto y estrategia de puja alineados", "is_blocking": True},
    {"label": "Segmentación geográfica y de idioma correctas", "is_blocking": True},
    {"label": "Keywords separadas por intención", "is_blocking": True},
    {"label": "Concordancias definidas con criterio", "is_blocking": True},
    {"label": "Listas de negative keywords creadas", "is_blocking": True},
    {"label": "RSA con suficientes headlines y descripciones", "is_blocking": True},
    {"label": "Palabras clave en títulos importantes", "is_blocking": False},
    {"label": "Sitelinks, Callouts y extensiones configurados", "is_blocking": False},
    {"label": "Parámetros UTM / ValueTrack configurados", "is_blocking": True},
]


GADS_SEARCH_LEADGEN_QA: list[TemplateItem] = [
    {"label": "Conversiones reciben señales en test/debug", "is_blocking": True},
    {"label": "Conversion actions correctas marcadas como Primary", "is_blocking": True},
    {"label": "URLs cargan rápido y con HTTPS", "is_blocking": True},
    {"label": "Landing corresponde a la intención de la keyword", "is_blocking": True},
    {"label": "No hay anuncios con errores de aprobación", "is_blocking": True},
    {"label": "Nivel de calidad esperado revisado", "is_blocking": False},
    {"label": "Anuncios con variantes suficientes", "is_blocking": False},
]


# Map (campaign_type, checklist_type) -> template
TEMPLATES: dict[tuple[str, str], list[TemplateItem]] = {
    ("META_LEADGEN", "build"): META_LEADGEN_SETUP,
    ("META_LEADGEN", "qa"): META_LEADGEN_QA,
    ("GADS_SEARCH_LEADGEN", "build"): GADS_SEARCH_LEADGEN_SETUP,
    ("GADS_SEARCH_LEADGEN", "qa"): GADS_SEARCH_LEADGEN_QA,
}


def get_template(campaign_type: str, checklist_type: str) -> list[TemplateItem]:
    return TEMPLATES.get((campaign_type, checklist_type), [])
