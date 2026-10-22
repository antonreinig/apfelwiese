# NFC: offene Namenszuordnungen

Stand 22.10.2026, erzeugt von `daten/skripte/nfc_aufbereiten.py`. In diesen Fällen bleibt in `sorten_nfc.json` der NFC-Name stehen. Eine Übernahme des deutschen Namens braucht einen Beleg (pomologisches Werk, Sortenliste, Wikipedia-Artikel mit Synonymliste).

## 1. Deutscher Name vermutet, nicht bestätigt (12)

Der Wikipedia-Artikel zum vermuteten deutschen Namen fehlt oder nennt den NFC-Namen nicht.

| NFC-Name | vermuteter deutscher Name | MUNQ | Prüfergebnis |
|---|---|---|---|
| Brabant Bellefleur | Brabanter Bellefleur | 1 | kein_artikel |
| Court Pendu Plat | Königlicher Kurzstiel | 105 | kein_artikel |
| Cox's Pomona | Cox' Pomona | 2033 | kein_artikel |
| Heusgen's Golden Reinette | Heusgens Goldrenette | 3176 | kein_artikel |
| Lane's Prince Albert | Lanes Prinz Albert | 943 | kein_artikel |
| London Pippin | Londoner Pepping | 84 | kein_artikel |
| Mother | Lavanttaler Bananenapfel | 488 | artikel_unsicher (Lavanttaler Bananenapfel) |
| Reinette Coulon | Coulons Renette | 630 | kein_artikel |
| Rhode Island Greening | Grünling von Rhode Island | 806 | kein_artikel |
| Rome Beauty | Morgenduft | 334 | kein_artikel |
| Royal Jubilee | Grahams Jubiläumsapfel | 72 | kein_artikel |
| White Transparent | Weißer Klarapfel | 25 | artikel_unsicher (Weißer Klarapfel) |

## 2. MUNQ-Vorzugsname ist ein deutscher Name, der vom NFC-Namen abweicht (21)

Laut MUNQ-Tabelle (Denancé et al. 2020) gehört die NFC-Akzession genetisch zu einer Sorte, deren Vorzugsname deutsch ist. Das kann ein echtes Synonym sein oder eine Fehlbenennung in einer der Sammlungen. Ohne pomologische Prüfung nicht übernommen.

| MUNQ | NFC-Namen | MUNQ-Vorzugsname | Name in sorten_nfc.json |
|---|---|---|---|
| 2782 | Altlander Fettapfel | Fettapfel | Altländer Fettapfel |
| 2828 | Appel van Paris | Apfel des Paris | Appel van Paris |
| 13 | Bloody Ploughman | Roter Herbstkalvill | Bloody Ploughman |
| 176 | Bossom (Loxwood) | Gelber Richard | Bossom (Loxwood) |
| 2721 | Doctor Ramburg | Wöbers Rambur | Doctor Ramburg |
| 2889 | Finkenwerder Prinz | Finkenwerder Prinzenapfel | Finkenwerder Herbstprinz |
| 602 | Florianer Rosenapfel | Alantapfel | Florianer Rosenapfel |
| 898 | Fraise de Buhler | Bühlers Erdbeerapfel | Fraise de Buhler |
| 313 | Hamvas Alma | Brauner Matapfel | Hamvas Alma |
| 1028 | Lovacka Reneta | Schöner aus Miltenberg | Lovacka Reneta |
| 1052 | Nemes Szercsika Alma | Grüner Stettiner | Nemes Szercsika Alma |
| 736 | Notarisappel | Notarisapfel | Notarisappel |
| 592 | Orenco, Ivo | Ivöäpple | Orenco |
| 750 | Rod Tonnes | Tönnes | Rod Tonnes |
| 670 | Roter Sauergrauech | Sauergrauschapfel | Roter Sauergrauech |
| 1015 | Schmidtbergers Rote Reinette | Schmidtberger Renette | Schmidtbergers Rote Renette |
| 1867 | Torstein, Red Torstein | Röd Torstein | Torstein |
| 2984 | Vlaanderens Roem Rode Boskoop | Roter Hauptmann | Vlaanderens Roem Rode Boskoop |
| 1051 | Welschisner | Böhmischer Brünnerling | Welschisner |
| 843 | Wheeler's Russet, Pinner Seedling | Osnabrücker Renette | Wheeler's Russet |
| 1045 | Ye Old Peasgood | Langtons Sondergleichen | Ye Old Peasgood |

## 3. MUNQ-Gruppen mit mehreren NFC-Namen (168)

