import { Sheet } from './Bits.jsx';

// A real person to reach, always one tap away. DK Sites promises direct access to Dylan,
// so the help button leads with that, then answers the questions people actually ask.
const PHONE = '(860) 385-2334';
const PHONE_TEL = '+18603852334';
const EMAIL = 'dylan@dksitesllc.com';

const FAQ = [
  ['How much does it cost?', 'Building and changing your site is free. When you go live you pay once for the year: your web address (if you need a new one), hosting with the secure padlock and email, plus a service fee. You see the exact total before you pay.'],
  ['Do I need to know anything technical?', 'No. Describe changes in your own words, like “make the phone number bigger” or “add our Sunday hours”, and the site is updated for you.'],
  ['Will my changes undo each other?', 'No. Each change only touches what you asked for, and everything you asked for earlier stays. You can see and undo any earlier change in the editor.'],
  ['What’s a domain?', 'Your web address, like yourbusiness.com. You can buy a new one here, or keep one you already own and point it at your new site.'],
  ['What if I don’t like it?', 'Ask for changes, as many as you want. Or start over with a fresh design. Nothing is charged until you choose to go live.'],
  ['Can someone just build it for me?', 'Yes. DK Sites also designs custom sites by hand. Call or text and we’ll talk it through.'],
];

export default function Help({ onClose }) {
  return (
    <Sheet title="Need a hand?" onClose={onClose}>
      <p className="muted" style={{ margin: '4px 0 0' }}>You’ll reach Dylan, who runs DK Sites. Texting is fastest.</p>
      <div className="contact-list">
        <a className="btn btn--primary btn--block" href={`sms:${PHONE_TEL}`}>Text {PHONE}</a>
        <a className="btn btn--ghost btn--block" href={`tel:${PHONE_TEL}`}>Call {PHONE}</a>
        <a className="btn btn--ghost btn--block" href={`mailto:${EMAIL}?subject=Help%20with%20DK%20Sites%20Builder`}>Email {EMAIL}</a>
      </div>
      <div className="faq">
        {FAQ.map(([q, a]) => (
          <details key={q}><summary>{q}</summary><p>{a}</p></details>
        ))}
      </div>
    </Sheet>
  );
}
