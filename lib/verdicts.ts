import type { CravingId } from './spots';

/** What each rating means — the plain word, the CS-lab word, and how Cairo says it. */
export const VERDICTS: Record<number, { word: string; cs: string; ar: string }> = {
  1: { word: 'Nope', cs: 'Segfault', ar: 'مش تاني' },
  2: { word: 'Meh', cs: 'Buggy', ar: 'مش قد كده' },
  3: { word: 'Okay', cs: 'It compiles', ar: 'ماشي' },
  4: { word: 'Good', cs: 'Clean build', ar: 'حلو' },
  5: { word: 'Great', cs: 'Ship it', ar: 'تحفة' },
};

export type DepartmentId = 'coffee' | 'quick' | 'sitdown' | 'egyptian';

/** Four coarse aisles for the filter pad; the exact craving shows on each line. */
export const DEPARTMENTS: Record<DepartmentId, { en: string; ar: string; cravings: CravingId[] }> = {
  coffee: { en: 'Coffee & sweets', ar: 'قهوة وحلو', cravings: ['coffee', 'bakery', 'sweets'] },
  quick: { en: 'Quick bites', ar: 'أكل سريع', cravings: ['burgers', 'chicken', 'pizza', 'sandwiches'] },
  sitdown: { en: 'Sit-down', ar: 'قعدة', cravings: ['dining', 'italian', 'asian', 'grill'] },
  egyptian: { en: 'Egyptian', ar: 'مصري', cravings: ['egyptian'] },
};

// Nicknames for the "shuffle" button: fun to sign with, impossible to trace.
export const NICKNAMES = [
  'while(hungry)',
  'segfault_sandwich',
  'null_pointer_fries',
  'sudo_eat',
  'git_push_lunch',
  'stack_overflow_koshary',
  '404_appetite',
  'async_await_shawarma',
  'kernel_panic_pizza',
  'merge_conflict',
  'big_O_appetite',
  'ctrl_alt_eat',
  'binary_burger',
  'cache_miss',
  'recursive_rice',
  'lambda_lunch',
  'hello_world',
  'root_at_fue',
  'megabite',
  'koshary_overflow',
  'falafel_fan',
  'extra_daqqa',
  'off_by_one_falafel',
];
