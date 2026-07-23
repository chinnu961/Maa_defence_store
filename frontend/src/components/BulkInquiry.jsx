import { useState } from 'react';
import Reveal from './Reveal.jsx';
import { useToast } from '../context/ToastContext.jsx';

const FEATURES = [
  {
    icon: 'fa-truck-moving',
    title: 'Direct Unit Delivery',
    desc: 'Bulk shipments directly to your school, college, or regimental stores.'
  },
  {
    icon: 'fa-percent',
    title: 'Institutional Discounts',
    desc: 'Special subsidized pricing structures for authorized educational institutions.'
  },
  {
    icon: 'fa-pencil-ruler',
    title: 'Custom Unit Name Engraving',
    desc: 'Batch orders of uniform brass rank tabs and nameplates tailored per list.'
  }
];

export default function BulkInquiry() {
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'info');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      showToast('Bulk inquiry request sent! Our tailoring lead will contact you.', 'success');
      setSubmitting(false);
      setPhone('');
      e.target.reset();
    }, 1500);
  };

  return (
    <section className="section" id="bulk-inquiry" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div className="inquiry-grid">
          <Reveal className="inquiry-details">
            <div className="hero-badge" style={{ marginBottom: '1rem' }}>
              <i className="fa-solid fa-building-shield"></i> Unit Orders
            </div>
            <h3>Bulk Tailoring & Battalion Supplies</h3>
            <p>
              We supply entire school/college NCC battalions, cadet corps, and army regiments. From
              specialized custom group size measurements to bulk manufacturing of brass crest badges,
              peak caps, lanyards, and hackles.
            </p>

            <div className="inquiry-features">
              {FEATURES.map((f) => (
                <div className="inquiry-feature-item" key={f.title}>
                  <div className="inquiry-feature-icon">
                    <i className={`fa-solid ${f.icon}`}></i>
                  </div>
                  <div className="inquiry-feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="inquiry-form-panel glass-panel">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Submit Unit Inquiry</h3>
            <form id="bulkInquiryForm" onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input-text" required placeholder="E.g. Capt. Amit Dev" />
                </div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Contact Number</label>
                  <input
                    type="tel"
                    id="bulkContactPhone"
                    className="form-input-text"
                    required
                    placeholder="E.g. 9876543210"
                    value={phone}
                    onChange={handlePhoneChange}
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit mobile number"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input-text" required placeholder="E.g. unit.commander@gmail.com" />
                </div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Institution / Regiment</label>
                  <input type="text" className="form-input-text" required placeholder="E.g. 2nd Kar Bn NCC, Bangalore" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Product Requirements & Quantity</label>
                <textarea
                  className="form-input-textarea"
                  required
                  placeholder="Describe what you need (e.g. 150 pairs of NCC Cadet boots, 150 standard berets with hackles, size distribution etc.)"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Sending Request...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane" style={{ marginRight: 8 }}></i> Submit Inquiry Request
                  </>
                )}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
