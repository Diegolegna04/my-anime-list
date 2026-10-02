# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Appassionati di anime che tengono la propria lista personale: segnano cosa stanno guardando, a che episodio sono, cosa hanno finito e che voto danno, e cercano cosa guardare dopo. L'uso è ripetuto e frequente, spesso da telefono, in sessioni brevi (aggiornare un episodio, controllare una scheda) alternate a sessioni di esplorazione (classifiche, stagionali, generi).

## Product Purpose
My Anime DB è un tracker di anime ispirato a MyAnimeList. Esiste perché MyAnimeList ha ottimi dati ma un'interfaccia datata e macchinosa. Successo significa: trovare un anime, capire se fa per sé e aggiornarne lo stato nella propria lista in pochi tocchi, e avere un profilo personale che si ha voglia di riaprire.

Il progetto è anche una palestra tecnica personale (Angular Signals, full-stack con backend reale, percorso Claude Academy): le scelte possono privilegiare ciò che insegna qualcosa, purché l'esperienza per il fan resti quella di un prodotto vero.

## Positioning
Gli stessi dati di MyAnimeList (via Jikan) con un'esperienza più pulita e moderna, un tracking più veloce e un profilo davvero personale: anime in evidenza ordinabili, statistiche, preferiti, "Da vedere".

## Operating Context
- Dati anime da Jikan (API non ufficiale di MyAnimeList) tramite il proxy del backend `/api/anime-proxy`, con limiti di frequenza: caricamenti e stati di attesa sono parte normale dell'esperienza.
- Lista utente, profilo e sessione dal backend Quarkus + MongoDB (`../my-anime-list-backend`), con cookie di sessione e "ricordami".
- Frontend su Vercel, backend su Railway.

## Capabilities and Constraints
- Ricerca anime con anteprima dei risultati; classifica top; stagionali; generi, temi e demografiche; anime casuale; scheda di dettaglio con news e consigliati.
- Lista con stati: In visione, Completato, Da vedere, In pausa, Abbandonato; tracciamento episodi; voto sbloccato solo dopo "Completato"; preferiti.
- Profilo (solo dopo login): statistiche, anime in evidenza con drag & drop, impostazioni (foto, password), libreria.
- Registrazione con verifica email, login, recupero e reset password.
- Tema chiaro/scuro; titoli in giapponese o inglese a scelta.
- Aperto: la newsletter in home non è collegata a nessun servizio (il pulsante "Iscriviti" non invia nulla).

## Brand Commitments
- Nome mostrato: **My Anime DB** (il repository si chiama `my-anime-list`).
- Interfaccia solo in italiano, tono informale: si dà del tu all'utente.

## Evidence on Hand
- Dati reali: catalogo Jikan (copertine, titoli, punteggi, generi, news) e liste reali degli utenti dal backend.
- Asset in `public/`: `logo.png`, `logo-circle.png`, `pfp-no-bg.png` (avatar predefinito), sfondi del login.
- Contatto pubblico nel footer: `myanimedb.test@gmail.com`.
- Assenti, da non inventare: utenti, recensioni o testimonianze, numeri di iscritti o attività, partnership, contenuti esclusivi.

## Product Principles
1. Il fan prima di tutto: ogni schermata deve rendere più veloce trovare un anime o aggiornare la propria lista.
2. Più chiaro di MyAnimeList, non più ricco: togliere attrito conta più che aggiungere funzioni.
3. Il profilo è casa dell'utente: personale, curato, che si ha voglia di riaprire.
4. Solo dati veri: ciò che mostriamo arriva da Jikan o dal backend; quando manca, lo diciamo con uno stato vuoto onesto.
5. Telefono come caso normale, non come adattamento.

## Accessibility & Inclusion
Requisito: WCAG 2.1 AA — contrasto testo ≥ 4.5:1 (anche su chip e pulsanti attivi), navigazione completa da tastiera con focus visibile, tap target ≥ 44px, rispetto di `prefers-reduced-motion`, in entrambi i temi.
