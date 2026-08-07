"use client";

/**
 * Export PDF pentru cererile primite pe formulare.
 *
 * Nu folosim o bibliotecă de PDF: ar însemna încă un pachet în bundle și
 * fonturi încorporate manual pentru diacritice (ă, î, ș, ț). Documentul se
 * construiește ca HTML și se tipărește printr-un iframe ascuns — browserul
 * oferă „Salvează ca PDF”, cu diacriticele și paginarea rezolvate de el.
 *
 * Iframe și nu fereastră nouă: nu îl blochează pop-up blocker-ul și nu moștenește
 * stilurile aplicației (dialogul din admin ar strica aranjarea în pagină).
 */

import type {
  FormDefinition,
  FormSubmission,
  OrganizationInfo,
} from "@/lib/tenants/types";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLei(total: number): string {
  return `${total.toLocaleString("ro-RO")} lei`;
}

/** `2026-08-07` — pentru numele fișierului propus de browser. */
function fileStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Etichetele câmpurilor completabile, în ordinea din formular. */
export function answerLabels(form: FormDefinition): string[] {
  return (form.fields ?? [])
    .filter((f) => f.type !== "section" && f.type !== "info")
    .map((f) => f.label);
}

/** Valorile unei cereri, aliniate la coloanele din `answerLabels`. */
export function answersByLabel(sub: FormSubmission): Map<string, string> {
  return new Map(sub.answers.map((a) => [a.label, a.value]));
}

/** Datele juridice ale organizatorului, pe un rând, ca în subsolul public. */
function organizationLine(org: OrganizationInfo): string {
  const address = [org.address, org.city, org.county].filter(Boolean).join(", ");
  const bank = [org.iban, org.bank].filter(Boolean).join(" – ");
  return [
    address,
    org.cif ? `CIF: ${org.cif}` : "",
    org.regCom,
    bank,
    org.email,
    org.phone,
    org.note,
  ]
    .filter((part) => part && String(part).trim())
    .join(" | ");
}

function organizationHtml(org: OrganizationInfo): string {
  const line = organizationLine(org);
  if (!org.name && !line) return "";
  return `<footer>
      ${org.name ? `<p class="org-name">${esc(org.name)}</p>` : ""}
      ${line ? `<p>${esc(line)}</p>` : ""}
    </footer>`;
}

/** Stilurile documentului tipărit; `landscape` doar pentru tabelul cu toate cererile. */
function styles(landscape: boolean): string {
  return `
    @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 11pt/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #1c1917;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    header { border-bottom: 2px solid #1c1917; padding-bottom: 8px; margin-bottom: 18px; }
    .site { font-size: 9pt; letter-spacing: .08em; text-transform: uppercase; color: #78716c; }
    h1 { font-size: 16pt; margin: 4px 0 2px; }
    .meta { font-size: 9pt; color: #78716c; }
    dl { margin: 0; }
    .row { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid #e7e5e4; }
    .row dt { flex: 0 0 38%; font-size: 9pt; text-transform: uppercase; letter-spacing: .04em; color: #78716c; }
    .row dd { flex: 1; margin: 0; white-space: pre-wrap; }
    h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: .06em; margin: 18px 0 6px; color: #57534e; }
    .total { display: flex; justify-content: space-between; margin-top: 14px; padding-top: 10px;
             border-top: 2px solid #1c1917; font-weight: 700; font-size: 12pt; }
    .sign { display: flex; gap: 40px; margin-top: 34px; font-size: 9pt; color: #57534e; }
    .sign div { flex: 1; border-top: 1px solid #a8a29e; padding-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 8pt; }
    th, td { border: 1px solid #d6d3d1; padding: 4px 6px; text-align: left; vertical-align: top;
             word-break: break-word; }
    th { background: #f5f5f4; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .04em; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    footer { margin-top: 26px; padding-top: 8px; border-top: 1px solid #e7e5e4;
             font-size: 8pt; line-height: 1.5; color: #78716c; }
    .org-name { font-weight: 600; color: #44403c; margin: 0 0 2px; }
    footer p { margin: 0; }
  `;
}

