const path = require('path');
const fs = require('fs');
const debug = require('debug')('rok4');

// Recuperation d'une tuile au format rok4
function getTile(tile, nbTiles, prof) {
  // identification de la dalle
  const X = Math.trunc(tile.x / nbTiles).toString(36).padStart(prof, 0).toUpperCase();
  const Y = Math.trunc(tile.y / nbTiles).toString(36).padStart(prof, 0).toUpperCase();
  let url = '.';
  for (let i = 0; i < prof; i += 1) {
    url = path.join(url, X[i] + Y[i]);
  }
  url += '.tif';
  // ouverture en lecture seule de la dalle
  const dalle = fs.openSync(url);
  // decodage des offets/ByteCounts
  const N = nbTiles * nbTiles;
  const offsets = new Uint32Array(2 * N);
  fs.readSync(dalle, offsets, 0, 2048, offsets.byteLength);
  // recupération de l'index de tuile dans la dalle
  const iTile = (tile.y % nbTiles) * nbTiles + (tile.x % nbTiles);
  // lecture de la tuile
  const buffer = Buffer.alloc(offsets[N + iTile]);
  fs.readSync(dalle, buffer, 0, buffer.byteLength, 2048 + 2 * 4 * N + offsets[iTile]);
  // on ferme le fichier de la dalle
  fs.closeSync(dalle);
  return buffer;
}

// Mise à jour d'une tuile au format rok4
function setTile(tile, nbTiles, prof, buffer) {
  // identification de la dalle
  const X = Math.trunc(tile.x / nbTiles).toString(36).padStart(prof, 0).toUpperCase();
  const Y = Math.trunc(tile.y / nbTiles).toString(36).padStart(prof, 0).toUpperCase();
  let url = '.';
  for (let i = 0; i < prof; i += 1) {
    url = path.join(url, X[i] + Y[i]);
  }
  url += '.tif';
  let bufferDalle;
  const N = nbTiles * nbTiles;
  if (fs.existsSync(url)) {
    debug('Mise a jour de la dalle ', url);
    // ouverture en lecture seule de la dalle
    const dalle = fs.openSync(url);
    // lecture complete du fichier
    bufferDalle = fs.readFileSync(dalle);
    // fermeture de la dalle
    fs.closeSync(dalle);
  } else {
    debug('Création d\'une nouvelle dalle ', url);
    // Nouvelle Dalle, on cree un buffer vide
    // to do: créer une entête Tiff Valide
    bufferDalle = Buffer.alloc(2048 + 8 * N, 0);
  }
  // decodage des offets/ByteCounts
  const offsets = new Uint32Array(
    bufferDalle.buffer,
    2048,
    2 * N,
  );
  // recupération de l'index de tuile dans la dalle
  const iTile = (tile.y % nbTiles) * nbTiles + (tile.x % nbTiles);
  // création d'un offets mis à jour
  const oldBufferByteCount = offsets[N + iTile];
  const newOffsets = Uint32Array.from(offsets);
  for (let n = (iTile + 1); n < N; n += 1) {
    newOffsets[n] += buffer.byteLength - oldBufferByteCount;
  }
  newOffsets[N + iTile] = buffer.byteLength;
  // creation d'une nouvelle dalle
  // si besoin, on cree le dossier
  fs.mkdirSync(path.dirname(url), { recursive: true });
  const newDalle = fs.openSync(url, 'w');
  // ecriture du header
  fs.writeSync(newDalle, bufferDalle, 0, 2048);
  // ecriture des offets
  fs.writeSync(newDalle, newOffsets, 0, newOffsets.byteLength);
  // ecriture des premieres tuiles si necessaire
  if (iTile > 0) {
    fs.writeSync(newDalle,
      bufferDalle,
      2048 + offsets.byteLength,
      offsets[iTile - 1] + offsets[N + iTile - 1]);
  }
  // ecriture de la nouvelle tuile
  fs.writeSync(newDalle, buffer, 0, buffer.byteLength);
  // ecriture des dernières tuiles si necessaire
  if ((iTile + 1) < N) {
    fs.writeSync(newDalle,
      bufferDalle,
      offsets[iTile + 1],
      bufferDalle.byteLength - offsets[iTile + 1]);
  }
  // on ferme le fichier de la dalle
  fs.closeSync(newDalle);
}

function test() {
  // Ecriture de la tuile
  const buffer1 = Buffer.alloc(300, 15);
  const tile1 = { x: 414, y: 3134, z: 12 };
  setTile(tile1, 16, 3, buffer1);
  const buffer2 = Buffer.alloc(200, 7);
  const tile2 = { x: 415, y: 3134, z: 12 };
  setTile(tile2, 16, 3, buffer2);
  const buffer3 = Buffer.alloc(400, 255);
  const tile3 = { x: 415, y: 3135, z: 12 };
  setTile(tile3, 16, 3, buffer3);

  // Lecture d'un tuile
  const buffer1Verif = getTile(tile1, 16, 3);
  const buffer2Verif = getTile(tile2, 16, 3);
  const buffer3Verif = getTile(tile3, 16, 3);
  return buffer1.equals(buffer1Verif)
    && buffer2.equals(buffer2Verif)
    && buffer3.equals(buffer3Verif);
}

debug('test : ', test())