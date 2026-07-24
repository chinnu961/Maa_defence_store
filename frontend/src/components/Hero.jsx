export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-banner-bg" style={{ backgroundImage: "url('/assets/hero_banner.png')" }}></div>
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fa-solid fa-medal"></i> Authorized Military & NCC Tailors
          </div>
          <h1 className="hero-title">
            Honor in Every <span>Stitch</span>
            <br />
            <em>Tactical Gear</em>
          </h1>
          <p className="hero-desc">
            Crafting premium uniforms, precision rank badges, and rugged tactical equipment for Indian
            Army officers, personnel, and NCC Cadets. Built to strict institutional standards, designed
            for the modern warrior.
          </p>
          <div className="hero-btns">
            <a href="#shop" className="btn btn-primary">
              <i className="fa-solid fa-bag-shopping" style={{ marginRight: 8 }}></i> View Products
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <h3>15+</h3>
              <p>Years of Service</p>
            </div>
            <div className="stat-item">
              <h3>25K+</h3>
              <p>Cadets Fitted</p>
            </div>
            <div className="stat-item">
              <h3>100%</h3>
              <p>Spec Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
