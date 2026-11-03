// Shared "screenshot an element -> multi-page A4 PDF" export — used by
// b-quest/b-quest-view.html and b-account/b-opportunity-view.html's own
// Save PDF buttons. Unlike color-picker.js/icon-picker.js this injects no
// DOM/CSS of its own (nothing to show) — just one function on window.
//
// Usage:
//   await exportElementToPDF(document.querySelector('.a4-page'), 'BQ-0485.pdf');
//
// Depends on html2canvas and jsPDF (window.jspdf) already being loaded by
// the host page — not bundled here, since every page that needs this
// already loads both for its own other reasons (canvas rendering, the
// library itself).
//
// Screenshots the target element exactly as styled on screen (colors,
// rounded corners, shadows all captured faithfully) instead of routing
// through the browser's native print pipeline, which depends on the
// viewer's own browser settings ("Background graphics", "Headers and
// footers") to look anything like the real page — see CLAUDE.md's note
// on this if a print-CSS approach is ever reconsidered instead.
//
// Sliced into successive A4 pages since the content this exports from
// (a task's role-card list, an opportunity's quotation list) has no
// fixed height — this is the standard jsPDF pattern for a canvas taller
// than one page: redraw the same full image on each page, shifted up by
// one page-height each time, so the page boundary itself does the slicing.
async function exportElementToPDF(target, filename) {
    if (!target) throw new Error('exportElementToPDF: target element not found');

    // windowWidth: html2canvas re-renders the page in a clone at this
    // width, so a phone still exports the desktop A4 layout instead of
    // its own narrow phone layout (media queries match the clone's width).
    const canvas = await html2canvas(target, { useCORS: true, scale: 2, backgroundColor: '#ffffff', windowWidth: Math.max(window.innerWidth, 1200) });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pageWidthMM = 210, pageHeightMM = 297;
    const imgHeightMM = (canvas.height * pageWidthMM) / canvas.width;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let heightLeft = imgHeightMM;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, pageWidthMM, imgHeightMM);
    heightLeft -= pageHeightMM;
    while (heightLeft > 0) {
        position = heightLeft - imgHeightMM;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidthMM, imgHeightMM);
        heightLeft -= pageHeightMM;
    }
    pdf.save(filename);
}

window.exportElementToPDF = exportElementToPDF;
