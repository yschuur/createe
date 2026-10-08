# Beheeromgeving opschonen

## Probleem
Het beheermenu heeft nu 18 items op één lange lijst, met dubbele plekken voor hetzelfde:
- **Homepage-inhoud** en **Pagina's → Homepage** bewerken allebei de homepage.
- **Contact & FAQ** en **Pagina's → Contact** overlappen (teksten op twee plekken).
- **Design Studio** en **Pagina's → Design Studio** overlappen.
- **Importeren** was een eenmalige actie en hoeft niet permanent in het menu.

## Voorstel: menu groeperen in 4 blokken

```text
VERKOOP
  Bestellingen
  Inzendingen
  Producten
  Collecties
  Sporten
  Acties

WEBSITE
  Pagina's        (alle teksten, foto's en stijl per pagina)
  Menu
  Mediabibliotheek

COMMUNICATIE
  E-mails
  Contact & FAQ   (alleen de FAQ-vragen zelf)

INSTELLINGEN
  Verzending
  Importeren      (onderaan, klein)
```

## Wat verandert concreet

1. **Menu groeperen** — de zijbalk krijgt vier kopjes (Verkoop, Website, Communicatie, Instellingen) met de items eronder. Op mobiel hetzelfde.
2. **"Homepage-inhoud" verwijderen** als apart menu-item. De hero-video's, uitgelichte producten en reviewsbalk komen als extra onderdelen in **Pagina's → Homepage**, zodat alles van de homepage op één plek staat. Bestaande instellingen worden meegenomen, niets gaat verloren.
3. **"Design Studio" verwijderen** als apart menu-item. De scorecard-reviews en kleurfoto's verhuizen naar **Pagina's → Design Studio**.
4. **"Contact & FAQ" behouden, maar slanker**: alleen de FAQ-vragen en -categorieën. De teksten rond het formulier bewerk je voortaan via **Pagina's → Contact**.
5. **"Beleidspagina's" verhuist** naar een onderdeel binnen **Pagina's** (eigen kaart "Juridische pagina's"), zodat alle paginateksten bij elkaar staan.
6. **"Importeren"** verhuist naar Instellingen onderaan — het blijft beschikbaar maar staat niet meer prominent.

Resultaat: van 18 losse items naar 12 items in 4 duidelijke groepen, met één vaste plek per onderwerp.

## Technische aanpak
- AdminLayout: gegroepeerde navigatie met sectiekoppen.
- Pagina's-CMS (PAGE_DEFS) uitbreiden met de onderdelen die nu in admin.homepage, admin.studio en admin.policies zitten; bestaande site_settings-keys (homepage, studio, policies) blijven de opslag, dus geen datamigratie.
- Routes /admin/homepage, /admin/studio, /admin/policies verwijderen (of doorverwijzen naar de nieuwe plek).
- Contact-admin afslanken tot FAQ-beheer.
- Storefront leest dezelfde settings-keys; aan de voorkant verandert niets.
