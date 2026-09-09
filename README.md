# khanfarris.com

Static portfolio and security study notes, published through the existing GitHub Pages repository. The site requires no application server or package installation.

## Update the knowledge base

1. Edit `knowledge-content.json`. Each article has a simple topic title, a kind (concept, tool, or ecosystem guide), a plain-English introduction, a study-basis label, article content, a recall question, primary references, and related articles.
2. From the repository folder, run:

   ```text
   node scripts/build-knowledge.cjs
   ```

3. Run `node scripts/validate-knowledge.cjs`, then preview the constellation and Reader through a local HTTP server.
4. Commit the source and generated files together through GitHub Desktop, then push when ready to publish.

The builder writes `khanos-content.js`, `knowledge-index.js`, and the marked fallback summaries in `index.html`. KhanOS uses the generated content for its constellation, Reader, shell, and search. Add an article to the data file and rebuild to include it throughout the desktop. Archived articles remain in the source data but are excluded from publication and discovery. Edit the source data or builder rather than generated output.

Study notes are published only within KhanOS. Link between note bodies with `href="#note-dns"`, or link from another page with `index.html#note-dns` (replace `dns` with the note's slug). The former `knowledge.html` directory and `kb-*.html` pages have been removed and are no longer generated.

## KhanOS

The homepage is the KhanOS desktop. Whoami, Featured item, and Local Shell open initially; the dock opens the constellation, Reader, Labs, and search. Whoami fits its content until manually resized. Double-click a constellation node or press Enter on it to open its note. Shiftrun remains available. Use `open labs` in the shell or `index.html#labs` to open Labs. The earlier `#investigations` route remains supported for existing bookmarks.

Crimson is the default palette: charcoal surfaces, crimson controls, and a midnight-blue particle orbit. The menu offers five palettes without resetting open windows. Theme links use `?theme=crimson`, `glacier`, `orchid`, `verdant`, or `ember`.

The background selector offers Orbit (the original), Helix, Ripple, Globe, and Vortex. The choice is remembered on this device and can be shared with `?background=helix` (or another background ID), alongside `theme` and a note hash. All designs follow the current signal color and the workspace motion controls, including reduced motion. `khanos-backgrounds.js` provides the fixed-size meshes and renderer; the desktop owns one animation loop and the menu previews stay still.

`khanos.js` manages the desktop. `khanos-common.css`, `khanos-base.css`, and `khanos.css` provide its styles; `khanos-palettes.js` and `palette-tokens.css` contain the matching color values. The Reader calls `StudyExercises.mount(container)` after inserting each article, preserving the original interactive activities.

## Shared files

- `knowledge.css` supplies the shared study and exercise styles used by KhanOS; retain it even though standalone study pages are gone.
- `study-showcase.css` and `study-showcase.js` retain the previous scrollable archive implementation. KhanOS now provides the homepage constellation; motion can be paused and respects the reduced-motion preference.
- `study-exercises.js` supplies local interactive exercises for subnetting, VLAN routing, ARP, DHCP, syslog, EDR/MDR roles, Microsoft 365 access, TCP headers, firewall rule order, route selection, switch learning, alert triage, phishing, vulnerability prioritization, and incident recovery decisions. Calculation boundaries, network behavior, and every evidence-case decision are checked by `node scripts/validate-knowledge.cjs`.
- `knowledge-index.js` supplies search metadata to retained lab pages and points each result into KhanOS Reader. Load it before `lab.js`.
- `reading.js` adds article navigation, progress, and code-copy controls.
- `lab.js` provides site search and homepage interactions.

The homepage retains plain-text topic summaries without JavaScript. Full study notes and interactive exercises require KhanOS. The Azure honeypot lab is available in Labs, the shell (`soc` or `honeypot`), and at `soc-honeypot.html`. Its “Read the complete lab” link opens the step-by-step article, with saved screenshots under `assets/investigations/soc-honeypot/`. `investigation.css` and `investigation.js` provide its reading layout and palette continuity. The LIFX lab at `lifx-pentest.html` uses the same build, findings, recall, and red Recap format, and its complete-lab button is active in Labs. The original `LIFX_Pentest_Runbook.pdf` remains linked as historical lab notes; the webpage supplies the revised explanations. The vulnerability scanning lab at `vulnerability-scan.html` uses the same format and is available through Labs and the shell (`vuln` or `tenable`). It distinguishes illustrative Windows 11 resource names from the supplied Windows 10 tutorial results; its two reference images are under `assets/investigations/vulnerability-scan/`. Their remaining knowledge navigation and search links now open KhanOS. The retired ports, protocols, and Linux-command pages have been removed. `typing-test.html` remains available by direct URL and is intentionally absent from navigation, search, and the homepage terminal listing.

For future lab writeups, keep tutorial attribution general (for example, “a tutorial I followed”). Do not link to or identify the specific video, tutorial title, creator, or channel. Never mention transcripts in lab copy. Refer to screenshots as “my saved lab screenshots.” Retain useful official product documentation links and accurate distinctions between reference material and observed results.

The Samsung TV lab is archived. Its original `samsung-tv-pentest.html` and `Samsung_TV_Pentest_Runbook.pdf` remain available by direct URL. The article is labeled archived and has `noindex, nofollow` metadata; it is excluded from Labs, shell commands and listings, site search, homepage navigation, and related-lab recommendations.

## Editorial scope

Use broad, simple titles and explain unfamiliar terms before using them. Concept notes teach the subject; tool guides cover product navigation, evidence, and routine work, linking to the separate concept note for theory. Include practical support or security-analysis examples and use exercises where interaction explains a real distinction. Do not add a “The Connection” section.

Use recent study material when relevant, and add beginner foundations for the intended role without presenting them as completed experience. The study-basis label distinguishes concept study, tool study, practiced calculations, scenario study, and lab application. Product guides are reading aids, not claims of production experience. Preserve useful worked examples and verify product-specific details with primary references. Simulated exercises are explicitly fictional and do not connect to customer systems or save answers.

Keep established article slugs stable so Reader links continue working: `mdr` is the general EDR/MDR/XDR note and `windows-domain` covers Active Directory. Archived tool notes can be revised and republished later by updating their source data.

The job-preparation collection also covers malware, security controls, risk, security awareness, VPNs, troubleshooting across Windows and macOS, change management, and technical documentation. IT operations is a separate subject filter. Related-note links connect those foundations to existing studies; the constellation maintains a minimum row height and scrolls as the archive grows. Counts come from the content, not a fixed total in the interface.

Only publication-ready article content belongs in this repository. Keep raw conversation exports, private source annotations, credentials, and signed download links outside it.
