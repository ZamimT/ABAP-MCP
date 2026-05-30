# ABAP MCP Server — Updates & Changelog

---

## 2026-05-30 — Wartung: Tests, Security-Fixes, Robustheit

### Verbesserung: Unit-Tests, Dependency-Sicherheit & Härtung

**Hintergrund:** Eine Projektdurchsicht ergab mehrere Verbesserungspunkte: keinerlei
automatisierte Tests, 12 npm-Schwachstellen (4 hoch, u.a. `axios`/`fast-xml-parser`),
inkonsistente Tool-Zählungen in der Doku sowie zwei Robustheitslücken in der
Eingabevalidierung.

**Lösung:**
- **Test-Infrastruktur (Vitest):** Neues `npm test` / `npm run test:watch`. Tests unter
  `test/*.test.ts` decken die reinen Helfer ab — Clean-ABAP-Parsing
  (`parseMarkdownSections`, `isNavigationSection`, `searchCleanAbapSections`,
  `CLEAN_ABAP_RULES`), SAProuter-Routen-Parsing (`parseSapRouteString`), Safety-Guards
  und das Config-Boolean-Parsing. **Keine** SAP-Verbindung nötig; `vitest.config.ts`
  setzt Dummy-Env und einen `.js`→`.ts`-Resolver für die NodeNext-Imports. 36 Tests grün.
- **Security:** `npm audit fix` → **0 Schwachstellen** (vorher 12). `abap-adt-api` zog
  innerhalb von `^7.1.0` auf 7.1.3 (bereinigtes `fast-xml-parser`), `axios` auf 1.16.1.
- **Robustheit:**
  - `config.bool()` akzeptiert jetzt `true`/`1`/`yes`/`on` (case-insensitiv) statt nur
    exakt `"true"`. Pure, exportierte `parseBoolean()` für Testbarkeit.
  - `assertSelectOnly()` erlaubt nun auch `WITH`-CTEs und lehnt DML-Schlüsselwörter als
    eigenständige Wörter ab (`\b…\b`, d.h. `delete_flag` u.ä. lösen nicht mehr fälschlich
    aus). Kommentar stellt klar: Defense-in-Depth, nicht die primäre Barriere.
- **Doku-Konsistenz:** Tool-Zählung überall auf **50 Tools / 14 Gruppen** korrigiert
  (vorher 30+/47/48/13 verstreut). In `DOCUMENTATION.md` fehlte die Gruppe **WEBSEARCH**
  in der Tabelle und READ war mit 10 statt 11 angegeben — beide ergänzt/korrigiert.
- **Kommentare:** Deutsche Kommentare in `src/helpers/clean-abap.ts` auf Englisch
  vereinheitlicht (Rest des Codebestands ist englisch).

**Dateien:**
- `vitest.config.ts` (neu), `test/clean-abap.test.ts`, `test/saprouter.test.ts`,
  `test/safety.test.ts`, `test/config.test.ts` (neu)
- `package.json` — `test`/`test:watch`-Scripts, `vitest` devDependency, Tool-Zahl in der Description
- `package-lock.json` — Security-Updates (`npm audit fix`)
- `src/config.ts` — `parseBoolean()` extrahiert & gehärtet
- `src/safety.ts` — `assertSelectOnly()` gehärtet (WITH-CTE, Wortgrenzen, Kommentar)
- `src/helpers/clean-abap.ts` — Kommentare auf Englisch
- `DOCUMENTATION.md`, `CLAUDE.md` — Tool-Zählung korrigiert, Test-Workflow dokumentiert

---

## 2026-05-30 — Clean ABAP Suche: Regel-genaue Granularität

### Verbesserung: `search_clean_abap` & `review_clean_abap` finden einzelne Regeln