/**
 * Scrie documentul într-un iframe ascuns și deschide dialogul de tipărire.
 * Iframe-ul se curăță după tipărire (`afterprint`), cu o plasă de siguranță la
 * un minut pentru browserele care nu emit evenimentul.
 */
function printDocument(title: string, body: string, landscape: boolean): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  // În afara ecranului, nu `display:none` sau `visibility:hidden`: un iframe
  // ascuns așa nu se tipărește în unele browsere.
  frame.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(
    `<!doctype html><html lang="ro"><head><meta charset="utf-8">` +
      `<title>${esc(title)}</title><style>${styles(landscape)}</style></head>` +
      `<body>${body}</body></html>`
  );
  doc.close();

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    frame.remove();
  };
  win.addEventListener("afterprint", cleanup);
  window.setTimeout(cleanup, 60_000);

  const run = () => {
    win.focus();
    win.print();
  };
  if (doc.readyState === "complete") run();
  else frame.addEventListener("load", run);
}

/** O singură cerere, pe o pagină A4 — răspunsuri, total și subsolul organizatorului. */
export function printSubmission(
  form: FormDefinition,
  sub: FormSubmission,
  org: OrganizationInfo,
  siteName: string
): void {
  const rows = sub.answers
    .map((answer) => {
      if (answer.type === "section") return `<h2>${esc(answer.label)}</h2>`;
      return `<div class="row"><dt>${esc(answer.label)}</dt><dd>${
        esc(answer.value) || "—"
      }</dd></div>`;
    })
    .join("");

  const body = `
    <header>
      ${siteName ? `<p class="site">${esc(siteName)}</p>` : ""}
      <h1>${esc(sub.formTitle || form.title)}</h1>
      <p class="meta">Cerere trimisă ${esc(formatMoment(sub.createdAt))}</p>
    </header>
    <dl>${rows}</dl>
    ${
      sub.total
        ? `<div class="total"><span>Total estimat</span><span>${esc(
            formatLei(sub.total)
          )}</span></div>`
        : ""
    }
    <div class="sign">
      <div>Semnătura solicitantului</div>
      <div>Data</div>
    </div>
    ${organizationHtml(org)}
  `;

  const stamp = fileStamp(sub.createdAt);
  printDocument(
    `cerere-${form.slug || "formular"}${stamp ? `-${stamp}` : ""}`,
    body,
    false
  );
}

/** Toate cererile într-un tabel A4 landscape — o coloană per câmp. */
export function printSubmissionsTable(
  form: FormDefinition,
  subs: FormSubmission[],
  org: OrganizationInfo,
  siteName: string
): void {
  const labels = answerLabels(form);
  const hasTotal = subs.some((s) => s.total);
  const header = ["Data", ...labels, ...(hasTotal ? ["Total"] : [])]
    .map((label) => `<th>${esc(label)}</th>`)
    .join("");

  const rows = subs
    .map((sub) => {
      const byLabel = answersByLabel(sub);
      const cells = [
        formatMoment(sub.createdAt),
        ...labels.map((label) => byLabel.get(label) ?? ""),
        ...(hasTotal ? [sub.total ? formatLei(sub.total) : "—"] : []),
      ];
      return `<tr>${cells.map((c) => `<td>${esc(c) || "—"}</td>`).join("")}</tr>`;
    })
    .join("");

  const body = `
    <header>
      ${siteName ? `<p class="site">${esc(siteName)}</p>` : ""}
      <h1>${esc(form.title)} — cereri primite</h1>
      <p class="meta">${subs.length} ${
        subs.length === 1 ? "cerere" : "cereri"
      }, listate ${esc(formatMoment(new Date().toISOString()))}</p>
    </header>
    <table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>
    ${organizationHtml(org)}
  `;

  printDocument(`cereri-${form.slug || "formular"}`, body, true);
}
