import { Injectable } from '@angular/core';
import {
  STUDENT_CARD_PRINT_BASE_CSS,
  STUDENT_CARD_PRINT_IMAGE_WAIT_MS,
  STUDENT_CARD_PRINT_STYLE_WAIT_MS,
  buildStudentCardPageCss
} from './student-card-print.styles';

/**
 * ERP-style card print: iframe + exact CR80 @page size so design is not
 * flattened onto a portrait A4 sheet.
 */
@Injectable({ providedIn: 'root' })
export class StudentCardPrintService {
  async waitForImages(root: HTMLElement, timeoutMs = STUDENT_CARD_PRINT_IMAGE_WAIT_MS): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const pending = Array.from(root.querySelectorAll('img')).some(img => !(img as HTMLImageElement).complete);
      if (!pending) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /** Alias used by print callers — wait for images then a short paint settle. */
  async waitForFaceAssets(root: HTMLElement, timeoutMs = STUDENT_CARD_PRINT_IMAGE_WAIT_MS): Promise<void> {
    await this.waitForImages(root, timeoutMs);
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  /**
   * @param sheet Root that contains .card-print-page sheets (front+back on one page)
   * @param widthMm Card width (default CR80)
   * @param heightMm Card height (default CR80)
   * @param hasBack Include space for back face on the same page
   */
  async print(
    sheet: HTMLElement,
    title = 'Student ID card',
    widthMm = 85.6,
    heightMm = 53.98,
    hasBack = true
  ): Promise<void> {
    const pageCss = buildStudentCardPageCss(widthMm, heightMm, hasBack);

    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);
    const previousTitle = document.title;

    try {
      const frameDocument = frame.contentDocument;
      const frameWindow = frame.contentWindow;
      if (!frameDocument || !frameWindow) {
        throw new Error('The print window could not be opened.');
      }

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(node => node.outerHTML)
        .join('\n');

      // Prefer dedicated print pages; fall back to whole sheet.
      const pages = sheet.querySelectorAll('.card-print-page');
      const bodyHtml = pages.length
        ? Array.from(pages).map(p => p.outerHTML).join('\n')
        : sheet.innerHTML;

      frameDocument.open();
      frameDocument.write(
        `<!doctype html><html><head><meta charset="utf-8"><title>${this.escape(title)}</title>` +
        `<base href="${document.baseURI}">${styles}<style>${STUDENT_CARD_PRINT_BASE_CSS}\n${pageCss}</style></head>` +
        `<body>${bodyHtml}</body></html>`
      );
      frameDocument.close();

      await this.waitForStylesheets(frameDocument);
      await this.waitForImages(frameDocument.body);

      await new Promise<void>(resolve => {
        let done = false;
        const finish = () => {
          if (done) {
            return;
          }
          done = true;
          resolve();
        };
        frameWindow.addEventListener('afterprint', finish, { once: true });
        document.title = title;
        frameWindow.focus();
        frameWindow.print();
        setTimeout(finish, 800);
      });
    } finally {
      document.title = previousTitle;
      setTimeout(() => frame.remove(), 1000);
    }
  }

  private async waitForStylesheets(frameDocument: Document): Promise<void> {
    const links = Array.from(frameDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
    await Promise.race([
      Promise.all(
        links.map(link =>
          link.sheet
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                link.addEventListener('load', () => resolve(), { once: true });
                link.addEventListener('error', () => resolve(), { once: true });
              })
        )
      ),
      new Promise(resolve => setTimeout(resolve, STUDENT_CARD_PRINT_STYLE_WAIT_MS))
    ]);
  }

  private escape(value: string): string {
    return value.replace(/[&<>"]/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c)
    );
  }
}
