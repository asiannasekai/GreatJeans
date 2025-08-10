export const POPOVERS = {
  protein: {
    title: "Protein Structure",
    body: "A 3D model of one of your body's proteins. A protein is a tiny machine built from a chain of building blocks. We highlight the exact spot affected by your DNA change so you can see where it lives."
  },
  secondary: {
    title: "Secondary Structure",
    body: "Proteins fold into simple shapes: helix (spiral), sheet (flat), and coil (flexible). Our small model estimates these shapes near your DNA change and compares reference (WT) vs your version (Mut)."
  },
  genome: {
    title: "Genome View",
    body: "A zoomed-in map of your DNA around this position. It shows exactly where the change sits and what was measured."
  },
  traits: {
    title: "Traits",
    body: "Well-studied DNA markers tied to everyday traits (like caffeine metabolism). \"Covered\" means your file included that marker; \"Missing\" means it wasn't measured."
  },
  pgs: {
    title: "Polygenic Score",
    body: "A rough estimate built from many small DNA markers added together. It shows relative tendency, not a diagnosis. Environment and lifestyle still matter a lot."
  },
  ai: {
    title: "AI Insights",
    body: "Plain-language notes about the protein site you're viewing, with quick actions to change the 3D display. Educational only; not medical advice."
  },
  privacy: {
    title: "Privacy",
    body: "We process files for this session and let you delete them any time. Your data stays under your control."
  }
};

export const TOOLTIPS = {
  WT: "The standard protein sequence used for comparison.",
  MUT: "Your version after the DNA change.",
  DELTA: "Difference between Mut and WT (Mut − WT).",
  RESIDUE: "One building block (amino acid) in the protein chain.",
  RSID: "Catalog number for a DNA position (e.g., rs1042522).",
  MISSENSE: "A DNA change that swaps one amino acid for another.",
  PLDDT: "AlphaFold's confidence in the 3D shape at this spot.",
  CONFIDENCE: "How sure our small predictor is about its estimate.",
  COVERED: "This marker was present in your file.",
  MISSING: "This marker wasn't present in your file."
};

export const CONFIDENCE_LEGEND = [
  { label: "High", desc: "Model is quite sure (≥ 0.70)." },
  { label: "Medium", desc: "Some uncertainty (0.40–0.69)." },
  { label: "Low", desc: "Use with caution (< 0.40)." }
];

export const EMPTY_STATES = {
  protein: "No coding variant mapped — this change doesn't alter a protein sequence we can show here.",
  secondary: "Not available for this site — no protein window found for this variant.",
  traits: "No trait markers found in your file — some services don't include these positions.",
  pgs: "Polygenic score wasn't requested — turn it on when running analysis."
};

export const TOUR_STEPS = [
  { id: "protein3d", title: "Protein 3D", body: "Spin and zoom the protein. This is where your change sits." },
  { id: "highlight", title: "Highlight", body: "Jump straight to the exact residue with one click." },
  { id: "secondary", title: "Secondary Structure", body: "These bars compare simple shapes (helix, sheet, coil) before vs after the change." },
  { id: "genome", title: "Genome", body: "See the DNA map for this position and linked references." },
  { id: "ai", title: "AI Panel", body: "Get a plain-language summary and quick display actions. Educational, not medical." }
];
