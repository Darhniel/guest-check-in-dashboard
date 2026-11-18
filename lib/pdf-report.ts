/**
 * Generates a downloadable PDF of the infographic report.
 *
 * The target DOM node is rendered to a canvas with html-to-image, then sliced
 * into page-sized bitmaps and placed on A4 pages with jspdf. Slicing keeps each
 * image small, which avoids the multi-minute encode times (and canvas memory
 * spikes) that occur when one very tall PNG is embedded on every page. Nodes
 * marked `data-pdf-exclude="true"` (for example the very long guest table) are
 * hidden while capturing so the PDF stays readable and avoids canvas limits.
 */
import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

interface DownloadPdfOptions {
    /** DOM node to capture (usually the hero + summary infographic). */
    container: HTMLElement;
    filename: string;
    /** Padding around each captured page, in millimetres. */
    margin?: number;
    /** Page background used behind transparent sections. */
    backgroundColor?: string;
}

const settleLayout = () =>
    new Promise<void>((resolve) => {
        // `requestAnimationFrame` is paused in background tabs, so use a
        // macrotask instead and let the explicit layout read below flush.
        window.setTimeout(resolve, 0);
    });

/** Reject a hung capture instead of leaving the download button spinning. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
    return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error(message)), ms);
        promise.then(
            (value) => {
                window.clearTimeout(timer);
                resolve(value);
            },
            (error: unknown) => {
                window.clearTimeout(timer);
                reject(error);
            }
        );
    });
}

/** Capture `container` to PNG and wrap it in a multi-page PDF. */
export async function downloadPdfReport({
    container,
    filename,
    margin = 10,
    backgroundColor = '#ffffff',
}: DownloadPdfOptions): Promise<void> {
    // The capture reflects the client-facing layout, so internal-only blocks
    // marked `data-pdf-exclude` are hidden and the page can rebalance its grid
    // for the printed version via the data attribute below.
    const hidden: { element: HTMLElement; cssText: string }[] = [];
    const unhidden: { element: HTMLElement }[] = [];
    container.setAttribute('data-capturing-pdf', 'true');
    container
        .querySelectorAll<HTMLElement>('[data-pdf-unhide="true"]')
        .forEach((element) => {
            if (!element.hidden) return;
            unhidden.push({ element });
            element.hidden = false;
        });
    container
        .querySelectorAll<HTMLElement>('[data-pdf-exclude="true"]')
        .forEach((element) => {
            hidden.push({ element, cssText: element.style.cssText });
            element.style.display = 'none';
        });

    try {
        // Hide excluded sections before measuring, then let the browser apply
        // the new layout so the captured height matches the visible report.
        await settleLayout();
        await settleLayout();
        await document.fonts.ready;
        await new Promise<void>((resolve) => window.setTimeout(resolve, 100));

        const width = Math.max(container.scrollWidth, container.offsetWidth);
        const height = Math.max(container.scrollHeight, container.offsetHeight);
        if (width === 0 || height === 0) {
            throw new Error('The report is not visible yet. Please try again.');
        }

        // Keep the bitmap within browser canvas limits while still looking
        // sharp on screen and in print.
        const pixelRatio = height > 7000 ? 1 : height > 3600 ? 1.5 : 2;

        const canvas = await withTimeout(
            toCanvas(container, {
                cacheBust: true,
                pixelRatio,
                backgroundColor,
                width,
                height,
                style: {
                    transform: 'none',
                },
            }),
            30000,
            'Capturing the report took too long. Please try again.'
        );

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;
        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('The report could not be rendered.');
        }

        // Each slice covers one printed page, so the bitmap added to the PDF
        // is roughly A4-sized instead of the full (very tall) report. Break
        // between cards and panel rows rather than only at top-level sections,
        // so pages are filled without cutting a card in half.
        const pageCssHeight = (width * usableHeight) / usableWidth;
        const bounds = container.getBoundingClientRect();
        const blocks: { top: number; bottom: number }[] = [];
        const pushBlock = (element: Element) => {
            if (element.getClientRects().length === 0) return;
            const rect = element.getBoundingClientRect();
            if (rect.height < 1) return;
            blocks.push({
                top: rect.top - bounds.top,
                bottom: rect.bottom - bounds.top,
            });
        };
        /**
         * Split a multi-row grid into its rows so one page break can land
         * between stacked panels. Grids with a single row stay atomic, which
         * keeps side-by-side cards from being separated by a page boundary.
         */
        const pushRows = (element: Element): boolean => {
            if (element.children.length < 2) return false;
            const rows = new Map<number, { top: number; bottom: number }>();
            Array.from(element.children).forEach((child) => {
                if (child.getClientRects().length === 0) return;
                const rect = child.getBoundingClientRect();
                if (rect.height < 1) return;
                const top = rect.top - bounds.top;
                const bottom = rect.bottom - bounds.top;
                const key = Math.round(top);
                const row = rows.get(key);
                if (row) row.bottom = Math.max(row.bottom, bottom);
                else rows.set(key, { top, bottom });
            });
            if (rows.size < 2) return false;
            Array.from(rows.values())
                .sort((a, b) => a.top - b.top)
                .forEach((row) => blocks.push(row));
            return true;
        };
        Array.from(container.children).forEach((child) => {
            if (child.getClientRects().length === 0) return;
            const display = window.getComputedStyle(child).display;
            if (display === 'grid' && pushRows(child)) return;
            pushBlock(child);
        });
        blocks.sort((a, b) => a.top - b.top);

        const cuts: { start: number; end: number }[] = [];
        let pageStart = 0;
        for (const block of blocks) {
            if (block.bottom - pageStart <= pageCssHeight) continue;

            // Start a new page before this block when it would overflow the
            // current one.
            if (block.top > pageStart) {
                cuts.push({ start: pageStart, end: block.top });
                pageStart = block.top;
                if (block.bottom - pageStart <= pageCssHeight) continue;
            }

            // A single block taller than a page has to be split internally.
            while (block.bottom - pageStart > pageCssHeight) {
                cuts.push({ start: pageStart, end: pageStart + pageCssHeight });
                pageStart += pageCssHeight;
            }
        }
        cuts.push({ start: pageStart, end: height });

        const scaleY = canvas.height / height;
        let pageAdded = false;
        cuts.forEach((cut) => {
            const top = Math.max(0, Math.floor(cut.start * scaleY));
            const bottom = Math.min(
                canvas.height,
                Math.ceil(cut.end * scaleY)
            );
            const sliceCanvasHeight = bottom - top;
            if (sliceCanvasHeight <= 0) return;

            const slice = document.createElement('canvas');
            slice.width = canvas.width;
            slice.height = sliceCanvasHeight;
            const sliceContext = slice.getContext('2d');
            if (!sliceContext) {
                throw new Error('Canvas rendering is not supported here.');
            }
            sliceContext.fillStyle = backgroundColor;
            sliceContext.fillRect(0, 0, slice.width, slice.height);
            sliceContext.drawImage(
                canvas,
                0,
                top,
                canvas.width,
                sliceCanvasHeight,
                0,
                0,
                canvas.width,
                sliceCanvasHeight
            );

            if (pageAdded) pdf.addPage();
            pageAdded = true;
            const drawHeight = usableWidth * (sliceCanvasHeight / canvas.width);
            pdf.addImage(
                slice.toDataURL('image/png'),
                'PNG',
                margin,
                margin,
                usableWidth,
                drawHeight
            );
        });

        // Page numbers make the printed report easier to navigate.
        const pageCount = pdf.getNumberOfPages();
        for (let page = 1; page <= pageCount; page += 1) {
            pdf.setPage(page);
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 130);
            pdf.text(
                `${page} / ${pageCount}`,
                pageWidth - margin,
                pageHeight - 4,
                { align: 'right' }
            );
        }

        const safeFilename = filename.endsWith('.pdf')
            ? filename
            : `${filename}.pdf`;
        pdf.save(safeFilename);
    } finally {
        container.removeAttribute('data-capturing-pdf');
        hidden.forEach(({ element, cssText }) => {
            element.style.cssText = cssText;
        });
        unhidden.forEach(({ element }) => {
            element.hidden = true;
        });
    }
}
