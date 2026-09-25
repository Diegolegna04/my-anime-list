# DESIGN.md — sistema visivo di My Anime List

Tutte le pagine parlano lo stesso linguaggio visivo, preso dalla **home** (è il riferimento: se un dubbio non è coperto qui, guarda com'è fatta la home).

- **Banner viola sfumato** per l'intestazione di pagina.
- **Pannelli bianchi** (grigio scuro nel tema scuro) con ombra morbida.
- **Titoli di sezione** con la barretta viola.
- **Pulsanti a pillola** viola.
- **Card** per gli anime.

Token e classi stanno in `src/styles.css`. I componenti li usano e non ridefiniscono valori propri.

## Regole

1. **Nessun colore scritto a mano nei componenti.** Si usano i token `var(--…)`. Uniche eccezioni:
   - `#fff` per testo e icone sopra superfici viola;
   - i `rgba(255,255,255,x)` dentro i banner.
2. **I token-ombra sono ombre complete**: `box-shadow: var(--shadow-medium)`. Non vanno mai usati come colore, per esempio `0 4px 8px var(--shadow-medium)` oppure `border: 4px solid var(--shadow-medium)`: il browser scarta tutta la dichiarazione.
3. **Viola:**
   - `--accent-color` si usa come *sfondo* (pulsanti, stati attivi), con testo bianco.
   - `--accent-text` si usa per *testo e icone* viola sullo sfondo della pagina: link, etichette, icone.
   - `--accent-soft` si usa per sfondi tenui (chip, icone in tondo, anelli di focus leggeri).
4. **Stati semantici:**
   - `--success-color`, `--warning-color`, `--error-color`, `--info-color`, ciascuno con il suo `*-bg`;
   - per la lista anime `--status-watching / completed / plan / on-hold / dropped`.
   - Hanno varianti per il tema scuro già incluse. **Mai** pastelli fissi come `#E3F2FD` o `#FFF3E0`.
5. **Icone: solo Font Awesome** (`<i class="fas fa-…" aria-hidden="true">`).
   - Mai emoji come icone (📺🎬🌟✅…).
   - La versione caricata è la 6.0.0-beta3: usa nomi compatibili con v5/v6, come `fa-tv`, `fa-film`, `fa-star`, `fa-check-circle`, `fa-eye`, `fa-play-circle`, `fa-pause-circle`, `fa-times-circle`, `fa-bookmark`, `fa-heart`.
6. **Forma:**
   - `--radius-sm` (8) per elementi piccoli;
   - `--radius-md` (12) per card e campi;
   - `--radius-lg` (16) per pannelli e banner;
   - `--radius-pill` o `30px` per i pulsanti.
7. **Movimento:**
   - transizioni di `--dur-fast` (0.18s) con `--ease-out` per hover e stati;
   - niente `transition: all`;
   - al massimo `translateY(-2px/-3px)` al passaggio del mouse.
   - Il rispetto di `prefers-reduced-motion` è globale.
8. **Un solo spinner** (`.spinner`, `.spinner-sm` nei pulsanti) e **una sola `@keyframes spin`**, quella globale. Non ridefinirla nei componenti.
9. **Focus da tastiera:** l'anello globale `:focus-visible` c'è già. Non va rimosso con `outline: none` a meno di sostituirlo con un'alternativa visibile, per esempio bordo accento più `box-shadow: 0 0 0 3px var(--accent-ring)`.
10. **Tema scuro:** tutto deve funzionare con `.dark-theme` sull'`<html>` usando solo i token. Nei componenti non servono regole `:host-context(.dark-theme)`, salvo casi davvero eccezionali.

## Struttura di una pagina interna

```html
<div class="page">
  <header class="page-hero">
    <a routerLink="/genres" class="page-hero-back"><i class="fas fa-arrow-left" aria-hidden="true"></i> Tutti i generi</a>  <!-- opzionale -->
    <h1 class="page-hero-title">Titolo</h1>
    <p class="page-hero-lead">Una o due frasi.</p>                   <!-- opzionale -->
    <div class="page-hero-meta"><span class="chip chip-glass">…</span></div>  <!-- opzionale -->
    <div class="page-hero-actions"><button class="btn btn-light">…</button><button class="btn btn-glass">…</button></div>  <!-- opzionale -->
  </header>

  <section class="panel">
    <div class="section-header">
      <h2 class="section-title">Sezione <span class="section-count">24</span></h2>
      <div class="section-controls">…</div>
    </div>
    …contenuto…
  </section>
</div>
```

- Il **banner** (`.page-hero`) si usa **una volta per pagina**. La home ha il suo banner più grande, `hero-section`.
- Nei **pannelli** (`.panel`) si usano `.section-header`, `.section-title` e `.section-controls`.

## Componenti

| Classe | Uso |
|---|---|
| `.btn .btn-primary` | Azione principale: pillola sfumata viola, come "Carica altri anime". Taglie `.btn-sm`, `.btn-lg`, `.btn-block`. |
| `.btn .btn-secondary` | Azione secondaria: fondo neutro con bordo. |
| `.btn .btn-ghost` | Azione di contorno, solo testo viola. |
| `.btn .btn-danger` | Azione distruttiva (logout, rimuovi). |
| `.btn .btn-light` / `.btn .btn-glass` | Pulsanti sopra i banner viola. |
| `.btn-icon` | Pulsante tondo 38px con sola icona. Attivo: `.active` o `aria-pressed="true"`. |
| `.segmented` | Opzioni esclusive, come griglia/lista, filtri, ordinamento, stato. Pulsanti figli con `.active` o `aria-pressed`. |
| `.field` `.field-label` `.input` `.select` `.input-icon` `.field-error` `.field-hint` | Form. |
| `.input-action` | Pulsante dentro `.input-icon`, a destra, per esempio mostra/nascondi password. |
| `button.link` | Pulsante con l'aspetto di un link di testo, per esempio "Registrati" o "Accedi". |
| `.spinner` / `.spinner-sm` / `.loading-state` / `.skeleton` | Caricamento. |
| `.state` (`.state-error`, `.state-success`, `.state-compact`) `.state-icon` `.state-title` `.state-text` | Vuoto, errore e successo, sempre con un'azione `.btn` se utile. Dentro `.auth-card` il padding è già azzerato. |
| `.alert .alert-error/-success/-info/-warning` | Messaggio in linea. |
| `.chip` / `.chip-glass` | Etichette (generi) e link a pillola. |
| `.badge .badge-success/-warning/-error/-info/-accent` oppure `style="--tone: var(--status-watching)"` | Etichetta di stato colorata. |
| `.anime-grid` / `.anime-list` | Griglia e lista di card anime. |
| `.auth-page` `.auth-card` `.auth-card-icon` `.auth-title` `.auth-subtitle` `.auth-footer` | Pagine di login, password, verifica email e simili. |

## Altri token

- `--highlight-color`, `--highlight-hover` e `--highlight-gradient`: l'arancione della home (etichette HOT e della stagione, pulsante della newsletter). Si usano solo lì.
- `--star-color`: le stelle del voto.
- `--header-height`: l'altezza dell'header, da usare nelle pagine a tutta altezza, per esempio `min-height: calc(100vh - var(--header-height))`.

## Colori delle categorie di generi

Si impostano con `--cat-genres`, `--cat-themes`, `--cat-demographics` e `--cat-explicit`: viola, verde acqua, ambra e rosso, con varianti per il tema scuro.
