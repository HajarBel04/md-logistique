"""Récapitulatif quotidien des échéances par email (si SMTP configuré).

Variables d'environnement : SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASSWORD, SMTP_FROM.
"""
import os
import smtplib
from email.message import EmailMessage

from sqlalchemy import select
from sqlalchemy.orm import Session

from .compliance import DOC_LABELS, get_settings
from .models import ComplianceAlert

SEVERITY_LABEL = {
    'CRITICAL_EXPIRED': 'EXPIRÉ',
    'WARNING_30J': 'URGENT',
    'INFO_90J': 'À prévoir',
}


def smtp_configured() -> bool:
    return bool(os.environ.get('SMTP_HOST') and os.environ.get('SMTP_FROM'))


def _send(recipients: list[str], subject: str, text: str, html: str) -> None:
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = os.environ['SMTP_FROM']
    msg['To'] = ', '.join(recipients)
    msg.set_content(text)
    msg.add_alternative(html, subtype='html')
    port = int(os.environ.get('SMTP_PORT', '587'))
    with smtplib.SMTP(os.environ['SMTP_HOST'], port, timeout=20) as s:
        if port != 25:
            s.starttls()
        if os.environ.get('SMTP_USER'):
            s.login(os.environ['SMTP_USER'], os.environ.get('SMTP_PASSWORD', ''))
        s.send_message(msg)


def build_digest(db: Session, include_info: bool) -> tuple[str, str, int]:
    alerts = list(db.scalars(
        select(ComplianceAlert)
        .where(ComplianceAlert.status == 'ACTIVE')
        .order_by(ComplianceAlert.days_remaining)
    ))
    if not include_info:
        alerts = [a for a in alerts if a.severity != 'INFO_90J']
    lines, rows = [], []
    for a in alerts:
        when = (f"expiré depuis {-a.days_remaining} j" if a.days_remaining < 0
                else f"dans {a.days_remaining} j")
        d = a.expiration_date.strftime('%d/%m/%Y')
        lines.append(f"[{SEVERITY_LABEL[a.severity]}] {a.target_label} — {d} ({when})")
        color = {'CRITICAL_EXPIRED': '#dc2626', 'WARNING_30J': '#ea580c'}.get(a.severity, '#64748b')
        rows.append(
            f"<tr><td style='padding:6px 10px;color:{color};font-weight:600'>{SEVERITY_LABEL[a.severity]}</td>"
            f"<td style='padding:6px 10px'>{a.target_label}</td>"
            f"<td style='padding:6px 10px'>{d}</td><td style='padding:6px 10px'>{when}</td></tr>"
        )
    text = "Échéances flotte & chauffeurs\n\n" + ("\n".join(lines) or "Aucune échéance à signaler.")
    html = (
        "<h2 style='font-family:sans-serif'>Échéances flotte &amp; chauffeurs</h2>"
        "<table style='font-family:sans-serif;font-size:14px;border-collapse:collapse'>"
        + ("".join(rows) or "<tr><td>Aucune échéance à signaler.</td></tr>")
        + "</table>"
    )
    return text, html, len(alerts)


def send_digest(db: Session, force: bool = False) -> dict:
    settings = get_settings(db)
    email = settings['email']
    if not smtp_configured():
        return {'sent': False, 'reason': "SMTP non configuré sur le serveur (variables SMTP_HOST, SMTP_FROM…)."}
    if not email['recipients']:
        return {'sent': False, 'reason': 'Aucun destinataire configuré.'}
    if not email['enabled'] and not force:
        return {'sent': False, 'reason': 'Envoi par email désactivé.'}
    text, html, count = build_digest(db, email['includeInfo'])
    if count == 0 and not force:
        return {'sent': False, 'reason': 'Aucune échéance à signaler.'}
    _send(email['recipients'], f"MD Logistique — {count} échéance(s) à suivre", text, html)
    return {'sent': True, 'count': count}


__all__ = ['send_digest', 'smtp_configured', 'DOC_LABELS']
