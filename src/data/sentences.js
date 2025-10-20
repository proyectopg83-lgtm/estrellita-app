// src/data/sentences.js

export const SENTENCE_SETS = [
  {
    id: "m",
    title: "Oraciones",
    type: "sentences",
    sentences: [
      {
        id: "o1",
        text: "Mi mamá me mima.",
        image: "/img/sentences/o1.png",
      },
      {
        id: "o2",
        text: "Adela va a la cama.",
        image: "/img/sentences/o2.png",
      },
      {
        id: "o3",
        text: "El oso come peras.",
        image: "/img/sentences/o3.png",
      },
      {
        id: "o4",
        text: "Pepe come pan.",
        image: "/img/sentences/o4.png",
      },
      {
        id: "o5",
        text: "El sapo salta a la sopa.",
        image: "/img/sentences/o5.png",
      },

      {
      id: "o6",
      text: "El pez nada en la pecera.",
      image: "/img/sentences/o6.png",
      },

      {
      id: "o7",
      text: "El dado es de mi papá.",
      image: "/img/sentences/o7.png",
     },

      {
      id: "o8",
      text: "El puma bebe agua.",
      image: "/img/sentences/o8.png",
      },
     {
      id: "o9",
      text: "La abuela usa la tela rosa para hacer un vestido.",
      image: "/img/sentences/o9.png",
    },
    {
      id: "o10",
      text: "El conejo se esconde debajo de la mesa.",
      image: "/img/sentences/o10.png",
    },

    ],
  },

  // Cuentos o Textos
  {
    id: "cuento-1",
    title: "El sapo Pepe",
    type: "text",
    paragraphs: [
      "El sapo Pepe sale.",
      "Pepe sale a la loma.",
      "El sol sale, el sol calienta.",
      "Pepe toma sopa en la loma.",
    ],
    image: "/img/texts/s-sapo.png",
  },

  {
    id: "cuento-2",
    title: "Memo",
    type: "text",
    paragraphs: [
      "Mi  mamá  ama  a  Memo.",
      "Memo  ama  a  mamá.",
      "La  mamá  mima  a  Memo.",
      "Memo  y  su  mamá  pasean.",
      "La  mamá  le  da  a  Memo  una  pelota.",
    ],
    image: "/img/texts/memo.png",
  },
  {
    id: "cuento-3",
    title: "La mesa de Tina",
    type: "text",
    paragraphs: [
      "La mesa es de Tina.",
      "Tina asea la mesa.",
      "Tina pone la mano en la mesa.",
      "La mesa es lisa.",
      "Tina ama su mesa.",
    ],
    image: "/img/texts/m-mesa.png",
  },

  {
    id: "cuento-4",
    title: "El sol y la luna",
    type: "text",
    paragraphs: [
      "El sol sale y se ríe.",
      "La luna mira y se va.",
      "El sol es de día.",
      "La luna es de noche.",
      "Yo miro la luna desde mi cama.",
    ],
    image: "/img/texts/sol-luna.png",
  },

  {
    id: "cuento-5",
    title: "La casa de mi mamá",
    type: "text",
    paragraphs: [
      "Mi mamá tiene una casa.",
      "La casa es de color café.",
      "En la casa hay una cama.",
      "Sobre la cama hay una manta.",
      "La mesa es de madera.",
      "Mi mamá y yo nos sentamos a la mesa para comer.",
    ],
    image: "/img/texts/casa-mama.png",
  },

  {
    id: "cuento-6",
    title: "La nena y la gata",
    type: "text",
    paragraphs: [
      "Una nena ve a una gata.",
      "La gata se llama Mimi.",
      "Mimi está en la sala.",
      "La nena le da su comida.",
      "La gata come toda la sopa.",
      "La nena se ríe mucho.",
    ],
    image: "/img/texts/nena-gata.png",
  },

];


// 🔍 Buscar un set por ID (ej: "m", "cuento-1")
export function findSentenceSet(id) {
  return SENTENCE_SETS.find((set) => set.id === id);
}

// 📚 Obtener índice del set (para "siguiente" o "anterior")
export function indexBySetId(id) {
  return SENTENCE_SETS.findIndex((set) => set.id === id);
}
