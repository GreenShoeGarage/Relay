#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import tempfile
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
HTML = ROOT / "relay.html"
text = HTML.read_text(encoding="utf-8")
soup = BeautifulSoup(text, "html.parser")

assert soup.title and soup.title.get_text(strip=True) == "RELAY — API Test Bench"

ids = [tag["id"] for tag in soup.find_all(attrs={"id": True})]
duplicates = [name for name, count in Counter(ids).items() if count > 1]
assert not duplicates, f"Duplicate element IDs: {duplicates}"

required_ids = {
    "projectName", "environmentSelect", "methodSelect", "urlInput", "sendBtn",
    "paramsRows", "authType", "headersRows", "bodyMode", "bodyEditorWrap",
    "responseTabs", "responseMeta", "sideContent", "saveRequestBtn",
    "environmentModal", "saveModal", "codeModal", "projectMenu", "requestMenu",
}
missing = sorted(required_ids.difference(ids))
assert not missing, f"Missing required controls: {missing}"

methods = {option.get_text(strip=True) for option in soup.select("#methodSelect option")}
assert {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}.issubset(methods)

auth_modes = {option.get("value") for option in soup.select("#authType option")}
assert {"none", "bearer", "basic", "apikey"}.issubset(auth_modes)

body_modes = {option.get("value") for option in soup.select("#bodyMode option")}
assert {"none", "json", "text", "urlencoded"}.issubset(body_modes)

external_resources = []
for tag in soup.find_all(["script", "link", "img"]):
    resource = tag.get("src") or tag.get("href")
    if resource and re.match(r"https?://", resource):
        external_resources.append(resource)
assert not external_resources, f"Unexpected external dependencies: {external_resources}"

script = soup.find("script")
assert script and script.string, "Embedded application script not found"
with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as handle:
    handle.write(script.string)
    js_path = handle.name
subprocess.run(["node", "--check", js_path], check=True)

required_fragments = [
    "localStorage.setItem", "fetch(request.url", "generateCode", "exportProject",
    "resolveVariables", "Bearer Token", "Python requests", "PowerShell",
    "FI-1XX · RELAY v1.0.0", "Cloudflare Worker gateway",
]
for fragment in required_fragments:
    assert fragment in text, f"Missing expected feature marker: {fragment}"

assert "request.auth.bearer = '';" in text
assert "request.auth.password = '';" in text
assert "request.auth.apiKeyValue = '';" in text

print("RELAY v1.0 static verification passed")
print(f"HTML size: {HTML.stat().st_size:,} bytes")
print(f"Unique element IDs: {len(ids)}")
print("External runtime dependencies: 0")
