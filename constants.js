// ─────────────────────────────────────────────
//  Diary of a Grappler — Design Tokens & Constants
//  Based on v7 prototype
// ─────────────────────────────────────────────

// ── Colors ──
export const C = {
  // Backgrounds
  bg:         "#0A0A0A",
  bgCard:     "#111111",
  bgInput:    "#1A1A1A",
  bgOverlay:  "rgba(0,0,0,0.92)",

  // Brand Red
  red:        "#E8192C",
  redDim:     "rgba(232,25,44,0.15)",
  redBorder:  "rgba(232,25,44,0.4)",

  // Text
  textPrimary:   "#FFFFFF",
  textSecondary: "#888888",
  textDim:       "#444444",

  // Borders
  border:      "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",

  // Category badge colors
  badge: {
    technique: "#E8A020",
    insight:   "#4A9EE8",
    story:     "#9B59B6",
    milestone: "#27AE60",
  },

  // Story ring colors (for avatars)
  rings: ["#E8192C", "#E8A020", "#4A9EE8", "#9B59B6", "#27AE60", "#E84393"],

  // Belt colors
  belt: {
    white:  "#E8E8E8",
    blue:   "#1A6BC4",
    purple: "#7B2FBE",
    brown:  "#8B4513",
    black:  "#2A2A2A",
  },
};

// ── Typography ──
export const FONTS = {
  display: "'Bebas Neue', 'Oswald', sans-serif",
  body:    "'Inter', 'Helvetica Neue', sans-serif",
  mono:    "'Space Mono', monospace",
};

// ── Shared Style Objects ──
export const S = {
  card: {
    background:   C.bgCard,
    border:       `1px solid ${C.border}`,
    borderRadius: 12,
    overflow:     "hidden",
    marginBottom: 8,
  },
  pill: (active) => ({
    padding:      "6px 16px",
    borderRadius: 20,
    fontSize:     12,
    fontFamily:   FONTS.body,
    fontWeight:   600,
    border:       active ? "none" : `1px solid ${C.border}`,
    cursor:       "pointer",
    background:   active ? C.red : "transparent",
    color:        active ? "#fff" : C.textSecondary,
    transition:   "all 0.2s",
    whiteSpace:   "nowrap",
  }),
  input: {
    width:        "100%",
    background:   C.bgInput,
    border:       `1px solid ${C.border}`,
    borderRadius: 10,
    padding:      "12px 16px",
    fontSize:     14,
    color:        C.textPrimary,
    fontFamily:   FONTS.body,
    outline:      "none",
    boxSizing:    "border-box",
  },
  label: {
    fontSize:      10,
    fontFamily:    FONTS.body,
    fontWeight:    700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color:         C.textSecondary,
    marginBottom:  6,
    display:       "block",
  },
  divider: {
    height:     1,
    background: C.border,
    margin:     "12px 0",
  },
};

// ── Navigation Tabs ──
export const TABS = [
  { id: "home",      label: "HOME",      icon: "⌂"  },
  { id: "discover",  label: "DISCOVER",  icon: "◎"  },
  { id: "diary",     label: "DIARY",     icon: "▦"  },
  { id: "community", label: "COMMUNITY", icon: "◈"  },
  { id: "profile",   label: "PROFILE",   icon: "◯"  },
];

// ── Post Categories ──
export const CATEGORIES = ["All", "Technique", "Insight", "Story", "Milestone"];

// ── Belt System ──
export const BELTS   = ["white", "blue", "purple", "brown", "black"];
export const STRIPES = [0, 1, 2, 3, 4];

// ── Submission Types ──
export const SUBMISSIONS = [
  "Rear Naked Choke", "Triangle", "Armbar", "Kimura",
  "Guillotine", "Heel Hook", "Darce", "Anaconda",
  "Bow & Arrow", "Baseball Choke", "Loop Choke", "Other",
];

// ── Positions ──
export const POSITIONS = [
  "Guard", "Half Guard", "Side Control", "Mount",
  "Back", "Turtle", "Leg Entanglement", "Standing",
];

// ── Injury Areas ──
export const INJURY_AREAS = [
  "Neck", "Shoulder", "Elbow", "Wrist",
  "Back", "Hip", "Knee", "Ankle",
];

// ── Seed Data — Default User ──
export const DEFAULT_USER = {
  id:             "user_001",
  name:           "Curty Alexander",
  handle:         "@curtygrappler",
  initials:       "CG",
  belt:           "purple",
  stripes:        2,
  gym:            "Curzan BJJ",
  bio:            "Purple belt. Constant student of the game.",
  avatar:         null,
  following:      48,
  followers:      112,
  sessions:       247,
  matTime:        "186h",
  taps:           89,
  posts:          0,
  privateAccount: false,
  showBodyWeight: false,
};

// ── Seed Data — Stories Row ──
export const SEED_STORIES = [
  { id: "g1", name: "GarryTonon",  initials: "GT", ringColor: C.rings[0], hasNew: true  },
  { id: "g2", name: "KeenanC",     initials: "KC", ringColor: C.rings[1], hasNew: true  },
  { id: "g3", name: "MatBurn",     initials: "MB", ringColor: C.rings[2], hasNew: false },
  { id: "g4", name: "CompDave",    initials: "CD", ringColor: C.rings[3], hasNew: true  },
  { id: "g5", name: "BJJMind",     initials: "MG", ringColor: C.rings[4], hasNew: false },
  { id: "g6", name: "LegLockLee",  initials: "LL", ringColor: C.rings[5], hasNew: true  },
];

// ── Seed Data — Feed Posts ──
export const SEED_POSTS = [
  {
    id:        "p1",
    authorId:  "g1",
    author:    "GarryTonon",
    handle:    "@garrytonon",
    initials:  "GT",
    ring:      C.rings[0],
    verified:  true,
    time:      "2m",
    category:  "Technique",
    title:     "Heel hook from butterfly — the hidden entry",
    body:      "Three years perfecting this. The foot position detail nobody talks about. This single entry changed my entire leg lock game. Study it.",
    hasVideo:  true,
    duration:  "0:18",
    tags:      ["#leglocks", "#butterfly", "#nogi"],
    saves:     4800,
    likes:     312,
    shares:    891,
    bookmarks: 1200,
  },
  {
    id:        "p2",
    authorId:  "g5",
    author:    "BJJMentalCoach",
    handle:    "@themindgrappler",
    initials:  "MG",
    ring:      C.rings[4],
    verified:  false,
    time:      "14m",
    category:  "Insight",
    title:     "You tap to discomfort, not danger. Here's why.",
    body:      "Tapping early is a trauma response. Your nervous system learned helplessness on the mat. But it's a specific kind you can rewire.",
    hasVideo:  false,
    tags:      ["#mentalhealth", "#bjjmindset"],
    saves:     2100,
    likes:     540,
    shares:    330,
    bookmarks: 780,
  },
  {
    id:       "p3",
    authorId: "g2",
    author:   "KeenanCornelias",
    handle:   "@keenanbjj",
    initials: "KC",
    ring:     C.rings[1],
    verified: true,
    time:     "1h",
    category: "Technique",
    title:    "The worm guard entry most people butcher",
    body:     "It starts before you ever grab the lapel. Hip positioning in open guard is where this sweep is won or lost.",
    hasVideo: true,
    duration: "1:42",
    tags:     ["#wormguard", "#guardplay", "#gi"],
    saves:    3300,
    likes:    890,
    shares:   412,
    bookmarks: 950,
  },
];
