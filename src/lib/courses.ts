import { LESSONS } from "./content";

// Courses that earn a certificate. Every requirement is a test the member must pass with at least
// MIN_ACCURACY accuracy and the given speed, in one run (their best qualifying run counts).
export const MIN_ACCURACY = 95;

export interface Requirement {
  modeKey: string; // e.g. "lessons:top", "timed:60" — labelled with labelForKey()
  minWpm: number;
}

export interface Course {
  id: string;
  title: { lo: string; en: string };
  description: { lo: string; en: string };
  requirements: Requirement[];
}

export const COURSES: Course[] = [
  {
    id: "foundations",
    title: { lo: "ພື້ນຖານແປ້ນພິມລາວ", en: "Lao Keyboard Foundations" },
    description: {
      lo: "ຜ່ານທຸກບົດຮຽນ ດ້ວຍຄວາມໄວ 12 ຄຳ/ນາທີ ຂຶ້ນໄປ ແລະ ຄວາມຖືກຕ້ອງ 95% ຂຶ້ນໄປ",
      en: "Pass every lesson at 12 WPM or more with at least 95% accuracy",
    },
    requirements: LESSONS.map((l) => ({ modeKey: `lessons:${l.id}`, minWpm: 12 })),
  },
  {
    id: "speed-30",
    title: { lo: "ພິມໄວ 30 ຄຳ/ນາທີ", en: "Speed Typist — 30 WPM" },
    description: {
      lo: "ທົດສອບຈັບເວລາ 60 ວິນາທີ ໄດ້ 30 ຄຳ/ນາທີ ຂຶ້ນໄປ ແລະ ຄວາມຖືກຕ້ອງ 95% ຂຶ້ນໄປ",
      en: "Reach 30 WPM on the 60-second test with at least 95% accuracy",
    },
    requirements: [{ modeKey: "timed:60", minWpm: 30 }],
  },
  {
    id: "speed-50",
    title: { lo: "ພິມໄວ 50 ຄຳ/ນາທີ", en: "Speed Typist — 50 WPM" },
    description: {
      lo: "ທົດສອບຈັບເວລາ 60 ວິນາທີ ໄດ້ 50 ຄຳ/ນາທີ ຂຶ້ນໄປ ແລະ ຄວາມຖືກຕ້ອງ 95% ຂຶ້ນໄປ",
      en: "Reach 50 WPM on the 60-second test with at least 95% accuracy",
    },
    requirements: [{ modeKey: "timed:60", minWpm: 50 }],
  },
];

export const findCourse = (id: string) => COURSES.find((c) => c.id === id);