Nach Vorgabe zusammengefasst (gleiche MUNQ = gleicher Genotyp). Enthalten sind oft Mutanten (z. B. rote Sports), Klone und Fehlbenennungen. Nur der Sortenname wird geführt; die übrigen Namen stehen unter `akzessionen`, nicht als Synonyme. Prüfen, ob Mutanten eigene Einträge brauchen.

| MUNQ | Name in sorten_nfc.json | weitere NFC-Namen |
|---|---|---|
| 308 | Akero | Idaho Delicious |
| 96 | Alkmene | Ceeval, Red Alkmene |
| 328 | Anisa | Apez Zagarra |
| 583 | Antonovka-kamenichka | Byeloborodovka |
| 394 | Api Rose (Creuse) | Blandurette |
| 80 | Aroma | Amorosa |
| 914 | Baker's Delicious | Wax Apple |
| 849 | Baldwin | Stafner Rosen, Double-Red Baldwin |
| 597 | Barnack Beauty | Barnack Beauty sport |
| 42 | Baxter's Pearmain | Golden Reinette |
| 11 | Beauty of Bath | Crimson Beauty of Bath LA 65A, Beauty of Bath (formerly Tim's Early |
| 370 | Beauty of Hants (Myers) | Summer Blenheim |
| 707 | Beauty of Kent | Contessa |
| 36 | Belle de France | Crawley Beauty |
| 259 | Belle des Buits | Paradis du Limosin |
| 40 | Benoni | Red Benoni |
| 459 | Beurriere | Normandie (Switzerland) |
| 3 | Bismarckapfel | Bismarck, Maid of Kent |
| 106 | Black Ben Davis | Black David |
| 117 | Blaxtayman | Dark Red Staymared, Stayman's Winesap, Scarlet Staymared, Wang Young |
| 108 | Boikenapfel | Boiken, Hosskreiger |
| 166 | Bouquepreuve | Bonnet de Comte |
| 1 | Brabant Bellefleur | Reaux, De Flandre (Aube), Franc-Bon-Pommier Mpselle) |
| 611 | Bramley's Seedling | Crimson Bramley |
| 473 | Broad-Eyed Pippin (of Bultitude) | Betty Geeson |
| 827 | Burr Knot (Howard) | Genet Moyle |
| 909 | Calville des Femmes | Hohenzollern |
| 241 | Canvada | Willie Sharp |
| 564 | Caroline | Patrick |
| 693 | Chantegrise | Chantecler |
| 245 | Charles Ross | Red Charles Ross |
| 290 | Chelmsford Wonder | Mitchelson's Seedling, Horsford Prolific |
| 7802 | Chiloe | A434-10 |
| 213 | Cornish Pine | Red Ribbed Greening |
| 163 | Cox Orange | Cox's Orange Pippin, Queen Cox (Maclean), Cox's Orange Pippin (Otago), Cox's Orange Pippin (Potter), Crimson Cox, King Cox (Giles), Kortegaard Cox, Cox's Orange Pippin (Vinson), Queen Cox, Cox's Orange Pippin spur type (Alof M27), Cox Rouge des Flandres (HTC), Cherry Cox (Stogden), Frydeland Cox, Clarke's Royal, Cox's Orange Pippin (Vegi Cox), Cox La Vera, Red Cox, Cox Self-Fertile Clone 4, Cox Self-Fertile Clone 9 |
| 641 | Cravert | Cravert Rouge |
| 911 | Crimson King | Old English Round |
| 770 | Csikos Orias Halasi | Vajki Alma, Bloody Butcher |
| 740 | Daru Sovari | Harang Alma, Sovari Nobil (of Romania) |
| 683 | Delcorf | Dalili |
| 786 | Devonshire Buckland | Winter Peach |
| 75 | Discovery | Discovery Spur Type, Discovery Original Tree 1, Discovery Original Tree 2 |
| 678 | Dukat | Shenandoah, Dukat Spur type |
| 864 | Earl Cowper | Tower of Glamis (Scott) |
| 777 | Einset 8 | New York (E18) |
| 137 | Elstar | Daliest, Red Elstar, Bel-el, Elnica, Elshof, Elstar Reinhardt |
| 348 | Epicurean | Epicure |
| 284 | Falstaff | Red Falstaff |
| 349 | Fisher Fortune | Laxton's Fortune, Red Fortune |
| 202 | Franc Roseau | Desse de Buff |
| 318 | Fuji | New Fuji, Fuji INRA Type 4 - Nagafu (No2) INFEL 6671 |
| 739 | Gala | Tenroy (Royal Gala), Prince Gala/Regal Prince, Galaxy, Imperial Gala |
| 853 | Galantine (Savoie) | Verdese |
| 4674 | Geeveston Fanny | Red Geeveston Fanny |
| 65 | Golden Delicious | Golden Delicious (Vinson), Yellospur, Goldspur, Ed Gould Golden, Golden Morspur, Golden Delicious Horst No. 2, Doud Golden Delicious, Goldensheen, Nugget, Testerspur Golden Delicious, Skinlite, Golden Auvilspur, Golden Delicious Russet Form, Lysgolden, Golden Delicious Kloon B, Smoothee, Starkspur Golden Delicious, Courtagold, Elbee, Penco |
| 37 | Goldparmäne | King of the Pippins, King Russet, Rote Goldparmane, Baunen, Goldparmane (Wadenswil) |
| 376 | Goldrenette von Blenheim | Aldenham Blenheim, Red Blenheim (Wastie), Blenheim Orange |
| 51 | Goldrenette von Peasgood | Crimson Peasgood, Peasgood's Nonsuch |
| 548 | Granny Smith | Granny Smith (spur type) |
| 758 | Gravensteiner | Gravenstein, All-Red Gravenstein, Morkrod |
| 529 | Green Roland | Queen Anne, Christie Manson |
| 766 | Grey Pippin | Cockle Pippin |
| 624 | Grimoldby Golden | Cooper's Seedling |
| 653 | Grosse de Saint-Clement | Grand'mere |
| 200 | Gustavs Dauerapfel | Gustav's Dauerapfel, Love Beauty |
| 269 | Hibernal | Luzhanka |
| 152 | Histon Favourite | Richardson (Ireland) |
| 549 | Hocking's Green | John Broad |
| 803 | Holsteiner Cox | Holstein Mahler, Holstein Palloks, Holstein, Holstein sport |
| 32 | Ingrid Marie | Karin Schneider (Red Ingrid Marie) |
| 78 | James Grieve | Erich Neumanns Roter, James Grieve Lired, Redcoat Grieve spur type (Illiffe), Redcoat Grieve (Illiffe) |
| 382 | Jeanne Hardy | Belle de Pontoise |
| 170 | Jincoa Zagarra | Eri Zagarra |
| 901 | Jonagold | Wilmuta, New Jonagold, Rubinstar, Jonagored, Jonica, Jomured, Decosta, Jorayca, Jored, Jonagold Boerekamp, Josegold, Prince Jonagold D'H, Crowngold, King Jonagold, Red Jonaprince, Veekman's Jonaster, Excel, Jonagored (Supra) |
| 57 | Jonathan | Jonared (Matthews), Blackjon, Jonathan 15 Welday, Jonathan 19 Welday, Kapai Red Jonathan |
| 30 | Kaiser Alexander | Alexander, Douce de Hollande |
| 294 | Kanadarenette | Reinette Grise du Canada, Reinette du Canada |
| 565 | Kansas Queen | San Peinte |
| 584 | Kidd's Orange Red | Captain Kidd |
| 257 | King Charles Pearmain | Rushock Pearmain |
| 556 | King's Acre Bountiful | White Melrose |
| 476 | Lady Sudeley | Red Sudeley |
| 875 | Lady of the Wemyss | Nelson's Codlin (supposed) |
| 253 | Lagree (Loire Atlantique) | Bastien |
| 661 | Lamb's Seedling | Rivers' Nonsuch, Renown |
| 140 | Lange's Perfection | Flower of the Town |
| 822 | Laxton's Pearmain | Taunton Cross |
| 667 | Laxtons Superb | Maxton, Russet Superb, Red Laxton's Superb, Crimson Superb, Laxton's Superb, Laxton's Superb NFT clone |
| 708 | Limoncella | Cola |
| 649 | Lodi | Nico |
| 129 | Lord Derby | Lord Derby spur type, Harvest Lemon |
| 254 | Lord Lambourne | Russet Lambourne, Lady Lambourne |
| 728 | Lorna Doone | Court Royal |
| 335 | Lucullus | Prins Bernhard |
| 638 | M9 | Dermen McIntosh |
| 320 | MM 111 | Rouge des Antis |
| 355 | Mabbott's Pearmain | Stead's Reinette |
| 115 | Maltster | Leeders Perfection |
| 761 | Margaret | Summer Apple |
| 354 | Martini | Marosszeki Piros Paris, Red Martini |
| 70 | Mauss Reinette | Rosii de Geoagiu |
| 508 | McIntosh | Black McIntosh (EM), Alexis, Black Mickey, Red Fameuse, Starkspur McIntosh, Kimball McIntosh, Johnson McIntosh, Rogers McIntosh |
| 447 | McLiver's Winesap | Dermen Winesap |
| 101 | Mela Carla | Rosa del Caldaro |
| 167 | Melba | Red Melba, Hunter Melba |
| 526 | Melrose (2) | Marstar, Dugamel |
| 240 | Meri Cretesti | Cretesc Rosu |
| 801 | Miller's Seedling | Red Miller |
| 158 | Millicent Barnes | Millicent Barnes Sport |
| 716 | Milton | Karina |
| 488 | Mother | Queen Mary |
| 141 | Mrs. Phillimore | Sweet Merlin |
| 874 | Mutsu | Mutsu spur type |
| 203 | Nanny | Keed's Cottage, Queenby's Glory, Chips |
| 823 | New German | Lady's Delight |
| 742 | Newton Wonder | Marston Scarlet Wonder, Crimson Newton, Red Newton Wonder |
| 787 | Newtown Pippin | Yellow Newtown Pippin |
| 824 | Norfolk Royal | Norfolk Royal Russet |
| 23 | Northern Spy | Double Red Northern Spy, Geneva Ontario, Crimson Spy, Kinkead Red Spy, Hunter Kinkead Spy, Loop Spy (654) |
| 794 | Nottingham Pippin | Lemon Queen |
| 592 | Orenco | Ivo |
| 249 | Orleans | Quindell |
| 692 | Ozark Gold | Missouri |
| 128 | Parkers Pepping | Parker's Pippin, Aromatic Russet (Scott) |
| 680 | Peacemaker | Guelph |
| 237 | Pepin d'Or de Bovelingen | Rambour Podolski |
| 127 | Perthyre | Broadleaf Norman |
| 63 | Pfirsichroter Sommerapfel | Rozovoe iz Tartu |
| 804 | Pixie | Red Pixie |
| 143 | Polly | Reynolds Peach |
| 657 | Prinz Albrecht von Preußen | Prinz Albrecht von Preussen, Fairy (Cormack) |
| 264 | Pusztai Sarga | Steirischer Roter Marschansker |
| 53 | Red Ellison's Orange | Ellison's Orange (McCarroll) |
| 557 | Red Statesman | Statesman Red Sport |
| 769 | Red Victoria | Sweet Caroline |
| 285 | Reine des Pommes | Langworthy |
| 478 | Reinette de Macon | Acklam Russet |
| 461 | Rheinischer Krummstiel | Gronsvelder Klumpke |
| 334 | Rome Beauty | Red Rome (Australia), Glengyle Red, Double Red Rome Beauty, Ruby Rome Beauty, Nured Rome, Barkley Red Rome |
| 854 | Roter Stettiner | Cigany Alma |
| 872 | Rougemont | Excelsior, Bellaqueeny |
| 775 | Roundway Magnum Bonum | Breitling |
| 690 | Rubin | Bohemia |
| 743 | Ruzena Blahova | Libovicka Renata |
| 614 | Sandlin Duchess | Grange's Pearmain, Dick's Favourite |
| 814 | Sandow | Hunter Sandow |
| 573 | Savstaholm | P.J. Bergius |
| 886 | Schöner aus Boskoop | Belle de Boskoop, Red Belle de Boskoop, Wilhelm Ley, Botden, Bielaar |
| 220 | Seabrook's Red | Red Musk |
| 706 | Sharleston Pippin | Evagil, Yellow Pitcher |
| 295 | Siddington Russet | Galloway Pippin |
| 287 | Sikulai-alma | Rosioare Calugaresti |
| 845 | Small's Admirable | Captain Broad |
| 601 | Sops in Wine | Devon Crimson Queen |
| 309 | Spartan | Spartan (compact) (10c-6-43-1), Spartan 4n (Sweden), Spartan 4n (Scotland), Hunter Spartan, Spartan 4n No. 3 |
| 448 | Starking | Stark's Late Delicious, Wellspur, Starkspur Supreme, Richared Delicious, Starkrimson, Oregon Spur, Averdal, Hared, Lancraig |
| 616 | Stone's Mosaic | Loddington |
| 164 | Sunset | Sunset sport |
| 884 | Tom Putt | Sidney Strake |
| 482 | Tordai alma | Kirke's Lord Nelson, Bietigheimer |
| 1867 | Torstein | Red Torstein |
| 224 | Warren's Seedling | Catherine |
| 6 | Wealthy | Case Wealthy, Stevenson Wealthy, Loop Wealthy |
| 843 | Wheeler's Russet | Pinner Seedling |
| 25 | White Transparent | Perrine Yellow Transparent, Wrixparent |
| 360 | Winston | Winston sport |
| 324 | Winter Marigold | Colonel Vaughan |
| 587 | York-a-Red | Perrine York |

## 4. Gleicher Name, verschiedene MUNQ (nicht zusammengefasst)

- severn bank: MUNQ 2578, 2687
- wax apple: MUNQ 2451, 914

## 5. Nur über gleichen Namen zusammengefasst (mindestens eine Akzession ohne MUNQ)

- keine
