export type Lang = "lo" | "en";

export const STRINGS = {
  tagline: { lo: "ຝຶກພິມພາສາລາວອອນລາຍ", en: "Practice Lao typing online" },
  lessons: { lo: "ບົດຮຽນ", en: "Lessons" },
  words: { lo: "ຄຳສັບ", en: "Words" },
  sentences: { lo: "ປະໂຫຍກ", en: "Sentences" },
  timed: { lo: "ຈັບເວລາ", en: "Timed" },
  wpm: { lo: "ຄຳ/ນາທີ", en: "WPM" },
  cpm: { lo: "ຕົວ/ນາທີ", en: "CPM" },
  accuracy: { lo: "ຄວາມຖືກຕ້ອງ", en: "Accuracy" },
  errors: { lo: "ຜິດ", en: "Errors" },
  time: { lo: "ເວລາ", en: "Time" },
  best: { lo: "ສະຖິຕິດີສຸດ", en: "Personal best" },
  restart: { lo: "ເລີ່ມໃໝ່", en: "Restart" },
  next: { lo: "ຂໍ້ຕໍ່ໄປ", en: "Next" },
  clickToFocus: {
    lo: "ຄລິກບ່ອນນີ້ ຫຼື ກົດປຸ່ມໃດກໍໄດ້ເພື່ອເລີ່ມພິມ",
    en: "Click here or press any key to start typing",
  },
  builtInLayout: { lo: "ໃຊ້ແປ້ນລາວໃນເວັບ", en: "Built-in Lao layout" },
  builtInHelp: {
    lo: "ພິມພາສາລາວໄດ້ ໂດຍບໍ່ຕ້ອງຕິດຕັ້ງແປ້ນພິມລາວໃນເຄື່ອງ",
    en: "Type Lao without installing a Lao keyboard on your device",
  },
  keyboard: { lo: "ສະແດງແປ້ນພິມ", en: "Show keyboard" },
  latinWarning: {
    lo: "ເບິ່ງຄືວ່າທ່ານກຳລັງພິມພາສາອັງກິດ — ເປີດ “ໃຊ້ແປ້ນລາວໃນເວັບ” ຫຼື ປ່ຽນແປ້ນພິມເປັນພາສາລາວ",
    en: "Looks like you're typing Latin letters — turn on “Built-in Lao layout” or switch your keyboard to Lao",
  },
  finished: { lo: "ສຳເລັດແລ້ວ!", en: "Finished!" },
  newBest: { lo: "ສະຖິຕິໃໝ່!", en: "New personal best!" },
  shortcuts: {
    lo: "Tab = ເລີ່ມໃໝ່ · Esc = ຂໍ້ຄວາມໃໝ່",
    en: "Tab = restart · Esc = new text",
  },
  nextKey: { lo: "ປຸ່ມຕໍ່ໄປ", en: "Next key" },
  useFinger: { lo: "ໃຊ້", en: "Use" },
  history: { lo: "ຜົນລ່າສຸດ", en: "Recent results" },
  noHistory: { lo: "ຍັງບໍ່ມີຜົນ — ເລີ່ມພິມເລີຍ!", en: "No results yet — start typing!" },
  seconds: { lo: "ວິນາທີ", en: "s" },
  wordsUnit: { lo: "ຄຳ", en: "words" },
  footer: {
    lo: "ສ້າງດ້ວຍ ❤ ເພື່ອຄົນລາວ · ແປ້ນພິມມາດຕະຖານ Kedmanee",
    en: "Made with ❤ for Lao learners · Standard Kedmanee layout",
  },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof STRINGS;
