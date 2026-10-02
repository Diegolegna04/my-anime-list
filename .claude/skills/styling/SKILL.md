---
name: styling
description: Procedura unica per interventi estetici su interfacce web (analisi, restyling, rifinitura, tipografia, colore, animazioni, nuove pagine). Sceglie le skill di design adatte e segue sempre gli stessi passi — branch sicuro, contesto, analisi con evidenze, decisioni con l'utente, modifica, verifica nel browser, commit solo su branch non principale. Usare quando l'utente chiede di migliorare l'aspetto di una pagina o componente o digita /styling.
user-invocable: true
argument-hint: "<pagina|componente|URL> [obiettivo: analisi | restyling | rifinitura | tipografia | colore | layout | mobile | animazioni | nuova pagina]"
---

# /styling — procedura per il lavoro estetico

Argomenti: `<target> [obiettivo]`. Il target è un file, una rotta o un URL; l'obiettivo è facoltativo (se manca, parti dall'analisi).

Rispondi nella lingua dell'utente. Segui i passi **in ordine**; non saltare la verifica.

## 1. Sicurezza git (sempre per primo)

- `git branch --show-current` e `git status --short`.
- Se il branch è `main` o `master`: **fermati** e chiedi (AskUserQuestion) su quale branch lavorare, proponendo di crearne uno `styling/<target-breve>`. Non modificare mai file sul branch principale.
- Se ci sono modifiche non committate non tue, segnalale prima di toccare quei file.
- Commit e push **solo** quando l'utente lo chiede, e mai sul branch principale.

## 2. Contesto del progetto

- Cerca `PRODUCT.md` e `DESIGN.md` (radice, `docs/`, `.agents/context/`). Se `PRODUCT.md` manca, esegui prima `impeccable init` (con intervista) e poi riprendi da qui.
- Leggi `CLAUDE.md` e `PROJECT.md` e rispetta le loro regole. `DESIGN.md` (radice del progetto) è vincolante: token, icone, forme, movimento, tema scuro.
- Progetto **Angular 20** (componenti standalone, CSS per componente, niente Tailwind). Leggi i token in `src/styles.css`, i font e le icone caricati in `src/index.html` (Font Awesome 6.0.0-beta3, nessun webfont) e almeno un componente rappresentativo del target (`.html` + `.css` + `.ts`).
- **Priorità in caso di conflitto:** PRODUCT.md > identità già esistente (colori brand, font scelti, palette per brand) > regole delle skill. Se due skill estetiche si contraddicono, chiedi all'utente.

## 3. Scelta delle skill

La base è sempre **`impeccable`** (carica la skill e il sotto-comando adatto). Aggiungi **al massimo una** skill di "corsia estetica" oltre alle skill tecniche (GSAP, Figma, dataviz).

