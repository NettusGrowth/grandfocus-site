// Regression guard for the four approved B2B acquisition routes.
// Read-only checks: never contact APIs, register leads, or emit ad conversions.
const fs = require('node:fs');
const path = require('node:path');

const routes = new Map([
  ['index.html', 'b2b_spectacle_a'],
  ['bastidores/index.html', 'b2b_backstage'],
  ['experiencias/index.html', 'b2b_complementary'],
  ['especiais/index.html', 'b2b_special'],
]);
const errors = [];
const requiredAssets = ['landing/config.js', 'landing/landing.js', 'landing/form-first.css', 'privacidade/index.html'];
const norm = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const requireTrue = (condition, message) => { if (!condition) errors.push(message); };

for (const asset of requiredAssets) {
  requireTrue(fs.existsSync(path.join('dist', asset)), `Missing published asset: ${asset}`);
}

for (const [file, id] of routes) {
  const target = path.join('dist', file);
  if (!fs.existsSync(target)) { errors.push(`Missing route: ${file}`); continue; }
  const html = fs.readFileSync(target, 'utf8');
  const text = norm(html);
  const forms = [...html.matchAll(/<form\b[^>]*id="lead-form"[^>]*>[\s\S]*?<\/form>/gi)];
  const form = forms[0]?.[0] || '';
  requireTrue(forms.length === 1, `${file}: expected exactly one lead form`);
  requireTrue(form.includes(`data-landing="${id}"`) && form.includes('data-funnel="b2b"'), `${file}: wrong funnel/landing mapping`);
  requireTrue(/<button\b[^>]*type="submit"/i.test(form), `${file}: missing submit control`);
  requireTrue(!form.includes('id="consent"'), `${file}: consent must stay outside the lead form`);
  requireTrue(html.indexOf('id="consent"') > html.indexOf('</footer>'), `${file}: cookie choice must be after the footer`);
  requireTrue(['id="consent-no"', 'id="consent-yes"', 'id="privacy-settings"'].every(x => html.includes(x)), `${file}: missing privacy controls`);
  requireTrue(html.includes('href="/privacidade/"'), `${file}: missing privacy link`);
  requireTrue(html.includes('/landing/landing.js') && html.includes('/landing/config.js'), `${file}: missing lead form scripts`);
  requireTrue(!text.includes('sao carlos') && !text.includes('2027'), `${file}: retired regional/dated offer copy detected`);
}
const retiredBlockRoutes = [
  'index.html', 'bastidores/index.html', 'experiencias/index.html', 'especiais/index.html',
  'ensaios/danca/index.html', 'escolas/espetaculos/index.html',
  'escolas/espetaculos-b/index.html', 'escolas/natal/index.html'
];
for (const file of retiredBlockRoutes) {
  const html = fs.readFileSync(path.join('dist', file), 'utf8');
  requireTrue(!/class="(?:trust|condition)"/.test(html), `${file}: retired trust/condition block reintroduced`);
  requireTrue(!html.includes('Atendimento direto pela Grand Focus'), `${file}: retired reassurance message reintroduced`);
  requireTrue(html.includes('</section></div><footer>'), `${file}: form should transition directly to footer`);
}
const config = fs.readFileSync(path.join('dist', 'landing/config.js'), 'utf8');
const handler = fs.readFileSync(path.join('dist', 'landing/landing.js'), 'utf8');
requireTrue(/launchApproved:true/.test(config), 'Launch configuration is unexpectedly disabled');
requireTrue(/adsEnabled:true/.test(config), 'Existing ad measurement configuration unexpectedly disabled');
requireTrue(/\bga4:null\b/.test(config), 'GA4 setting changed: confirm actual measurement ID before release');
requireTrue(/\bgtm:null\b/.test(config), 'GTM setting changed: confirm actual container ID before release');
requireTrue(handler.includes('if(!live||!allowed||!tagReady||!analyticsConfigured)return'), 'Consent gate missing from measurement events');
requireTrue(handler.includes('if(!live||!allowed||f.dataset.funnel!=="b2b"||(!c.adsEnabled&&!analyticsConfigured))return'), 'Consent gate missing from tag initialization');
requireTrue(handler.includes('if(result.created)'), 'Conversion must only count newly created leads');
requireTrue(handler.includes('transaction_id:result.leadId'), 'Conversion deduplication ID missing');
if (errors.length) {
  for (const error of errors) console.error('FAIL:', error);
  process.exit(1);
}
console.log('PASS: four B2B pages, privacy controls, lead scripts, and consent/conversion safeguards.');
