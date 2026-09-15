import type { TranslationKey } from "./translations";

export const monthTranslationKeys: TranslationKey[] = [
  "month.january", "month.february", "month.march", "month.april",
  "month.may", "month.june", "month.july", "month.august",
  "month.september", "month.october", "month.november", "month.december",
];

/** Hindu (lunar) month pairings shown under each Gregorian month, in Hindi. */
export const hinduMonthNamesHi: Record<number, string> = {
  0: "पौष-माघ",
  1: "माघ-फाल्गुन",
  2: "फाल्गुन-चैत्र",
  3: "चैत्र-वैशाख",
  4: "वैशाख-ज्येष्ठ",
  5: "ज्येष्ठ-आषाढ़",
  6: "आषाढ़-श्रावण",
  7: "श्रावण-भाद्रपद",
  8: "भाद्रपद-आश्विन",
  9: "आश्विन-कार्तिक",
  10: "कार्तिक-मार्गशीर्ष",
  11: "मार्गशीर्ष-पौष",
};
