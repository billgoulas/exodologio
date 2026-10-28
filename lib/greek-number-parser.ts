/**
 * Parses Greek spoken amounts for the Ταμείο voice-command flow, e.g.
 * "δεκαεννέα κόμμα επτά" -> "19,7". Covers Greek cardinal numbers 0-999
 * plus an optional "κόμμα" (comma) decimal part — more than enough for a
 * till amount, which is realistically never in the thousands.
 *
 * Also normalizes transcripts (lowercase, strip tone marks) so matching is
 * tolerant of whether the speech recognizer includes accents.
 */

export function normalizeGreek(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

const UNITS: Record<string, number> = {
  'μηδεν': 0,
  'ενα': 1, 'μια': 1, 'ενας': 1, 'μιας': 1,
  'δυο': 2, 'δυό': 2,
  'τρια': 3, 'τρεις': 3,
  'τεσσερα': 4, 'τεσσερις': 4,
  'πεντε': 5,
  'εξι': 6,
  'εφτα': 7, 'επτα': 7,
  'οκτω': 8, 'οχτω': 8,
  'εννεα': 9, 'εννια': 9,
  'δεκα': 10,
  'εντεκα': 11,
  'δωδεκα': 12,
  'δεκατρια': 13, 'δεκατρεις': 13,
  'δεκατεσσερα': 14, 'δεκατεσσερις': 14,
  'δεκαπεντε': 15,
  'δεκαεξι': 16,
  'δεκαεφτα': 17, 'δεκαεπτα': 17,
  'δεκαοκτω': 18, 'δεκαοχτω': 18,
  'δεκαεννεα': 19, 'δεκαεννια': 19,
};

const TENS: Record<string, number> = {
  'εικοσι': 20,
  'τριαντα': 30,
  'σαραντα': 40,
  'πενηντα': 50,
  'εξηντα': 60,
  'εβδομηντα': 70,
  'ογδοντα': 80,
  'ενενηντα': 90,
};

const HUNDREDS: Record<string, number> = {
  'εκατο': 100, 'εκατον': 100,
  'διακοσια': 200, 'διακοσιες': 200,
  'τριακοσια': 300, 'τριακοσιες': 300,
  'τετρακοσια': 400, 'τετρακοσιες': 400,
  'πεντακοσια': 500, 'πεντακοσιες': 500,
  'εξακοσια': 600, 'εξακοσιες': 600,
  'εφτακοσια': 700, 'επτακοσια': 700, 'εφτακοσιες': 700, 'επτακοσιες': 700,
  'οκτακοσια': 800, 'οχτακοσια': 800, 'οκτακοσιες': 800, 'οχτακοσιες': 800,
  'εννιακοσια': 900, 'εννιακοσιες': 900,
};

function parseIntegerWords(words: string[]): number | null {
  let total = 0;
  let matchedAny = false;

  for (const word of words) {
    if (word === 'και' || word === '') continue;
    if (HUNDREDS[word] !== undefined) {
      total += HUNDREDS[word];
      matchedAny = true;
    } else if (TENS[word] !== undefined) {
      total += TENS[word];
      matchedAny = true;
    } else if (UNITS[word] !== undefined) {
      total += UNITS[word];
      matchedAny = true;
    }
    // Any other filler word ("ευρώ", "το ποσό", ...) is silently skipped.
  }

  return matchedAny ? total : null;
}

/**
 * Parses a spoken amount into the comma-decimal digit string the Ταμείο
 * keypad screen expects (e.g. "19,7"), or null if nothing recognizable was
 * found. Tries a literal digit match first (speech recognizers frequently
 * auto-format spoken numbers as digits, e.g. "19,7" or "19.7"), then falls
 * back to parsing Greek number words.
 */
export function parseSpokenAmount(rawTranscript: string): string | null {
  const digitMatch = rawTranscript.match(/\d+(?:[.,]\d+)?/);
  if (digitMatch) {
    return digitMatch[0].replace('.', ',');
  }

  const normalized = normalizeGreek(rawTranscript);
  const words = normalized.split(/\s+/).filter(Boolean);
  const commaIdx = words.indexOf('κομμα');

  if (commaIdx === -1) {
    const intVal = parseIntegerWords(words);
    return intVal === null ? null : String(intVal);
  }

  const intWords = words.slice(0, commaIdx);
  const decWords = words.slice(commaIdx + 1);
  const intVal = parseIntegerWords(intWords) ?? 0;
  const decVal = parseIntegerWords(decWords);

  if (decVal === null) return String(intVal);
  const decStr = decVal < 10 ? String(decVal) : String(decVal).slice(0, 2);
  return `${intVal},${decStr}`;
}