| Richiesta | Skill da usare |
|---|---|
| "Cosa migliorare?", valutazione, nessun obiettivo | `impeccable critique` (+ `impeccable audit` per accessibilità, performance, responsive) |
| Restyling di una pagina esistente, "possiamo stravolgere" | `impeccable critique` → `redesign-existing-projects` |
| Nuova pagina, landing, sezione nuova | `impeccable shape` o `impeccable craft` + `frontend-design:frontend-design` oppure `design-taste-frontend` |
| Rifinitura prima del rilascio | `impeccable polish` |
| Tipografia | `impeccable typeset` |
| Colore piatto o sbagliato | `impeccable colorize` |
| Spaziature, gerarchia, allineamenti | `impeccable layout` |
| Mobile / tablet | `impeccable adapt` |
| Testi dell'interfaccia, etichette, errori | `impeccable clarify` |
| Troppo anonimo / troppo carico | `impeccable bolder` / `impeccable quieter` |
| Stati vuoti, errori, casi limite | `impeccable harden` / `impeccable onboard` |
| Animazioni | `impeccable animate`; per animazioni complesse GSAP (`gsap-core`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-performance`) avviato in `afterNextRender()` con `gsap.context()` e `ctx.revert()` in `DestroyRef.onDestroy`. Per entrate/uscite semplici bastano transizioni CSS o `@angular/animations`. Mai `gsap-react` (è per React) |
| Direzione stilistica richiesta esplicitamente | una tra `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `gpt-taste` — solo se coerente con PRODUCT.md |
| Concept visivi prima del codice | `imagegen-frontend-web` / `imagegen-frontend-mobile`, poi `image-to-code` |
| Identità, logo, brand board | `brandkit` |
| Figma (leggere o generare design) | `figma:figma-use`, `figma:figma-generate-design` |
| Documentare il design system | `impeccable document` / `impeccable extract`; `stitch-design-taste` solo se si usa Google Stitch |
| Grafici, KPI, dashboard | `dataviz` |

Dichiara all'utente, in una riga, quali skill hai scelto e perché.

Se una skill della tabella non compare tra quelle disponibili nella sessione (plugin spento o non installato), dillo all'utente e prosegui con `impeccable`; non simularla. Le skill `taste-skill` (`redesign-existing-projects`, `design-taste-frontend`, `minimalist-ui`…) e `gsap-skills` si attivano da `/plugin`.

## 4. Analisi con evidenze

Per analisi e restyling (salta o riduci per richieste piccole e mirate):

- Lancia **due valutazioni isolate in parallelo** con sub-agent:
  - **A – revisione di design:** legge i file del target e guarda la pagina renderizzata; valuta aspetto "da template/AI", gerarchia, tipografia, colore, immagini, stati, testi, carico cognitivo, 10 euristiche di Nielsen (0–4).
  - **B – misure:** esegue il detector di impeccable sui template `*.component.html` e i `*.component.css` del target e misura nel browser (Playwright su `http://localhost:4200`, finestre 1440 e 390 px): font e dimensioni, contrasto dei testi e degli stati attivi, tap target (≥ 44px), overflow orizzontale, errori in console, comportamento di filtri/interazioni. Controlla anche il tema scuro (`.dark-theme` su `<html>`).
- Gli `<img [src]="…">` di Angular non sono immagini rotte: le esclusioni già decise stanno in `.impeccable/config.json`.
- Se il dev server non è attivo, chiedi prima di avviarlo (`npm start`, proxy `/api` in `proxy.conf.json`); se lo avvii tu, fermalo alla fine. La pagina `/profile` richiede login: chiedi un account di prova o saltala.
- Salva gli screenshot in una cartella ignorata da git (es. `.playwright-mcp/`), mai nel codice sorgente.
- Unisci i risultati: punteggio su 40, problemi ordinati P0–P3 con `file:riga` e correzione concreta, punti di forza.

## 5. Decisioni con l'utente

- Presenta i risultati in modo leggibile (problemi principali in linguaggio semplice).
- Per interventi grandi entra in plan mode e usa AskUserQuestion per le scelte che cambiano il risultato: struttura della pagina, quanto toccare l'identità (solo la pagina / font e colori globali / rifacimento completo), azioni da offrire all'utente finale.
- Scrivi un piano con file da toccare e verifiche; **non modificare nulla prima dell'approvazione** quando l'intervento cambia struttura o identità.

## 6. Modifica

- Segui le regole della skill scelta e quelle generali di impeccable:
  - contrasto WCAG AA (testo ≥ 4.5:1, anche su chip e pulsanti attivi);
  - niente etichette maiuscole spaziate sopra ogni sezione, niente griglie di card identiche, niente testo sfumato, niente vetro decorativo;
  - animazioni con `prefers-reduced-motion`, contenuto visibile anche senza JavaScript.
- Rispetta `DESIGN.md`: nessun colore scritto a mano nei componenti, solo icone Font Awesome, un solo spinner e una sola `@keyframes spin` (globali), niente `transition: all`, niente `:host-context(.dark-theme)` salvo eccezioni.
- Riusa token, classi globali (`.page`, `.page-hero`, `.panel`, `.section-title`, `.btn`, `.chip`…) e componenti condivisi (`services/shared/anime-card`); niente valori magici se esiste un token.
- Stili del singolo componente nel suo `.component.css`; ciò che serve a più pagine va in `src/styles.css` e documentato in `DESIGN.md`.
- I testi dell'interfaccia sono solo in italiano, direttamente nei template (il progetto non usa i18n).
- Rimuovi i componenti che restano inutilizzati, dopo aver verificato con una ricerca che non sono usati altrove.

## 7. Verifica (obbligatoria)

Prima di dire che è finito:

- `npm run build` (build di produzione, include il typecheck; il progetto non ha lint) e, se hai toccato componenti con `.spec.ts`, `npx ng test --watch=false --browsers=ChromeHeadless`;
- controllo nel browser a desktop (1440) e mobile (390), **guardando** gli screenshot: overflow, contrasto, tap target, console senza errori;
- prova delle interazioni toccate (filtri, link, form, stati vuoti);
- se hai cambiato token globali (font, colori), controlla almeno la home e un'altra pagina;
- facoltativo: rilancia `impeccable critique` e confronta il punteggio con quello iniziale.

Se qualcosa non passa, dillo con l'errore; non dichiarare successo senza evidenze.

## 8. Chiusura

- Riepilogo breve: cosa è cambiato, cosa è stato verificato (e come), cosa resta aperto o da decidere.
- Commit solo se richiesto, sul branch di lavoro, con messaggio descrittivo; push o PR solo su richiesta esplicita.
