import { isCombining } from "./layout";

export interface Lesson {
  id: string;
  title: { lo: string; en: string };
  keys: string[];
}

export const LESSONS: Lesson[] = [
  {
    id: "home-left",
    title: { lo: "ແຖວກາງ · ມືຊ້າຍ", en: "Home row · left hand" },
    keys: ["ຫ", "ກ", "ດ", "ເ", "ັ"],
  },
  {
    id: "home-right",
    title: { lo: "ແຖວກາງ · ມືຂວາ", en: "Home row · right hand" },
    keys: ["າ", "ສ", "ວ", "ງ", "້", "່"],
  },
  {
    id: "home-all",
    title: { lo: "ແຖວກາງ · ທັງໝົດ", en: "Home row · all keys" },
    keys: ["ຫ", "ກ", "ດ", "ເ", "ັ", "າ", "ສ", "ວ", "ງ", "້", "່"],
  },
  {
    id: "top",
    title: { lo: "ແຖວເທິງ", en: "Top row" },
    keys: ["ໄ", "ຳ", "ພ", "ະ", "ຮ", "ນ", "ຍ", "ບ", "ລ", "ົ", "ິ", "ີ"],
  },
  {
    id: "bottom",
    title: { lo: "ແຖວລຸ່ມ", en: "Bottom row" },
    keys: ["ຜ", "ປ", "ແ", "ອ", "ທ", "ມ", "ໃ", "ຝ", "ຶ", "ື"],
  },
  {
    id: "number",
    title: { lo: "ແຖວຕົວເລກ", en: "Number row" },
    keys: ["ຢ", "ຟ", "ໂ", "ຖ", "ຄ", "ຕ", "ຈ", "ຂ", "ຊ", "ຸ", "ູ", "ໍ"],
  },
  {
    id: "shift",
    title: { lo: "ປຸ່ມ Shift", en: "Shift keys" },
    keys: ["ໜ", "ໝ", "ຣ", "ຽ", "ໆ", "ຼ", "໊", "໋", "໌"],
  },
  {
    id: "digits",
    title: { lo: "ຕົວເລກລາວ", en: "Lao digits" },
    keys: ["໐", "໑", "໒", "໓", "໔", "໕", "໖", "໗", "໘", "໙"],
  },
];

const LEADING_VOWELS = new Set(["ເ", "ແ", "ໂ", "ໄ", "ໃ"]);
// Characters that are not consonants but can stand alone in a drill.
const STANDALONE = /[ະາຳໆ໐-໙ຽ]/;

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// Build drill text from a lesson's keys. Marks that must sit on a consonant get one,
// and leading vowels are always followed by a consonant, so the text renders correctly.
export function makeLessonText(lesson: Lesson, groups = 18): string {
  const consonants = lesson.keys.filter(
    (c) => !isCombining(c) && !LEADING_VOWELS.has(c) && !STANDALONE.test(c),
  );
  const fallback = consonants.length ? consonants : ["ກ", "ດ", "ສ"];
  const out: string[] = [];
  for (let g = 0; g < groups; g++) {
    let group = "";
    const len = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < len; i++) {
      const ch = pick(lesson.keys);
      if (ch === "ຼ") {
        group += "ຫ" + ch; // ຫຼ
      } else if (isCombining(ch)) {
        group += pick(fallback) + ch;
      } else if (LEADING_VOWELS.has(ch)) {
        group += ch + pick(fallback);
      } else if (ch === "ໆ") {
        group += (group ? "" : pick(fallback)) + ch;
      } else {
        group += ch;
      }
    }
    out.push(group);
  }
  return out.join(" ");
}

