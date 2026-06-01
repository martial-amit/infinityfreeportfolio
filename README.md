# Amit Chouhan — Portfolio

Static portfolio (HTML, CSS, JS). Deployed via GitHub Actions → FTP (InfinityFree).

## Before deploy

1. Set your live URL in `index.html` → `<meta name="site-base" content="https://your-domain.com" />` (no trailing slash). Required for correct LinkedIn/Facebook link previews.
2. Confirm FormSubmit.co is activated for `martialamit5@gmail.com` (check inbox for their confirmation link).
3. Upload `assets/profile.png` and `assets/resume.pdf` if not already on the host.

## Files to upload after changes

- `index.html`
- `css/style.css`
- `js/main.js`
- `js/site-config.js`
- `php/send-mail.php` (only if using PHP mail instead of FormSubmit)

Hard-refresh after deploy: `Ctrl+Shift+R`.
