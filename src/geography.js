// Shared geography question bank. Factual world-geography trivia (capitals,
// superlatives, producers). Answering correctly during a run grants bonus
// score and power-up charge — this is the "geography" in Fruit Geography Game
// and is available to every theme.
//
// Each question: { q, options: [4 strings], answer: index-into-options }.

export const QUESTIONS = [
  { q: 'What is the capital of Australia?', options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'], answer: 1 },
  { q: 'Which is the largest country by land area?', options: ['Canada', 'China', 'Russia', 'USA'], answer: 2 },
  { q: 'The Nile river mainly flows through which continent?', options: ['Asia', 'Africa', 'Europe', 'South America'], answer: 1 },
  { q: 'Which country has the most people?', options: ['India', 'China', 'USA', 'Indonesia'], answer: 0 },
  { q: 'Mount Everest sits on the border of Nepal and…', options: ['India', 'China', 'Bhutan', 'Pakistan'], answer: 1 },
  { q: 'What is the capital of Japan?', options: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], answer: 2 },
  { q: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
  { q: 'The Amazon rainforest is mostly in which country?', options: ['Peru', 'Colombia', 'Brazil', 'Bolivia'], answer: 2 },
  { q: 'What is the capital of Canada?', options: ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'], answer: 1 },
  { q: 'Which country is both in Europe and Asia?', options: ['Egypt', 'Turkey', 'Greece', 'Italy'], answer: 1 },
  { q: 'The Sahara Desert is located in northern…', options: ['Africa', 'Asia', 'Australia', 'America'], answer: 0 },
  { q: 'Which country is shaped like a boot?', options: ['Spain', 'Greece', 'Italy', 'Portugal'], answer: 2 },
  { q: 'What is the capital of Egypt?', options: ['Cairo', 'Giza', 'Alexandria', 'Luxor'], answer: 0 },
  { q: 'Which is the top coffee-producing country?', options: ['Colombia', 'Vietnam', 'Brazil', 'Ethiopia'], answer: 2 },
  { q: 'The Great Barrier Reef lies off the coast of…', options: ['Australia', 'Indonesia', 'Fiji', 'Philippines'], answer: 0 },
  { q: 'Which country grows the most bananas?', options: ['Ecuador', 'India', 'Philippines', 'Brazil'], answer: 1 },
  { q: 'What is the capital of Brazil?', options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], answer: 2 },
  { q: 'Which continent is the coldest?', options: ['Europe', 'Asia', 'Antarctica', 'Africa'], answer: 2 },
  { q: 'Which country is the largest producer of olives?', options: ['Greece', 'Italy', 'Spain', 'Turkey'], answer: 2 },
  { q: 'The Andes mountains run along which continent?', options: ['Africa', 'South America', 'Asia', 'Europe'], answer: 1 },
];

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns a question with options shuffled and the answer index remapped, so
// the correct choice isn't always in the same position.
export function pickQuestion() {
  const base = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const correct = base.options[base.answer];
  const options = shuffle(base.options);
  return { q: base.q, options, answer: options.indexOf(correct) };
}
