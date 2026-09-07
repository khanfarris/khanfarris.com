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

The builder writes `kb-*.html`, `knowledge.html`, `knowledge-index.js`, and the marked study-archive section in `index.html`. All article cards and note counts update from the same source. Add an article to the data file and rebuild to include it throughout the site. Edit the source data or builder rather than generated article pages. The three opening previews are selected by slug in the builder's `featured` list; every other article follows automatically.

## Shared files

- `knowledge.css` styles the directory and study pages.
- `study-showcase.css` and `study-showcase.js` provide the homepage's animated, scrollable archive. It supports native swiping, mouse dragging, arrow buttons, keyboard navigation, and a position slider. Motion can be paused and respects the reduced-motion preference.
- `knowledge.js` provides filtering and the shuffled recall deck.
- `study-exercises.js` supplies eight local interactive exercises: subnetting, VLAN routing, ARP next-hop resolution and caching, DHCP, syslog filtering, incident response roles, Microsoft 365 access, and TCP header sizing. Their calculation and policy models are checked by `node scripts/validate-knowledge.cjs`.
- `knowledge-index.js` supplies search metadata and recall questions. Load it before `lab.js`.
- `reading.js` adds article navigation, progress, and code-copy controls.
- `lab.js` provides site search and homepage interactions.

Article content, directory links, and the horizontally scrollable homepage cards remain available without JavaScript. The investigation pages are retained. The retired ports, protocols, and Linux-command pages have been removed. `typing-test.html` remains available by direct URL and is intentionally absent from navigation, search, and the homepage terminal listing.

## Editorial scope

Use broad, simple titles and explain unfamiliar terms before using them. Concept notes teach the subject; tool guides cover product navigation, evidence, and routine work, linking to the separate concept note for theory. Include practical support or security-analysis examples and use exercises where interaction explains a real distinction. Do not add a “The Connection” section.

Use recent study material when relevant, and add beginner foundations for the intended role without presenting them as completed experience. The study-basis label distinguishes concept study, tool study, practiced calculations, scenario study, and lab application. Product guides are reading aids, not claims of production experience. Preserve useful worked examples and verify product-specific details with primary references. Simulated exercises are explicitly fictional and do not connect to customer systems or save answers.

Established article URLs remain stable: `kb-mdr.html` is now the general EDR/MDR/XDR note, `kb-blackpoint.html` covers Blackpoint, `kb-windows-domain.html` covers Active Directory, and `kb-tcp-streams.html` covers Wireshark. New Windows Server and TCP pages contain their separate foundations.

Only publication-ready article content belongs in this repository. Keep raw conversation exports, private source annotations, credentials, and signed download links outside it.
