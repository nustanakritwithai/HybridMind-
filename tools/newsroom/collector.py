"""Parse public RSS/Atom from provided bytes only. Never fetches or runs remote content."""
from __future__ import annotations
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

ATOM = '{http://www.w3.org/2005/Atom}'


def parse_feed(xml_bytes: bytes, source_id: str, fetched_at: str) -> list[dict]:
    if len(xml_bytes) > 2_000_000 or b'<!DOCTYPE' in xml_bytes.upper() or b'<!ENTITY' in xml_bytes.upper():
        raise ValueError('Unsafe or too-large XML')
    root = ET.fromstring(xml_bytes)
    items = root.findall('./channel/item') if root.tag == 'rss' else root.findall(f'{ATOM}entry')
    results = []
    for item in items[:50]:
        if root.tag == 'rss':
            title = item.findtext('title') or ''
            link = item.findtext('link') or ''
            date = item.findtext('pubDate') or ''
            try:
                published = parsedate_to_datetime(date).astimezone(timezone.utc).date().isoformat()
            except (ValueError, TypeError, IndexError):
                published = None
        else:
            title = item.findtext(f'{ATOM}title') or ''
            links = item.findall(f'{ATOM}link')
            link = next((l.attrib.get('href', '') for l in links if l.attrib.get('rel', 'alternate') == 'alternate'), '')
            date = item.findtext(f'{ATOM}published') or item.findtext(f'{ATOM}updated') or ''
            try:
                published = datetime.fromisoformat(date.replace('Z', '+00:00')).date().isoformat()
            except (ValueError, TypeError):
                published = None
        host = urlparse(link)
        if not (host.scheme == 'https' and host.hostname and title.strip()):
            continue
        results.append({'source_id': source_id, 'canonical_url': link,
                        'title': title.strip(), 'summary': '',
                        'source_published_at': published, 'fetched_at': fetched_at})
    return results
