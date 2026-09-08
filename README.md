# khanfarris.com

Static portfolio and security study notes, published through the existing GitHub Pages repository. The site requires no application server or package installation.

## Update the knowledge base

1. Edit `knowledge-content.json`. Each article has a simple topic title, a kind (concept, tool, or ecosystem guide), a plain-English introduction, a study-basis label, article content, a recall question, primary references, and related articles.
2. From the repository folder, run:

   ```text
   node scripts/build-knowledge.cjs
   ```

3. Preview the site through a local HTTP server. Review the article and directory before publishing.
4. Commit the source and generated pages together through GitHub Desktop, then push when ready to publish.

The builder writes `kb-*.html`, `knowledge.html`, `knowledge-index.js`, `khanos-content.js`, and the marked fallback study links in `index.html`. KhanOS uses the generated content for its constellation, reader, shell, and search. Add an article to the data file and rebuild to include it throughout the site. Archived articles remain accessible at their existing URLs and are excluded from discovery. Edit the source data or builder rather than generated article pages.

## KhanOS

The homepage is the KhanOS desktop. Whoami and Local Shell open initially; the dock opens the constellation, reader, investigations, and search. Whoami fits its content until manually resized. Double-click a constellation node or press Enter on it to open its note. Existing article URLs and Shiftrun remain available.

Crimson is the default palette: charcoal surfaces, crimson controls, and a midnight-blue particle orbit. The menu offers five palettes without resetting open windows. Theme links use `?theme=crimson`, `glacier`, `orchid`, `verdant`, or `ember`.

`khanos.js` manages the desktop. `khanos-common.css`, `khanos-base.css`, and `khanos.css` provide its styles; `khanos-palettes.js` and `palette-tokens.css` contain the matching color values. The reader calls `StudyExercises.mount(container)` after inserting each article, using the same activities as the standalone study pages.

## Shared files

- `knowledge.css` styles the directory and study pages.
- `study-showcase.css` and `study-showcase.js` retain the previous scrollable archive implementation. KhanOS now provides the homepage constellation; motion can be paused and respects the reduced-motion preference.
- `knowledge.js` provides filtering and the shuffled recall deck.
- `study-exercises.js` supplies eight local interactive exercises: subnetting, VLAN routing, ARP next-hop resolution and caching, DHCP, syslog filtering, incident response roles, Microsoft 365 access, and TCP header sizing. Their calculation and policy models are checked by `node scripts/validate-knowledge.cjs`.
- `knowledge-index.js` supplies search metadata and recall questions. Load it before `lab.js`.
- `reading.js` adds article navigation, progress, and code-copy controls.
- `lab.js` provides site search and homepage interactions.

Article content, directory links, and homepage fallback links remain available without JavaScript. The investigation pages are retained. The retired ports, protocols, and Linux-command pages have been removed. `typing-test.html` remains available by direct URL and is intentionally absent from navigation, search, and the homepage terminal listing.

## Editorial scope

Use broad, simple titles and explain unfamiliar terms before using them. Concept notes teach the subject; tool guides cover product navigation, evidence, and routine work, linking to the separate concept note for theory. Include practical support or security-analysis examples and use exercises where interaction explains a real distinction. Do not add a “The Connection” section.

Use recent study material when relevant, and add beginner foundations for the intended role without presenting them as completed experience. The study-basis label distinguishes concept study, tool study, practiced calculations, scenario study, and lab application. Product guides are reading aids, not claims of production experience. Preserve useful worked examples and verify product-specific details with primary references. Simulated exercises are explicitly fictional and do not connect to customer systems or save answers.

Established article URLs remain stable: `kb-mdr.html` is now the general EDR/MDR/XDR note, `kb-blackpoint.html` covers Blackpoint, `kb-windows-domain.html` covers Active Directory, and `kb-tcp-streams.html` covers Wireshark. New Windows Server and TCP pages contain their separate foundations.

Only publication-ready article content belongs in this repository. Keep raw conversation exports, private source annotations, credentials, and signed download links outside it.
