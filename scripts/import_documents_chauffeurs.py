#!/usr/bin/env python3
"""
Importe les documents des dossiers chauffeurs (OneDrive « MD Personnel roulant ») dans le module Flotte.

    python scripts/import_documents_chauffeurs.py                 # aperçu, n'envoie rien
    python scripts/import_documents_chauffeurs.py --apply         # importe
    python scripts/import_documents_chauffeurs.py --apply --api https://…/api/flotte

Connexion admin requise : --email ADMIN_EMAIL (le mot de passe est demandé, ou variable MD_ADMIN_PASSWORD).

Structure attendue : <racine>/Chauffeur Camion|Chauffeur Camionnette/<NOM Prénom>/<fichiers>
- Le type de document est déduit du nom de fichier ; les fichiers non reconnus sont listés, pas devinés.
- Plusieurs fichiers pour un même emplacement (recto/verso) sont réunis : images empilées, PDF fusionnés.
- Un emplacement déjà rempli dans l'application n'est jamais écrasé (sauf --force).
- Un chauffeur absent de l'application est créé.
"""
import argparse
import io
import os
import re
import sys
import json
import unicodedata
import getpass
import http.cookiejar
import urllib.error
import urllib.request
import uuid

_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def http_json(method: str, url: str, payload: dict | None = None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={'Content-Type': 'application/json'} if data else {})
    with _opener.open(req, timeout=60) as r:
        return json.loads(r.read() or b'null')


def http_upload(url: str, filename: str, content: bytes, mime: str, fields: dict) -> None:
    boundary = uuid.uuid4().hex
    parts = []
    for k, v in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    safe = filename.replace('"', '')
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{safe}"\r\n'
                 f'Content-Type: {mime}\r\n\r\n'.encode() + content + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    req = urllib.request.Request(url, data=b''.join(parts), method='POST',
                                 headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with _opener.open(req, timeout=180) as r:
        r.read()

ROOT_DEFAULT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            'samples', 'MD Personnel roulant')
TYPES = {'Chauffeur Camion': 'POIDS_LOURD', 'Chauffeur Camionnette': 'CAMIONNETTE'}
EXTS = {'.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png'}
LABELS = {
    'CARTE_IDENTITE': "Carte d'identité", 'PERMIS_CONDUIRE': 'Permis', 'CARTE_CHAUFFEUR': 'Carte conducteur',
    'FICHE_SIGNALETIQUE': 'Fiche signalétique', 'BADGE_KOLN': 'Badge Köln',
    'ATTESTATION_CONDUCTEUR': 'Attestation conducteur',
}

# Noms de fichiers sans indice clair, classés d'après l'ancienne page Chauffeurs
OVERRIDES = {
    'Scan2025-10-16_132237.pdf': 'CARTE_IDENTITE',
    'Scan2025-10-16_132259.pdf': 'PERMIS_CONDUIRE',
    'Scan2025-10-16_132321.pdf': 'CARTE_CHAUFFEUR',
    'MD028 Faouzi CE.pdf': 'PERMIS_CONDUIRE',
    'Doc Karim.pdf': 'PERMIS_CONDUIRE',
}
# Classement plausible mais à confirmer à l'écran
TO_CHECK = {'Koln id.jpeg', 'fiche Abdessamad.pdf'}


def norm(text: str) -> str:
    text = unicodedata.normalize('NFD', text)
    return ''.join(c for c in text if unicodedata.category(c) != 'Mn').lower()


def classify(filename: str) -> str | None:
    if filename in OVERRIDES:
        return OVERRIDES[filename]
    n = norm(filename)
    if 'badge' in n or 'koln' in n:
        return 'BADGE_KOLN'
    if 'attestation' in n:
        return 'ATTESTATION_CONDUCTEUR'
    if re.search(r'carte\s*cond', n):
        return 'CARTE_CHAUFFEUR'
    if 'permis' in n:
        return 'PERMIS_CONDUIRE'
    if 'identit' in n or 'dentit' in n or 'carte id' in n or re.match(r'(id|ci)\b', n):
        return 'CARTE_IDENTITE'
    if n.startswith('fiche'):
        return 'FICHE_SIGNALETIQUE'
    return None


def name_tokens(text: str) -> set[str]:
    text = re.sub(r'\b(mnq|mnd)\b.*$', '', norm(text))  # « Mnq Carte Conducteur » = note dans le nom du dossier
    return set(re.findall(r'[a-z]+', text))


def split_name(folder: str) -> tuple[str, str]:
    folder = re.sub(r'\s+(Mnq|Mnd)\b.*$', '', folder).split()
    nom = [w for w in folder if w.isupper()]
    prenom = [w for w in folder if not w.isupper()]
    return ' '.join(nom), ' '.join(prenom)


