// src/data/alphabet.js
export const ALPHABET = [
  { id: "o-oso",       letter: "o",  upper: "O",  lower: "o",  word: "Oso",        image: "/img/o-oso.png",        audio: "/audio/o.mp3" },
  { id: "a-avion",     letter: "a",  upper: "A",  lower: "a",  word: "Avión",      image: "/img/a-avion.png",      audio: "/audio/a.mp3" },
  { id: "i-iman",      letter: "i",  upper: "I",  lower: "i",  word: "Imán",       image: "/img/i-iman.png",       audio: "/audio/i.mp3" },
  { id: "u-uva",       letter: "u",  upper: "U",  lower: "u",  word: "Uva",        image: "/img/u-uva.png",        audio: "/audio/u.mp3" },
  { id: "e-estrella",  letter: "e",  upper: "E",  lower: "e",  word: "Estrella",   image: "/img/e-estrella.png",   audio: "/audio/e.mp3" },

  { id: "m-mano",      letter: "m",  upper: "M",  lower: "m",  word: "Mano",       image: "/img/m-mano.png",       audio: "/audio/m.mp3" },
  { id: "p-pez",       letter: "p",  upper: "P",  lower: "p",  word: "Pez",        image: "/img/p-pez.png",        audio: "/audio/p.mp3" },
  { id: "s-sombrero",  letter: "s",  upper: "S",  lower: "s",  word: "Sombrero",   image: "/img/s-sombrero.png",   audio: "/audio/s.mp3" },
  { id: "l-luna",      letter: "l",  upper: "L",  lower: "l",  word: "Luna",       image: "/img/l-luna.png",       audio: "/audio/l.mp3" },
  { id: "t-tortuga",   letter: "t",  upper: "T",  lower: "t",  word: "Tortuga",    image: "/img/t-tortuga.png",    audio: "/audio/t.mp3" },
  { id: "d-dedo",      letter: "d",  upper: "D",  lower: "d",  word: "Dedo",       image: "/img/d-dedo.png",       audio: "/audio/d.mp3" },
  { id: "r-raton",     letter: "r",  upper: "R",  lower: "r",  word: "Ratón",      image: "/img/r-raton.png",      audio: "/audio/r.mp3" },

  { id: "c-conejo",    letter: "c",  upper: "C",  lower: "c",  word: "Conejo",     image: "/img/c-conejo.png",     audio: "/audio/c.mp3" },
  { id: "c-cepillo",   letter: "c",  upper: "C",  lower: "c",  word: "Cepillo",    image: "/img/c-cepillo.png",    audio: "/audio/cc.mp3" },

  { id: "n-nido",      letter: "n",  upper: "N",  lower: "n",  word: "Nido",       image: "/img/n-nido.png",       audio: "/audio/n.mp3" },
  { id: "f-foco",      letter: "f",  upper: "F",  lower: "f",  word: "Foco",       image: "/img/f-foco.png",       audio: "/audio/f.mp3" },
  { id: "b-bandera",   letter: "b",  upper: "B",  lower: "b",  word: "Bandera",    image: "/img/b-bandera.png",    audio: "/audio/b.mp3" },
  { id: "j-jirafa",    letter: "j",  upper: "J",  lower: "j",  word: "Jirafa",     image: "/img/j-jirafa.png",     audio: "/audio/j.mp3" },

  { id: "g-gato",      letter: "g",  upper: "G",  lower: "g",  word: "Gato",       image: "/img/g-gato.png",       audio: "/audio/g.mp3" },
  { id: "g-gemelo",    letter: "g",  upper: "G",  lower: "g",  word: "Gemelo",     image: "/img/g-gemelo.png",     audio: "/audio/gg.mp3" },

  { id: "ch-chicharo", letter: "ch", upper: "Ch", lower: "ch", word: "Chícharo",   image: "/img/ch-chicharo.png",  audio: "/audio/ch.mp3" },
  { id: "ñ-ñandu",     letter: "ñ",  upper: "Ñ",  lower: "ñ",  word: "Ñandú",      image: "/img/ñ-ñandu.png",      audio: "/audio/ñ.mp3" },

  { id: "v-vaca",      letter: "v",  upper: "V",  lower: "v",  word: "Vaca",       image: "/img/v-vaca.png",       audio: "/audio/v.mp3" },
  { id: "ll-llave",    letter: "ll", upper: "Ll", lower: "ll", word: "Llave",      image: "/img/ll-llave.png",     audio: "/audio/ll.mp3" },
  { id: "q-queso",     letter: "q",  upper: "Q",  lower: "q",  word: "Queso",      image: "/img/q-queso.png",      audio: "/audio/q.mp3" },
  { id: "z-zapato",    letter: "z",  upper: "Z",  lower: "z",  word: "Zapato",     image: "/img/z-zapato.png",     audio: "/audio/z.mp3" },
  { id: "h-hoja",      letter: "h",  upper: "H",  lower: "h",  word: "Hoja",       image: "/img/h-hoja.png",       audio: "/audio/h.mp3" },
  { id: "y-yoyo",      letter: "y",  upper: "Y",  lower: "y",  word: "Yo-yo",      image: "/img/y-yoyo.png",       audio: "/audio/y.mp3" },
  { id: "x-xilofono",  letter: "x",  upper: "X",  lower: "x",  word: "Xilófono",   image: "/img/x-xilofono.png",   audio: "/audio/x.mp3" },
  { id: "k-koala",     letter: "k",  upper: "K",  lower: "k",  word: "Koala",      image: "/img/k-koala.png",      audio: "/audio/k.mp3" },
  { id: "w-waffle",    letter: "w",  upper: "W",  lower: "w",  word: "Waffle",     image: "/img/w-waffle.png",     audio: "/audio/w.mp3" },
];

export function indexById(id) {
  return ALPHABET.findIndex(l => l.id === id);
}
