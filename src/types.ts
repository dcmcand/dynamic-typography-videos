export interface Word {
  word: string;
  start: number;
  end: number;
}

export interface Line {
  text: string;
  start: number;
  end: number;
  words: Word[];
}

export interface Verse {
  lines: number[];
  start: number;
  end: number;
}

export interface Transcript {
  duration: number;
  mode: "aligned" | "transcribed";
  words: Word[];
  lines: Line[];
  verses?: Verse[];
}

export interface StylePreset {
  bgColor: string;
  bgGradient?: [string, string];
  activeColor: string;
  inactiveColor: string;
  highlightColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  glow: boolean;
  glowColor?: string;
  glowRadius?: number;
  wordAnimation: "pop" | "slide-up" | "fade" | "slam";
  lineAnimation: "fade" | "slide-up" | "zoom";
  particles: boolean;
}
