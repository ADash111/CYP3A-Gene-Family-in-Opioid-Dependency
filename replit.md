# CYP3A & OUD Research Facility — Interactive App

## Overview
An interactive educational web app presenting the research paper "The Role of the CYP3A4/5 Genes and Dopaminergic Pathways in Opioid Dependency" as a virtual research facility with 7 stations connected by an arrow path.

## Project Structure
- `src/App.jsx` — All app logic and components (single-file architecture)
- `src/App.css` — All styles
- `src/main.jsx` — React DOM root
- `index.html` — HTML shell
- `vite.config.js` — Vite config (port 5000, host 0.0.0.0)

## 7 Sections
1. **Entrance Hall** — Introduction, opioid crisis stats, research overview
2. **Genetics Lab** — CYP3A gene family, chromosome 7, enzyme structure
3. **Biochemistry Station** — SNPs, metabolism rates, opioid types
4. **Neuroscience Chamber** — Dopaminergic pathways, brain structure changes
5. **Pharmacology Wing** — Inducers, inhibitors, P450 cycle
6. **Clinical Office** — Opioid Risk Tool, personalized medicine
7. **Ethics & Citations Hall** — Ethics, conclusion, full references

## Interactive Elements
1. **Facility Map** — Clickable station navigation (click type)
2. **Stat Cards** — Hover to reveal detail (hover type)
3. **Enzyme Explorer** — Click-to-expand enzyme info (click type)
4. **SNP Drag-and-Drop** — Match SNP variants to clinical effects (drag-and-drop type)
5. **Metabolism Slider** — Adjust rate, see OUD risk change (slider type)
6. **Brain Region Map** — SVG brain with clickable hotspots (click/interactive diagram type)
7. **Neuroscience Quiz** — 4-question multiple choice quiz (quiz type)
8. **Pharmacology Tabs** — Switch between CYP3A4/5 modulators and P450 cycle (tabs type)
9. **ORT Calculator** — Interactive Opioid Risk Tool with score (form/calculator type)
10. **Ethics Accordions** — Click-to-expand ethical issues (accordion type)

## Run
```bash
npm run
```
App runs on port 5000.