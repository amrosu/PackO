# PackO
api pour controle et retouche du mosaiquage

## Pour installer et lancer le service

La commande classique avec NodeJs:
```shell
npm install
```

Ensuite on peut lancer l'API
```shell
node serveur.js
```

Ou, si on développe et que l'on veut que le service se relance automatiquement à chaque modification du code:
```shell
npx supervisor serveur.js
```

La doc de l'API est publié directement par le service ici : http://localhost:8081/doc

## Principe de fonctionnement

Ce service propose: 

- un flux WMTS standard pour les couches ortho et graph
- un flux WMTS permettant d'accéder aux OPI: ce flux est déclaré comme une couche unique (opi) et on utilise un paramètre de dimension pour choisir le cliché à afficher. Attention, il faut normalement déclarer explicitement toutes les valeurs de dimension dans le GetCapabilties: cela ne va pas être possible de déclarer toutes les clichés. Il va falloir trouver une astuce... 
- une commande permettant de modifier le graphe en donnant: un geojson + une référence de cliché


## Notes

Import du shp de graphe:
```bash
createdb pcrs
psql -d pcrs -c 'create extension postgis'
shp2pgsql /Volumes/PAOT\ 21/ZoneTestPCRS/Graphe/Graphe_PCRS56_ZONE_TEST.shp | psql -d pcrs
psql -d pcrs -c "SELECT UpdateGeometrySRID('graphe_pcrs56_zone_test','geom',2154)"
```
