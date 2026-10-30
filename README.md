# CREATEE

Ik wil graag mijn Shopify store vervangen. Ik heb maar een paar producten en wil graag een simpele, maar creatieve voorkant maken. Daar achter moet een beheerpaneel zitten waar ik producten kan opvoeren, acties kan maken, collecties kan maken etc.

Ik wil van Shopify af, ook van de Shopify-abonnementskosten. Ik verkoop fysieke producten. Ik wil verzending handmatig afhandelen. Producten hebben meerdere opties/varianten zoals kleur en maat met voorraad per variant. Neem alleen producten en actuele voorraad mee, geen bestelgeschiedenis of klantaccounts.

AANGELEVERDE BESTANDEN ZIJN DE SOURCE OF TRUTH
Bij deze opdracht zijn vier bestanden aangeleverd:
createe_logo_favicon.png
logo_golf_wit.png
logo_golf_groen.png
products_export_1.csv
Gebruik deze bestanden daadwerkelijk in de website.
Verzin geen vervangende logo's, tijdelijke merknamen, dummy-producten of alternatieve branding.
LOGO'S EN FAVICON
Er zijn drie officiële CREATEE-assets aangeleverd.
1. Favicon / beeldmerk
Bestand:
createe_logo_favicon.png
Dit is het ronde CREATEE-beeldmerk met de letter C.
Gebruik dit bestand voor:
favicon
browser icon
app icon waar relevant
eventueel kleine compacte merktoepassingen
Maak geen nieuw favicon en teken het logo niet opnieuw na.
2. Wit CREATEE-logo
Bestand:
logo_golf_wit.png
Dit is het officiële horizontale CREATEE-woordmerk in wit.
Gebruik dit logo op donkere of groene achtergronden, bijvoorbeeld:
donkere header
donkere footer
donkere hero
groene vlakken
Gebruik bij voorkeur het echte afbeeldingsbestand in plaats van CREATEE als gewone tekst met een vergelijkbaar font.
3. Groen CREATEE-logo
Bestand:
logo_golf_groen.png
Dit is het officiële horizontale CREATEE-woordmerk in groen.
Gebruik dit logo op:
witte achtergronden
lichte achtergronden
lichte navigatie
overige plekken waar het groene logo voldoende contrast heeft
LOGOGEBRUIK
Behandel deze bestanden als officiële brand assets.
Regels:
verander de verhoudingen niet
vervorm het logo niet
voeg geen effecten toe
voeg geen slagschaduw toe
verander de kleuren niet
plaats geen alternatieve tekstversie wanneer het officiële logo beschikbaar is
behoud voldoende witruimte rondom het logo
schaal proportioneel
zorg dat de logo's scherp blijven op mobiel en desktop
Maak een herbruikbare Logo-component waarbij automatisch gekozen kan worden tussen:
white
green
favicon
afhankelijk van de achtergrond.
PRODUCTDATA
Gebruik:
products_export_1.csv
als primaire databron voor de initiële productcatalogus.
Dit is een export van de huidige Shopify-webshop.
De export bevat:
274 regels
39 unieke producten
product handles
producttitels
HTML productomschrijvingen
vendor
Shopify productcategorie
producttype
tags
publicatiestatus
varianten
kleuren
maten
SKU's
voorraad
prijs
vergelijkingsprijs
productafbeeldingen
afbeeldingvolgorde
alt-teksten
SEO title
SEO description
product metafields
fit
materiaal
hals
mouwtype
gender
Shopify-status
overige productmetadata
Gebruik deze data om de initiële Supabase-productdatabase te vullen.
Maak GEEN dummy-producten wanneer deze CSV beschikbaar is.
SHOPIFY CSV IMPORTER
Bouw een herbruikbare importfunctie voor Shopify CSV exports.
Deze importer moet herkennen dat Shopify één product over meerdere regels verdeelt.
Gebruik Handle als primaire sleutel om regels bij hetzelfde product te groeperen.
Voorbeeld:
meerdere regels met:
fairway-to-heaven
horen bij één product met meerdere varianten en afbeeldingen.
Maak dus NIET voor iedere CSV-regel een apart product.
PRODUCTMAPPING
Map de Shopify CSV naar Supabase.
products
Gebruik onder andere:
Handle → slug
Title → name
Body (HTML) → description_html
Vendor → vendor
Product Category → product_category
Type → product_type
Tags → tags
Published → published
SEO Title → seo_title
SEO Description → seo_description
Status → status
Voeg daarnaast toe:
id
created_at
updated_at
featured
sort_order
Gebruik de bestaande Shopify Handle zoveel mogelijk als URL slug om bestaande URLs te behouden.
PRODUCTVARIANTEN
Iedere unieke combinatie van Shopify-opties moet een variant worden.
Gebruik:
Option1 Name
Option1 Value
Option2 Name
Option2 Value
Option3 Name
Option3 Value
Variant SKU
Variant Price
Variant Compare At Price
Variant Inventory Qty
Variant Inventory Policy
Variant Barcode indien aanwezig
Variant Image
Variant Weight
Variant Weight Unit
De huidige export gebruikt onder andere:
Kleur
Maat
Normaliseer deze naar een nette variantstructuur.
Bijvoorbeeld:
Product:
Fairway to Heaven
Varianten:
White / S
White / M
White / L
White / XL
enzovoort.
Sla optie-informatie flexibel op zodat later eventueel meer dan kleur en maat ondersteund kan worden.
VOORRAAD
Importeer:
Variant Inventory Qty
als initiële voorraad per variant.
Behoud voorraad per variant en NIET alleen per product.
Als:
Variant Inventory Policy = deny
mag een uitverkochte variant niet besteld kunnen worden.
Let op:
de CSV kan uitzonderlijke of negatieve voorraadwaarden bevatten.
Importeer deze data niet blind als direct verkoopbare voorraad.
Gebruik bij import:
available_stock = max(0, imported_inventory_qty)
Bewaar indien gewenst de oorspronkelijke Shopify-waarde apart voor migratie/audit.
PRODUCTSTATUS
Respecteer:
active
draft
unlisted
Producten met status active en Published = true mogen publiek zichtbaar zijn.
Draft-producten mogen alleen vanuit het adminpanel zichtbaar zijn.
Unlisted-producten mogen niet standaard in collectieoverzichten verschijnen.
Maak dit beheerbaar vanuit /admin/products.
PRODUCTTYPES
De huidige export bevat onder andere producttypes zoals:
ORGANISCH KATOEN
HYBR™ POLO
RELAXED FIT
EXTREEM ZACHT
Behoud deze waarden.
Gebruik ze niet automatisch als hoofdcollectie.
Producttype en collectie zijn afzonderlijke concepten.
PRODUCTAFBEELDINGEN
Gebruik Image Src voor de initiële productafbeeldingen.
Importeer:
afbeelding URL
Image Position
Image Alt Text
en behoud de oorspronkelijke volgorde.
Download afbeeldingen bij voorkeur tijdens migratie naar Supabase Storage, zodat de uiteindelijke website niet afhankelijk blijft van Shopify CDN.
Gewenste migratie:
Shopify Image Src
→ download image
→ Supabase Storage
→ sla nieuwe Supabase URL op bij product_images
Gebruik afbeeldingpositie voor:
sort_order.
Maak de eerste afbeelding de primaire afbeelding tenzij anders bepaald.
VARIANTAFBEELDINGEN
Wanneer Variant Image aanwezig is:
koppel deze afbeelding aan de betreffende variant.
Dit is vooral belangrijk wanneer verschillende kleuren eigen productfoto's hebben.
Op de productpagina moet het selecteren van een kleur indien mogelijk automatisch de bijbehorende afbeelding tonen.
PRODUCTBESCHRIJVING
Body (HTML) bevat bestaande Shopify HTML.
Behoud de inhoud, maar sanitize deze voordat deze op de frontend wordt gerenderd.
Verwijder geen bestaande inhoud zonder reden.
Zorg dat eenvoudige HTML zoals:
paragraphs
bold
lists
line breaks
links
correct weergegeven blijft.
PRODUCT METAFIELDS
Importeer relevante aanwezige Shopify metafields.
De export bevat onder andere:
Fit
Color
Fabric
Neckline
Size
Sleeve length type
Target gender
Age group
Maak hiervoor eventueel een JSONB-kolom:
metadata
of afzonderlijke kolommen wanneer het veld structureel op de frontend wordt gebruikt.
Mijn voorkeur:
gebruik normale databasevelden voor eigenschappen die in de webshop gebruikt worden en JSONB voor overige Shopify-metadata.
Bijvoorbeeld:
fit
fabric
target_gender
metadata JSONB
SEO
Importeer waar beschikbaar:
SEO Title
SEO Description
Behoud bestaande handles/slugs.
Het doel is dat bestaande product-URL's na de migratie zoveel mogelijk gelijk blijven.
Maak dus bij voorkeur:
/products/{handle}
of behoud exact de bestaande URL-structuur wanneer dit praktisch mogelijk is.
Bestaande producten
De huidige export bevat daadwerkelijk de bestaande CREATEE-productcatalogus.
Enkele voorbeelden zijn:
Al Parcino
Andy Warhole
At the 19th
Bandéjà Vu
Big Birdie Energy
Bob Parley
Bogeymian Rhapsody
David Bogey
Designated Driver
Eagles Eye
Fairway to Heaven
Fore Golf
Harry Putter
Hoppa!
King of the Court
Let's go
Life on the green
Dit zijn voorbeelden ter verificatie.
Gebruik NIET alleen deze voorbeeldproducten.
Importeer alle unieke producten uit het aangeleverde CSV-bestand.
SPECIAAL PRODUCT: CREATEE DESIGN STUDIO
De CSV bevat ook een product:
CREATEE Design Studio
Behandel dit niet automatisch als een standaard kledingproduct.
De Design Studio heeft een eigen formulier- en aanvraagflow zoals elders in deze opdracht beschreven.
Controleer tijdens import of dit product apart behandeld moet worden.
Voorkom dat voorraadlogica voor fysieke kleding zonder nadenken wordt toegepast op deze service.
DATA-IMPORT IN ADMIN
Voeg in /admin een eenvoudige importmogelijkheid toe:
Instellingen → Importeren
Ondersteun:
Shopify Product CSV
Flow:
CSV uploaden
CSV valideren
toon aantal gevonden producten
toon aantal varianten
toon eventuele fouten
toon preview
gebruiker bevestigt import
importeer producten
importeer varianten
importeer afbeeldingen
toon resultaat
Gebruik Handle om bestaande producten te herkennen.
Als een product met dezelfde handle al bestaat:
bied keuze tussen:
overslaan
bijwerken
Voorkom dubbele producten.
IMPORTVEILIGHEID
Een CSV-import moet niet direct productdata vernietigen.
Gebruik:
validatie
transactions waar mogelijk
foutmeldingen per regel
logging
duplicate detection
Geef na import bijvoorbeeld:
39 producten gevonden
X producten aangemaakt
X producten bijgewerkt
X varianten aangemaakt
X afbeeldingen verwerkt
X fouten
DATABASESTRUCTUUR PRODUCTEN
Gebruik minimaal:
products
id
slug
name
description_html
vendor
product_category
product_type
tags
status
published
featured
fit
fabric
seo_title
seo_description
metadata
created_at
updated_at
product_variants
id
product_id
sku
color
size
option1_name
option1_value
option2_name
option2_value
option3_name
option3_value
price
compare_at_price
inventory_quantity
allow_backorder
barcode
weight
weight_unit
active
created_at
updated_at
product_images
id
product_id
variant_id nullable
storage_path
source_url
alt_text
sort_order
is_primary
EERSTE BUILD
Gebruik bij de eerste build dus meteen:
de aangeleverde officiële logo's
de favicon
de bestaande CREATEE-productcatalogus uit de Shopify-export
Ik wil bij het openen van de eerste bruikbare versie geen webshop zien met:
Product 1
Product 2
Sample Shirt
Lorem ipsum
placeholder branding
maar zoveel mogelijk de echte CREATEE-webshop.
BELANGRIJKE MIGRATIEREGEL
De huidige Shopify-webshop blijft tijdens de ontwikkeling live.
De nieuwe Lovable-site moet daarom eerst volledig los daarvan worden gebouwd.
Pas als:
productdata correct is
afbeeldingen correct zijn
Stripe werkt
orders correct binnenkomen
mobiele website gecontroleerd is
redirects geregeld zijn
admin werkt
wordt createe.nl naar de nieuwe website omgezet.
Verander tijdens ontwikkeling niets aan de live Shopify-webshop.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://createe.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/366dcb29-2746-4301-aef3-60299296764b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