**Problem:** `parseMarkdownSections` zerlegte den Styleguide nur an `##`-Überschriften — also an den 18 Kategorien (Names, Methods, …). Eine einzelne Regel (115 × `###`, 92 × `####`) war damit kein eigener Suchtreffer. Bei der Ausgabe wurde der Abschnitt zudem auf die ersten ~80 Zeilen gekürzt. Folge: Eine tief in einer großen Kategorie (z.B. „Methods", ~1000 Zeilen) liegende Regel wie *„Prefer RETURNING to EXPORTING"* (Zeile 2512) wurde nie im Auszug gezeigt — die KI bekam nur den Kategorie-Anfang. Zusätzlich gewann das Inhaltsverzeichnis (`## Content`) fast jede Suche, weil es jeden Begriff als Link enthält.

**Lösung:**
- `parseMarkdownSections` splittet jetzt an `##`/`###`/`####` → **226 statt 18** durchsuchbare Abschnitte. Jede Regel ist ein eigener Treffer **inkl. ihrer Code-Beispiele**.
- Headings tragen einen Breadcrumb-Pfad (z.B. `Methods › Parameter Types › Use either RETURNING or EXPORTING …`), damit Kategorie-Kontext für Scoring und Anzeige erhalten bleibt.
- Neuer Helper `isNavigationSection()` filtert das Inhaltsverzeichnis (`Content`) und den Intro-Block aus den Suchergebnissen — gilt für `search_clean_abap` und die Guideline-Auszüge von `review_clean_abap`.

**Wirkung (verifiziert gegen `clean-abap/CleanABAP.md`):** Suchen wie „RETURNING EXPORTING single output", „CASE instead of ELSE IF", „raise exception CX_STATIC_CHECK" liefern jetzt die exakte Regel mit Beispiel statt eines abgeschnittenen Kategorie-Intros.

**Begleitend — verpflichtender Lookup:** Skill (`.claude/skills/clean-abap/SKILL.md`) und `.clinerules` wurden so verschärft, dass die KI pro Thema **zuerst** `search_clean_abap` (bzw. das Lesen der Zeilenbereiche) aufruft und erst dann codet — die Kurz-Zusammenfassung ist explizit nur eine Checkliste, kein Ersatz für den Volltext.

**Dateien:**
- `src/helpers/clean-abap.ts` — `parseMarkdownSections` (h2/h3/h4 + Breadcrumb), neuer `isNavigationSection()`, Filter in `searchCleanAbapSections`
- `src/tools/handlers/documentation.ts` — Navigations-Filter in `handleSearchCleanAbap`
- `.claude/skills/clean-abap/SKILL.md` — verpflichtender Lookup-Block
- `.clinerules` — Step 3 auf verpflichtenden Per-Thema-Lookup verschärft

> **Hinweis:** Änderung wirkt erst nach `npm run build`. (Aktuell schlägt der Build wegen fehlender Dependencies `http-proxy-agent`/`https-proxy-agent` fehl — vorher `npm install` ausführen.)

---

## 2026-05-30 — Clean ABAP Claude Skill

### Neue Claude Skill: `clean-abap`

**Hintergrund:** Das Repository enthält unter `clean-abap/` den vollständigen Clean-ABAP-Styleguide (`CleanABAP.md`, ~5150 Zeilen) inkl. Sub-Sections und Cheat-Sheets. Dieser Inhalt war bisher nur als Referenzdokument vorhanden — Claude Code zog ihn nicht automatisch heran, wenn ABAP-Code geschrieben oder reviewt wurde.

**Lösung:** Eine projektgebundene Claude Skill `clean-abap`, die automatisch greift, sobald ABAP-Code erzeugt, reviewt oder refaktoriert wird. Die `SKILL.md` ist eine kompakte Arbeitszusammenfassung (Golden Rules + die wirkungsvollsten/häufigsten Regeln inline) und verweist per Progressive Disclosure mit Zeilennummern auf den vollständigen `clean-abap/CleanABAP.md` — kein 192-KB-Dump in den Kontext.

**Technische Details:**
- Speicherort: `.claude/skills/clean-abap/SKILL.md` (Project Skill, in den Repo eingecheckt)
- Frontmatter `description` ist auf die Trigger-Fälle (ABAP schreiben/reviewen/refaktorieren) zugeschnitten
- Referenziert die bestehenden Dateien unter `clean-abap/` an Ort und Stelle (keine Duplikation), inkl. Navigations-Tabelle (18 Sektionen → Zeilennummern) und Sub-Section-Verweisen
- Explizite Konflikt-Präzedenz: (1) Konvention des bearbeiteten Objekts → (2) Projektkonventionen (CLAUDE.md / Memory) → (3) Clean-ABAP-Defaults. Dadurch werden projekteigene Vorgaben (z.B. `*` in Spalte 1 für Vollzeilenkommentare) respektiert
- Ergänzt — ohne zu duplizieren — den bestehenden `abap_develop` MCP-Prompt (dessen Schritt 3 die Clean-ABAP-Prüfung ist) und die Quality-/Diagnostics-Tools
- Aktivierung: Project Skills werden beim Session-Start geladen → Claude Code neu starten

**Dateien:**
- `.claude/skills/clean-abap/SKILL.md` — neue Skill-Definition
- `DOCUMENTATION.md` — Abschnitt „Claude Skills“ ergänzt
- `readme.md` — Hinweis auf die Skill ergänzt

---

## 2026-03-25 — get_table_fields Tool

### Neues Tool: `get_table_fields`

**Problem:** `get_ddic_element` nutzt den ADT-Endpoint `/sap/bc/adt/ddic/ddl/elementinfo`, der primär für CDS/DDL-Elemente konzipiert ist. Bei klassischen DDIC-Tabellen (VBAK, MARA etc.) liefert er leere Ergebnisse (`children: [], elementProps: false`).

**Lösung:** Neues Tool `get_table_fields`, das den Data-Preview-Endpoint (`tableContents` mit `rowNumber=1`) nutzt. Dieser liefert zuverlässig den kompletten Feldkatalog für transparente Tabellen, Views und CDS-Entities — inkl. Feldname, ABAP-Typ, Beschreibung, Key-Flag und Länge.

**Technische Details:**
- Ruft `client.tableContents(tableName, 1, false)` auf und gibt nur das `columns`-Array zurück
- Mappt `QueryResultColumn` auf ein kompaktes Feld-Objekt (name, type, description, isKey, length, isKeyFigure)
- Zusammenfassung in der Antwort: Anzahl Felder + Anzahl Key-Felder
- Kategorie: READ
- Nicht in Core Tools (Deferred Loading)

**Dateien:**
- `src/schemas.ts` — `S_GetTableFields` Schema
- `src/tools/tool-definitions.ts` — Tool-Definition
- `src/tools/handlers/read.ts` — `handleGetTableFields` Handler
- `src/tools/handler-map.ts` — Dispatch-Eintrag
- `src/tools/tool-registry.ts` — READ-Kategorie + Short Description
- `DOCUMENTATION.md` — Tool-Referenz
- `readme.md` — Tool-Zähler aktualisiert (49 → 50)

---

## 2026-03-25 — search_source_code als Core Tool

### Änderung: `search_source_code` zu Core Tools hinzugefügt

**Hintergrund:** Quellcode-Volltextsuche ist eine Grundfunktion bei der ABAP-Entwicklung. Zusammen mit `search_abap_objects` bildet es das Such-Paar — Objekte nach Name vs. Inhalte nach Text. Es wird in den meisten Workflows gebraucht (Bug-Suche, Refactoring, Impact-Analyse) und sollte ohne vorheriges `find_tools` verfügbar sein.

**Änderung:** `search_source_code` ist jetzt eines von 12 Core Tools (vorher 11) und wird bei `DEFER_TOOLS=true` immer sofort geladen.

**Core Tools (12):** `find_tools`, `list_tools`, `search_abap_objects`, `search_source_code`, `read_abap_source`, `write_abap_source`, `get_object_info`, `where_used`, `analyze_abap_context`, `search_abap_syntax`, `validate_ddic_references`, `batch_read`

**Dateien:**
- `src/tools/tool-registry.ts` — `CORE_TOOL_NAMES` erweitert
- `CLAUDE.md` — Core-Tool-Liste aktualisiert
- `readme.md` — Banner-Anzeige aktualisiert
- `DOCUMENTATION.md` — Kern-Tool-Anzahl aktualisiert

---

## 2026-03-25 — search_sap_web Tool (Tavily Web Search)

### Neues Tool: `search_sap_web`

**Problem:** Die bestehenden Doku-Tools (`get_abap_keyword_doc`, `search_abap_syntax`) arbeiten mit direkter URL-Konstruktion und finden nur Treffer, wenn der Keyword-Slug exakt passt. Fuer Fehlermeldungen, SAP Notes, Community-Blogartikel, KBAs und allgemeine SAP-Problemloesungen fehlte eine Suchmoeglichkeit.

**Loesung:** Das neue `search_sap_web`-Tool durchsucht SAP Help, SAP Community und SAP Notes via Tavily Search API. Es gibt kompakte Ergebnisse zurueck (Titel + URL + Snippet), um den Token-Verbrauch minimal zu halten.

**Technische Details:**
- Nutzt Tavily Search API (1000 Searches/Monat kostenlos)
- Durchsucht parallel bis zu 3 Quellen: `help.sap.com`, `community.sap.com`, `me.sap.com`
- Query wird automatisch mit "SAP ABAP" angereichert fuer bessere Relevanz
- Parallele Ausfuehrung via `Promise.allSettled()` — alle Quellen gleichzeitig
- Ergebnis pro Treffer: Titel + URL + Snippet (~3 Zeilen) — gesamtes Tool-Ergebnis unter 500 Tokens
- Fehlertoleranz: Einzelne fehlgeschlagene Quellen stoppen nicht die anderen

**Setup:**
1. https://tavily.com/ → Sign up → API Key kopieren
2. `TAVILY_API_KEY` in `.env` eintragen

**Beispiel:**
```json
{
  "tool": "search_sap_web",
  "args": {
    "query": "CX_SY_OPEN_SQL_DB error SELECT",
    "sources": ["help", "community"],
    "maxResults": 5
  }
}
```

**Kosten:** Free Tier: 1000 Searches/Monat.

**Neue Kategorie:** WEBSEARCH (in `TOOL_CATEGORIES`)

**Dateien:**
- `src/config.ts` — `tavilyApiKey` Config-Feld
- `src/schemas.ts` — `S_SearchSapWeb` Schema
- `src/tools/handlers/websearch.ts` — Handler (neu)
- `src/tools/tool-definitions.ts` — Tool-Definition
- `src/tools/handler-map.ts` — Dispatch-Registrierung
- `src/tools/tool-registry.ts` — Kategorie + Short Description
- `.env` / `.env.example` — `TAVILY_API_KEY`
- `src/index.ts` — Banner zeigt WebSearch-Status

---

## 2026-03-25 — batch_read Tool (Performance-Optimierung)

### Neues Tool: `batch_read`

**Problem:** MCP-Clients wie Cline (VS Code Extension) fuehren Tool-Aufrufe sequenziell aus — ein Call nach dem anderen. Bei ABAP-Entwicklungsworkflows, die viele Leseoperationen erfordern (Source lesen, Where-Used, Object Info, Kontext-Analyse), fuehrt das zu langen Wartezeiten.

**Loesung:** Das neue `batch_read`-Tool buendelt mehrere Read-Only-Operationen in einem einzigen MCP-Call. Der Server fuehrt sie intern parallel via `Promise.allSettled()` aus und gibt alle Ergebnisse zusammen zurueck.

**Technische Details:**
- Bis zu 20 Operationen pro Batch-Call
- Jede Operation referenziert ein bestehendes Tool (Name + Args)
- Nur Read-Only-Tools erlaubt — Write/Create/Delete sind blockiert
- Ergebnisse werden pro Operation mit Label und Status (OK/FEHLER) zurueckgegeben
- Fehlertoleranz: Einzelne fehlgeschlagene Operationen stoppen nicht den Batch
- Als Core-Tool registriert (immer verfuegbar, kein `find_tools` noetig)

**Beispiel:**
```json
{
  "tool": "batch_read",
  "args": {
    "operations": [
      { "tool": "read_abap_source", "args": { "objectUrl": "/sap/bc/adt/programs/programs/ztest", "includeRelated": true }, "label": "source" },
      { "tool": "where_used", "args": { "objectUrl": "/sap/bc/adt/programs/programs/ztest" }, "label": "usages" },
      { "tool": "get_object_info", "args": { "objectUrl": "/sap/bc/adt/programs/programs/ztest" }, "label": "info" }
    ]
  }
}
```

**Performance-Gewinn:**
- Cline sieht 1 Tool-Call statt N
- Server feuert N HTTP-Requests parallel an SAP
- Gesamtzeit ~ langsamster Einzelrequest statt Summe aller Requests

**Hintergrund:** ADT (ABAP Development Tools) REST API hat keine native Batch-API. Die Parallelisierung passiert im Node.js MCP Server, der die einzelnen HTTP-Requests via `Promise.allSettled()` gleichzeitig abfeuert.

**Neue Kategorie:** BATCH (in `TOOL_CATEGORIES`)

**Dateien:**
- `src/schemas.ts` — `S_BatchRead` Schema
- `src/tools/handlers/batch.ts` — Handler (neu)
- `src/tools/tool-definitions.ts` — Tool-Definition
- `src/tools/handler-map.ts` — Dispatch-Registrierung
- `src/tools/tool-registry.ts` — Kategorie + Core-Tool + Short Description