export const WORDS: string[] = [
  "ສະບາຍດີ", "ຂອບໃຈ", "ລາວ", "ປະເທດ", "ພາສາ", "ຮຽນ", "ຂຽນ", "ອ່ານ", "ເຮືອນ", "ໂຮງຮຽນ",
  "ນ້ຳ", "ເຂົ້າ", "ກິນ", "ໄປ", "ມາ", "ແມ່", "ພໍ່", "ອ້າຍ", "ເອື້ອຍ", "ນ້ອງ",
  "ໝູ່", "ເພື່ອນ", "ຮັກ", "ດີ", "ງາມ", "ໃຫຍ່", "ນ້ອຍ", "ວັນ", "ເວລາ", "ມື້ນີ້",
  "ຕອນເຊົ້າ", "ຕອນແລງ", "ກາງຄືນ", "ຄົນ", "ເດັກ", "ປຶ້ມ", "ປາກກາ", "ໂຕະ", "ລົດ", "ທາງ",
  "ເມືອງ", "ບ້ານ", "ຕະຫຼາດ", "ເງິນ", "ວຽກ", "ເຮັດ", "ເບິ່ງ", "ຟັງ", "ເວົ້າ", "ຮູ້",
  "ເຂົ້າໃຈ", "ຄິດ", "ນອນ", "ຫຼິ້ນ", "ແລ່ນ", "ຍ່າງ", "ນັ່ງ", "ຢືນ", "ຊື້", "ຂາຍ",
  "ສີ", "ແດງ", "ຂຽວ", "ຂາວ", "ດຳ", "ຟ້າ", "ເຫຼືອງ", "ໝາ", "ແມວ", "ໄກ່",
  "ງົວ", "ຊ້າງ", "ປາ", "ນົກ", "ດອກໄມ້", "ຕົ້ນໄມ້", "ພູ", "ແມ່ນ້ຳ", "ທະເລ", "ຝົນ",
  "ລົມ", "ຕາເວັນ", "ເດືອນ", "ດາວ", "ຫົວໃຈ", "ຄວາມສຸກ", "ສຸຂະພາບ", "ວຽງຈັນ", "ຫຼວງພະບາງ", "ຈຳປາສັກ",
  "ອາຫານ", "ເຝີ", "ລາບ", "ເຂົ້າໜຽວ", "ກາເຟ", "ຊາ", "ໝາກໄມ້", "ໝາກມ່ວງ", "ໝາກກ້ວຍ", "ຫ້ອງ",
  "ປະຕູ", "ໂທລະສັບ", "ນັກຮຽນ", "ຄູ", "ທ່ານໝໍ", "ຊາວນາ", "ສັນຕິພາບ", "ວັດທະນະທຳ", "ປະເພນີ", "ບຸນ",
  "ວັດ", "ຊາດ", "ໃໝ່", "ເກົ່າ", "ໄວ", "ຊ້າ", "ຮ້ອນ", "ໜາວ", "ເຢັນ", "ແຊບ",
  "ຫຼາຍ", "ໜ້ອຍ", "ທຸກ", "ມື້", "ປີ", "ຊົ່ວໂມງ", "ນາທີ", "ຂ້ອຍ", "ເຈົ້າ", "ພວກເຮົາ",
];

export const SENTENCES: string[] = [
  "ສະບາຍດີ ຍິນດີຕ້ອນຮັບສູ່ການຝຶກພິມພາສາລາວ",
  "ຂ້ອຍຮັກປະເທດລາວ",
  "ມື້ນີ້ອາກາດດີຫຼາຍ",
  "ພວກເຮົາໄປໂຮງຮຽນທຸກມື້",
  "ແມ່ເຮັດອາຫານແຊບຫຼາຍ",
  "ປະເທດລາວມີພູເຂົາ ແລະ ແມ່ນ້ຳຫຼາຍ",
  "ນະຄອນຫຼວງວຽງຈັນ ເປັນນະຄອນຫຼວງຂອງລາວ",
  "ຂ້ອຍມັກກິນເຂົ້າໜຽວກັບລາບ",
  "ຫຼວງພະບາງເປັນເມືອງມໍລະດົກໂລກ",
  "ການຮຽນພາສາຕ້ອງໃຊ້ຄວາມພະຍາຍາມ",
  "ຝຶກພິມທຸກມື້ ຈະພິມໄດ້ໄວຂຶ້ນ",
  "ເດັກນ້ອຍຫຼິ້ນຢູ່ໜ້າບ້ານ",
  "ລາວໄປຕະຫຼາດຊື້ໝາກໄມ້",
  "ຕອນເຊົ້າຂ້ອຍດື່ມກາເຟລາວ",
  "ບຸນປີໃໝ່ລາວ ແມ່ນເດືອນເມສາ",
  "ພວກເຮົາຕ້ອງຮັກສາສິ່ງແວດລ້ອມ",
  "ໝູ່ເພື່ອນທີ່ດີ ຈະຊ່ວຍເຫຼືອກັນສະເໝີ",
  "ຂໍໃຫ້ມີສຸຂະພາບແຂງແຮງ",
  "ອາກາດຢູ່ພູເຂົາເຢັນສະບາຍ",
  "ແມ່ນ້ຳຂອງໄຫຼຜ່ານຫຼາຍປະເທດ",
  "ນັກຮຽນອ່ານປຶ້ມຢູ່ຫ້ອງສະໝຸດ",
  "ຂອບໃຈຫຼາຍໆ ທີ່ມາຢ້ຽມຢາມ",
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const makeWordsText = (count: number) =>
  Array.from({ length: count }, () => pick(WORDS)).join(" ");

export const makeSentencesText = (count: number) =>
  shuffle(SENTENCES).slice(0, count).join(" ");
