export type Language = 'en' | 'es';

export interface NavigationItem {
  invitation: string;
  approach: string;
  session: string;
  about: string;
  apply: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  scrollDown: string;
}

export interface ApproachItem {
  title: string;
  text: string;
}

export interface ApproachContent {
  title: string;
  items: ApproachItem[];
}

export interface SessionContent {
  title: string;
  price: string;
  description: string;
  deliverables: string[];
  cta: string;
}

export interface AboutContent {
  title: string;
  text: string;
}

export interface FormContent {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question: string;
  questionPlaceholder: string;
  submit: string;
  thankYou: string;
}

export interface ApplyContent {
  title: string;
  subtitle: string;
  form: FormContent;
}

export interface Translations {
  nav: NavigationItem;
  hero: HeroContent;
  approach: ApproachContent;
  session: SessionContent;
  about: AboutContent;
  apply: ApplyContent;
}

export interface FormData {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question: string;
}

export interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentSection: string;
  scrollToSection: (sectionId: string) => void;
  t: Translations;
}

export interface SectionProps {
  t: Translations;
  scrollToSection?: (sectionId: string) => void;
}