def combine(paths: list[str]) -> tuple[bytes, str, str]:
    """Réunit plusieurs fichiers d'un même emplacement. Retourne (contenu, mime, nom)."""
    mimes = {EXTS[os.path.splitext(p)[1].lower()] for p in paths}
    base = os.path.splitext(os.path.basename(paths[0]))[0]
    if len(paths) == 1:
        with open(paths[0], 'rb') as f:
            return f.read(), mimes.pop(), os.path.basename(paths[0])
    if mimes == {'application/pdf'}:
        from pypdf import PdfReader, PdfWriter
        w = PdfWriter()
        for p in paths:
            for page in PdfReader(p).pages:
                w.add_page(page)
        buf = io.BytesIO()
        w.write(buf)
        return buf.getvalue(), 'application/pdf', f'{base} (recto-verso).pdf'
    if all(m.startswith('image/') for m in mimes):
        from PIL import Image, ImageOps
        imgs = [ImageOps.exif_transpose(Image.open(p)).convert('RGB') for p in paths]
        width = max(i.width for i in imgs)
        imgs = [i.resize((width, round(i.height * width / i.width))) if i.width != width else i for i in imgs]
        gap = round(width * 0.06)
        out = Image.new('RGB', (width, sum(i.height for i in imgs) + gap * (len(imgs) - 1)), 'white')
        y = 0
        for i in imgs:
            out.paste(i, (0, y))
            y += i.height + gap
        buf = io.BytesIO()
        out.save(buf, 'JPEG', quality=90)
        return buf.getvalue(), 'image/jpeg', f'{base} (recto-verso).jpg'
    raise ValueError('mélange PDF + images')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--root', default=ROOT_DEFAULT)
    ap.add_argument('--api', default='http://localhost:8000/api/flotte')
    ap.add_argument('--apply', action='store_true', help='importer (sinon simple aperçu)')
    ap.add_argument('--force', action='store_true', help='remplacer les documents déjà présents')
    ap.add_argument('--email', required=True, help='email du compte administrateur')
    args = ap.parse_args()

    api = args.api.rstrip('/')
    password = os.environ.get('MD_ADMIN_PASSWORD') or getpass.getpass('Mot de passe admin : ')
    auth = api.rsplit('/flotte', 1)[0] + '/auth/login'
    try:
        http_json('POST', auth, {'identifier': args.email, 'password': password})
    except urllib.error.HTTPError as e:
        print(f'Connexion refusée ({e.code}) : vérifiez l’email et le mot de passe.')
        return 1
    drivers = http_json('GET', f'{api}/drivers')
    by_tokens = [(name_tokens(f"{d['nom']} {d['prenom']}"), d) for d in drivers]

    plan, unclassified, created = [], [], []
    for type_dir, dtype in TYPES.items():
        tdir = os.path.join(args.root, type_dir)
        if not os.path.isdir(tdir):
            continue
        for folder in sorted(os.listdir(tdir)):
            fpath = os.path.join(tdir, folder)
            if not os.path.isdir(fpath):
                continue
            tokens = name_tokens(folder)
            match = next((d for t, d in by_tokens if t and t <= tokens), None)
            if match is None:
                nom, prenom = split_name(folder)
                if args.apply:
                    match = http_json('POST', f'{api}/drivers',
                                      {'nom': nom, 'prenom': prenom, 'typeChauffeur': dtype})
                    match.setdefault('documentsPresent', [])
                else:
                    match = {'id': None, 'nomComplet': f'{prenom} {nom}', 'documentsPresent': []}
                created.append(match['nomComplet'])
            slots: dict[str, list[str]] = {}
            for fn in sorted(os.listdir(fpath)):
                if os.path.splitext(fn)[1].lower() not in EXTS:
                    continue
                slot = classify(fn)
                if slot is None:
                    unclassified.append(f'{folder}/{fn}')
                else:
                    slots.setdefault(slot, []).append(os.path.join(fpath, fn))
            for slot, paths in slots.items():
                plan.append((match, slot, paths))

    print(f"\n{'IMPORT' if args.apply else 'APERÇU (rien n’est envoyé — ajoutez --apply)'}\n")
    done = skipped = failed = 0
    for driver, slot, paths in plan:
        names = ' + '.join(os.path.basename(p) for p in paths)
        check = '  ⚠ à vérifier' if any(os.path.basename(p) in TO_CHECK for p in paths) else ''
        if slot in driver.get('documentsPresent', []) and not args.force:
            print(f"  = {driver['nomComplet']:<34} {LABELS[slot]:<22} déjà présent, ignoré")
            skipped += 1
            continue
        print(f"  + {driver['nomComplet']:<34} {LABELS[slot]:<22} ← {names}{check}")
        if not args.apply:
            continue
        try:
            data, mime, name = combine(paths)
            http_upload(f"{api}/drivers/{driver['id']}/documents/{slot}", name, data, mime, {'cropped': 'false'})
            done += 1
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(f'      ✗ échec : {e}')

    if created:
        print(f"\nChauffeurs {'créés' if args.apply else 'à créer'} : {', '.join(created)}")
    if unclassified:
        print('\nNon reconnus (à classer à la main dans l’application) :')
        for u in unclassified:
            print(f'  ? {u}')
    print(f"\n{len(plan)} emplacement(s) : {done} importé(s), {skipped} ignoré(s), {failed} échec(s).")
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
