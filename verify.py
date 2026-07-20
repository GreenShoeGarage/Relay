#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import tempfile
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HTML = ROOT / "relay.html"
WORKER = ROOT / "gateway" / "worker.js"
TEST_WORKER = ROOT / "gateway" / "test-worker.mjs"

for required in (HTML, WORKER, TEST_WORKER):
    assert required.exists(), f"Missing package file: {required.relative_to(ROOT)}"

text = HTML.read_text(encoding="utf-8")


class RelayParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.external: list[str] = []
        self.scripts: list[str] = []
        self._in_script = False
        self._script_chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        resource = values.get("src") or values.get("href")
        if resource and re.match(r"https?://", resource):
            self.external.append(resource)
        if tag == "script" and not values.get("src"):
            self._in_script = True
            self._script_chunks = []

    def handle_data(self, data: str) -> None:
        if self._in_script:
            self._script_chunks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_script:
            self.scripts.append("".join(self._script_chunks))
            self._in_script = False


parser = RelayParser()
parser.feed(text)

duplicates = [name for name, count in Counter(parser.ids).items() if count > 1]
assert not duplicates, f"Duplicate element IDs: {duplicates}"
assert not parser.external, f"Unexpected browser runtime dependencies: {parser.external}"
assert len(parser.scripts) == 1 and parser.scripts[0].strip(), "Embedded application script not found"

required_ids = {
    "projectName", "environmentSelect", "methodSelect", "urlInput", "sendBtn", "assertionRows",
    "gatewayBaseUrl", "createChannelBtn", "webhookEventList", "webhookDetail",
    "scenarioList", "scenarioEditor", "fixtureList", "fixtureEditor",
    "reportTypeSelect", "reportSubjectSelect", "generateReportBtn", "reportPreview",
    "interchangeFormat", "interchangeFile", "interchangeText", "runInterchangeImportBtn",
    "exportPostmanBtn", "exportHarBtn", "copyWebhookAsRequestBtn",
    "responseTabs", "responseMeta", "projectMenu", "requestMenu",
}
missing = sorted(required_ids.difference(parser.ids))
assert not missing, f"Missing required controls: {missing}"

required_fragments = [
    "const VERSION = '1.7.0'", "schemaVersion: 7", "performBuiltRequest", "evaluateAssertions",
    "verifyWebhookEvent", "runScenario", "syncActiveFixture", "generateReport", "exportEvidence",
    "requestFromCurl", "parsePostman", "parseOpenApiObject", "parseOpenApiYaml", "parseHar",
    "exportPostman", "exportHar", "copyWebhookAsRequest", "HMAC SHA-256", "Duplicate webhook",
    "Gateway proxy mode", "FI-1XX · RELAY v1.7.0",
]
for fragment in required_fragments:
    assert fragment in text, f"Missing feature marker: {fragment}"

with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as handle:
    handle.write(parser.scripts[0])
    browser_js = handle.name

subprocess.run(["node", "--check", browser_js], check=True)
subprocess.run(["node", "--check", str(WORKER)], check=True)
subprocess.run(["node", str(TEST_WORKER)], cwd=ROOT / "gateway", check=True)

print("RELAY v1.7 package verification passed")
print(f"HTML size: {HTML.stat().st_size:,} bytes")
print(f"Unique element IDs: {len(parser.ids)}")
print("Browser runtime dependencies: 0")
print("Worker integration test: passed")
