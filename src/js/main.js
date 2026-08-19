class SignatureGenerator {
    constructor() {
        this.config = null;
        this.translations = null;
        this.currentLanguage = 'de';
        this.init();
    }

    async init() {
        try {
            await this.loadConfigurations();
            this.setupEventListeners();
            this.updateLanguage(this.currentLanguage);
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to load application configuration');
        }
    }

    async loadConfigurations() {
        try {
            const [configResponse, translationsResponse] = await Promise.all([
                fetch('config/app-config.json'),
                fetch('config/translations.json')
            ]);

            if (!configResponse.ok || !translationsResponse.ok) {
                throw new Error('Failed to load configuration files');
            }

            this.config = await configResponse.json();
            this.translations = await translationsResponse.json();
        } catch (error) {
            throw new Error('Configuration loading failed: ' + error.message);
        }
    }

    setupEventListeners() {
        // Language switcher
        document.querySelectorAll('.langue a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = this.getLangFromHref(link.href);
                this.updateLanguage(lang);
            });
        });

        // Form submission
        const form = document.querySelector('#signatureForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSignature();
            });
        }
    }

    getLangFromHref(href) {
        if (href.includes('FR') || href.includes('fr')) return 'fr';
        if (href.includes('IT') || href.includes('it')) return 'it';
        return 'de';
    }

    updateLanguage(lang) {
        this.currentLanguage = lang;

        // Update active language indicator
        document.querySelectorAll('.langue li').forEach(li => li.classList.remove('active'));
        document.querySelectorAll('.langue a').forEach(link => {
            const linkLang = this.getLangFromHref(link.href);
            if (linkLang === lang) {
                link.parentElement.classList.add('active');
            }
        });

        // Update UI text
        this.updateUIText();
    }

    updateUIText() {
        const ui = this.translations.ui[this.currentLanguage];

        // Update title
        document.title = ui.title;

        // Update form labels and placeholders
        const elements = {
            '.column:nth-of-type(1) .info .label': ui.myInfo,
            '.column:nth-of-type(2) .info .label': ui.myRole,
            '.gender-select h2': ui.gender,
            'label[for="male"]': ui.male,
            'label[for="female"]': ui.female,
            'label[for="diverse"]': ui.diverse,
            'input[name="firstname"]': { placeholder: ui.namePlaceholder },
            'input[name="pfadiName"]': { placeholder: ui.pfadiPlaceholder },
            'input[name="mail"]': { placeholder: ui.emailPlaceholder },
            'input[name="roleLine1"]': { placeholder: ui.roleLine1Placeholder },
            'input[name="roleLine2"]': { placeholder: ui.roleLine2Placeholder },
            'input[name="phone"]': { placeholder: ui.phonePlaceholder },
            '.button': { value: ui.submitButton }
        };

        Object.entries(elements).forEach(([selector, content]) => {
            const element = document.querySelector(selector);
            if (element) {
                if (typeof content === 'object') {
                    Object.assign(element, content);
                } else {
                    element.textContent = content;
                }
            }
        });
    }

    validateForm(formData) {
        const errors = [];

        // Check required fields
        this.config.form.validation.required.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                errors.push(`${field} is required`);
            }
        });

        // Validate email
        if (formData.mail && !new RegExp(this.config.form.validation.emailPattern).test(formData.mail)) {
            errors.push('Invalid email format');
        }

        console.error('Validation errors:', errors);

        return errors;
    }

    generateSignature() {
        const form = document.querySelector('#signatureForm');
        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Validate form
        const errors = this.validateForm(data);
        if (errors.length > 0) {
            this.showError('Please fill in all required fields correctly');
            return;
        }

        // Generate signature HTML
        const signatureHTML = this.buildSignatureHTML(data);

        // Show signature
        this.displaySignature(signatureHTML);
    }

    buildSignatureHTML(data) {
        const pronoun = this.translations.pronouns[data.gender] || '';
        const pronounSpan = pronoun ? ` <span style="font-weight: 300;">(${pronoun})</span>` : '';
        const nameLine = `${data.firstname}${data.pfadiName ? ' / ' + data.pfadiName : ''}${pronounSpan}`;

        const linkStyle = 'color: #086CB3; text-decoration: underline;';
        const mailLink = `<a href="mailto:${data.mail || ''}" style="${linkStyle}">${data.mail || ''}</a>`;
        const contactLine = data.phone
            ? `${mailLink} / Tel. ${data.phone}`
            : mailLink;

        const font = `font-family: '${this.config.signature.fontFamily}'; font-size: ${this.config.signature.fontSize};`;
        const p = (content, extraStyle = '') => `<p style="margin: 0; text-align: left; ${font} ${extraStyle}">${content}</p>`;

        const orgLine = `<b>${this.config.signature.organizationShortName}</b> - ${this.config.signature.organizationSuffix}`;

        return `
            <table id="t01">
                <tr>
                    <td style="margin: 0; padding: 0; line-height: 15px">
                        ${p(nameLine, 'font-weight: 700;')}
                        ${p(data.roleLine1 || '', 'font-weight: 300;')}
                        ${data.roleLine2 ? p(data.roleLine2, 'font-weight: 300;') : ''}
                        ${p(contactLine, 'font-weight: 300;')}
                        <br>
                        ${p(orgLine, 'font-weight: 300;')}
                        ${p(this.config.signature.addressLine1, 'font-weight: 300;')}
                        ${p(this.config.signature.addressLine2, 'font-weight: 300;')}
                        ${p(`<a href="https://${this.config.signature.websiteUrl}" target="_blank" style="${linkStyle}">${this.config.signature.websiteUrl}</a>`, 'font-weight: 300;')}
                        <br>
                        <img src="${this.config.signature.logoPath}" alt="Pfadi Züri Logo" width="${this.config.signature.logoWidth}">
                    </td>
                </tr>
            </table>
        `;
    }

    displaySignature(signatureHTML) {
        // Hide form and show signature
        const container = document.querySelector('.container');
        const ui = this.translations.ui[this.currentLanguage];

        container.innerHTML = `
            <div class="signature-result">
                <div class="signature-actions">
                    <button onclick="app.copySignatureHTML()" class="button">${ui.copyButton}</button>
                    <button onclick="app.resetForm()" class="button">${ui.newSignatureButton}</button>
                </div>
                <div class="signature-display">
                    ${signatureHTML}
                </div>
            </div>
        `;
    }

    copySignatureHTML() {
        const signatureDisplay = document.querySelector('.signature-display');
        if (!signatureDisplay) {
            const ui = this.translations.ui[this.currentLanguage];
            this.showError(ui.copyError || 'No signature found to copy');
            return;
        }

        // Get the full HTML including table and styles
        let signatureHTML = signatureDisplay.innerHTML;

        // Wrap with a minimal HTML structure for Outlook
        const fullHTML = `<!DOCTYPE html>
<html><head><meta charset='UTF-8'></head><body style="font-family: ${this.config.signature.fontFamily}; font-size: ${this.config.signature.fontSize};">
${signatureHTML}
</body></html>`;

        // Use Clipboard API with 'text/html' for Outlook compatibility
        if (navigator.clipboard && window.ClipboardItem) {
            const blob = new Blob([fullHTML], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            navigator.clipboard.write([clipboardItem]).then(() => {
                const ui = this.translations.ui[this.currentLanguage];
                this.showSuccess(ui.copySuccess || 'Signature HTML copied to clipboard!');
            }).catch((err) => {
                console.error('Failed to copy to clipboard:', err);
                this.fallbackCopyTextToClipboard(fullHTML);
            });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            // Fallback: copy as plain text (may lose formatting)
            navigator.clipboard.writeText(fullHTML).then(() => {
                const ui = this.translations.ui[this.currentLanguage];
                this.showSuccess(ui.copySuccess || 'Signature HTML copied to clipboard!');
            }).catch((err) => {
                console.error('Failed to copy to clipboard:', err);
                this.fallbackCopyTextToClipboard(fullHTML);
            });
        } else {
            // Fallback for older browsers
            this.fallbackCopyTextToClipboard(fullHTML);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            const ui = this.translations.ui[this.currentLanguage];
            if (successful) {
                this.showSuccess(ui.copySuccess || 'Signature HTML copied to clipboard!');
            } else {
                this.showError(ui.copyError || 'Failed to copy to clipboard');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            const ui = this.translations.ui[this.currentLanguage];
            this.showError(ui.copyError || 'Copy to clipboard not supported');
        }

        document.body.removeChild(textArea);
    }

    resetForm() {
        location.reload();
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SignatureGenerator();
});
