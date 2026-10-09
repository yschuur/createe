# Collectiepagina redesign met sectie-editor

## Wat je krijgt
- Per collectie (en per sportpagina Golf/Padel) een eigen indeling van secties, beheerd in **Beheer → Collecties → "Indeling"**.
- Zonder eigen indeling blijft de pagina werken zoals nu (huidige productraster).
- Menu, filters, sortering, productpagina's, winkelmand en checkout blijven ongewijzigd. De filterbalk blijft direct onder de banner staan.

## Sectietypes
1. **Banner**: alleen een afbeelding (desktop + optioneel mobiel), over de volle breedte, originele verhouding, geen tekst/knoppen/afronding.
2. **Gemengd** (standaard): layouts
   - 2 groot links + 4 klein rechts (zoals de referentie, 6-koloms grid)
   - 1 groot links + kleine rechts
   - 1 groot rechts + kleine links
   - alleen klein (gelijke kolommen)
   - alleen groot
3. **Uitgelicht**: alleen grote kaarten, kolommen instelbaar.
4. **Regulier**: kleine kaarten, handmatig gekozen of automatisch uit de huidige collectie (met aantal), kolommen instelbaar.

## Productkaarten
- **Groot**: foto vult kaart, onderaan zachte verloop met naam (serif), materiaal en prijs; label linksboven (bv. BESTSELLER/NEW); kleurstipjes linksonder.
- **Klein**: foto op rustige achtergrond, kleurstipjes linksonder in de foto, naam + prijs eronder, materiaal klein eronder.
- Per product in een sectie: alternatieve kaartfoto (uit Mediabibliotheek), label aan/uit + tekst, en naam/materiaal/prijs/kleuren tonen of verbergen. De productfoto zelf verandert niet.
- Alleen echte producten uit de database; verborgen/uitverkochte status blijft zoals nu werken. Klik opent de bestaande productpagina.
- **Hartje (wishlist)**: er is nog geen verlanglijstje in de shop, dus dat icoon laat ik weg (randvoorwaarde: geen extra functionaliteit).

## Editor
- Lijst van secties met slepen, bewerken, dupliceren, verbergen, verwijderen en "+ Sectie toevoegen".
- Instellingenpaneel per sectie; productkiezer met zoeken, miniaturen, meerdere tegelijk toevoegen, slepen voor volgorde, groot/klein per product.
- Live voorbeeld met schakelaar desktop/mobiel; opslaan maakt het direct zichtbaar.
- Waarschuwing als het aantal producten niet past bij de layout; de site vult dan nooit met lege plekken (overtollige producten lopen door als kleine kaarten, tekort valt weg).
- Verwijderen van een sectie verwijdert nooit producten.

## Responsive
- Desktop: 6-koloms gemengd grid. Tablet: grote kaarten halve breedte, kleine 2-3 kolommen. Mobiel: grote kaarten volle breedte, kleine 2 kolommen, geen horizontaal scrollen.

## Technische details
- Opslag in `site_settings` key `collection_layouts`: `Record<slug, Section[]>`, Zod-gevalideerd, admin-schrijven via bestaande RLS; geen schemawijziging.
- Nieuw `src/lib/collection-layout.ts` (types, registry van sectietypes zodat nieuwe types makkelijk toe te voegen zijn, layout-verdeling als pure functie met tests).
- Render in `src/routes/collections.$slug.tsx` via nieuw `CollectionSections` component; zonder config de huidige weergave. Bestaande "afbeeldingen onder producten" blijven.
- Editor als nieuwe route `/admin/collections/$slug/layout`, hergebruikt MediaField en de storefront-render voor het voorbeeld.
- Regel vastleggen in AGENTS.md.
