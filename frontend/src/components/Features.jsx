import Reveal from './Reveal.jsx';

const FEATURES = [
  {
    icon: 'fa-scroll',
    title: 'Strict Specification',
    desc: 'Every lanyard, hackle, beret, and stitch matches the exact guidelines laid out by DG-NCC and Indian Army regulation manuals.'
  },
  {
    icon: 'fa-scissors',
    title: 'Custom Tailoring',
    desc: 'Submit your measurements online or visit our shop. We offer tailored fittings ensuring military smartness and parade-ready look.'
  },
  {
    icon: 'fa-shield-halved',
    title: 'Tactical Durability',
    desc: 'Our heavy-duty canvas, brass buckles, high-gloss DMS boots, and water-resistant nylon backpacks endure extreme parade or camp conditions.'
  }
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <Reveal className="section-title-wrap">
          <h2 className="section-title">Institutional Excellence</h2>
          <p className="section-subtitle">
            Why active defense personnel and school/college cadets choose Valor Tactical for their
            uniform and gear needs.
          </p>
        </Reveal>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <Reveal className="feature-card glass-panel" key={f.title}>
              <div className="feature-icon">
                <i className={`fa-solid ${f.icon}`}></i>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
