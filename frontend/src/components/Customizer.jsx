import { useMemo, useState } from 'react';
import Reveal from './Reveal.jsx';
import { DIVISIONS } from '../data/divisions.js';
import { RANKS } from '../data/ranks.js';
import { ACCESSORIES } from '../data/accessories.js';
import { useCart } from '../context/CartContext.jsx';

const DIVISION_IMAGE = {
  army: '/assets/military_uniform.png',
  ncc: '/assets/ncc_uniform.png',
  airforce: '/assets/airforce_uniform.png',
  navy: '/assets/navy_uniform.png',
  scouts: '/assets/ncc_uniform.png',
  police: '/assets/military_uniform.png',
  security: '/assets/military_uniform.png'
};

function cloneAccessories(divisionId) {
  return ACCESSORIES[divisionId].map((acc) => ({ ...acc }));
}

export default function Customizer() {
  const { addCustomPackage } = useCart();

  const [division, setDivision] = useState('army');
  const divisionMeta = useMemo(() => DIVISIONS.find((d) => d.id === division), [division]);

  const [nameplateInput, setNameplateInput] = useState('');
  const nameplateText = nameplateInput.trim().toUpperCase() || divisionMeta.defaultNameplate;

  const [selectedRankId, setSelectedRankId] = useState(RANKS[division][0].id);
  const [accessories, setAccessories] = useState(() => cloneAccessories('army'));

  const rankList = RANKS[division];
  const selectedRank = rankList.find((r) => r.id === selectedRankId) || rankList[0];

  const handleSelectDivision = (id) => {
    const meta = DIVISIONS.find((d) => d.id === id);
    setDivision(id);
    setNameplateInput('');
    setSelectedRankId(RANKS[id][0].id);
    setAccessories(cloneAccessories(id));
  };

  const toggleAccessory = (index) => {
    setAccessories((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, selected: !acc.selected } : acc))
    );
  };

  const total = useMemo(() => {
    const accessoriesPrice = accessories
      .filter((acc) => acc.selected)
      .reduce((sum, acc) => sum + acc.price, 0);
    return divisionMeta.basePrice + selectedRank.price + accessoriesPrice;
  }, [accessories, divisionMeta, selectedRank]);

  const handleAddToCart = () => {
    const activeAccessories = accessories.filter((acc) => acc.selected).map((acc) => acc.name);
    const details = `Rank: ${selectedRank.name} | Nameplate: "${nameplateText}" | Items: ${activeAccessories.join(', ')}`;

    addCustomPackage({
      division,
      name: `${divisionMeta.tabLabel} Tailored Uniform Kit`,
      price: total,
      image: DIVISION_IMAGE[division],
      details
    });
  };

  return (
    <section className="section" id="customizer" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <Reveal className="section-title-wrap">
          <h2 className="section-title">Uniform Builder</h2>
          <p className="section-subtitle">
            Select your branch, rank, and accessories to build a complete custom package with
            tailored nameplates.
          </p>
        </Reveal>

        <div className="customizer-layout">
          {/* Visualizer Panel */}
          <Reveal className="customizer-preview-panel glass-panel">
            <div className="uniform-visualizer">
              <div className={`uniform-badge-preview ${divisionMeta.badgeClass}`} id="badgePreview">
                <div className="custom-rank-insignia" id="previewRankInsignia">
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-gold)' }}>
                    {selectedRank.insignia}
                  </div>
                </div>
                <div className="custom-nameplate" id="previewNameplate">{nameplateText}</div>
                <div className="custom-wing-label" id="previewWingLabel">{divisionMeta.wingLabel}</div>
              </div>
            </div>

            <div className="preview-details">
              <h3 className="preview-title" id="previewTitle">{divisionMeta.title}</h3>
              <p className="preview-subtitle" id="previewSubtitleText">Rank: {selectedRank.name}</p>

              <div className="preview-checklist" id="previewChecklist">
                <div className="checklist-item">
                  <i className="fa-solid fa-circle-check"></i> Standard Tunic/Trousers Fabic
                </div>
                <div className="checklist-item">
                  <i className="fa-solid fa-circle-check"></i> Engraved Nameplate (&quot;{nameplateText}&quot;)
                </div>
                <div className="checklist-item">
                  <i className="fa-solid fa-circle-check"></i> Insignia Rank: {selectedRank.name}
                </div>
                {accessories
                  .filter((acc) => acc.selected)
                  .map((acc) => (
                    <div className="checklist-item" key={acc.id}>
                      <i className="fa-solid fa-circle-check"></i> {acc.name} included
                    </div>
                  ))}
              </div>
            </div>
          </Reveal>

          {/* Options Control Panel */}
          <Reveal className="customizer-options-panel" style={{ padding: 0 }}>
            <div className="form-group">
              <label className="form-label">Select Division</label>
              <div className="customizer-tabs">
                {DIVISIONS.map((d) => (
                  <button
                    key={d.id}
                    className={`customizer-tab-btn${division === d.id ? ' active' : ''}`}
                    onClick={() => handleSelectDivision(d.id)}
                  >
                    {d.tabLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nameplateInput">
                Nameplate Engraving <span>(Capital letters)</span>
              </label>
              <input
                type="text"
                id="nameplateInput"
                className="form-input-text"
                maxLength={15}
                placeholder={`E.G. R. K. SHARMA`}
                value={nameplateInput}
                onChange={(e) => setNameplateInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Rank / Insignia</label>
              <div id="rankGrid" className="rank-selector-grid">
                {rankList.map((rank) => (
                  <div
                    key={rank.id}
                    className={`rank-card${rank.id === selectedRankId ? ' active' : ''}`}
                    onClick={() => setSelectedRankId(rank.id)}
                  >
                    <div className="rank-card-insignia">{rank.insignia}</div>
                    <div className="rank-card-title">{rank.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: 5 }}>
                      +₹{rank.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Add Accessories to Package</label>
              <div className="accessory-checklist" id="accessoryChecklist">
                {accessories.map((acc, index) => (
                  <div
                    key={acc.id}
                    className={`accessory-option${acc.selected ? ' active' : ''}`}
                    onClick={() => toggleAccessory(index)}
                  >
                    <div className="accessory-option-details">
                      <div className="checkbox-custom">
                        <i className="fa-solid fa-check"></i>
                      </div>
                      <span>{acc.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      ₹{acc.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="customizer-price-summary"
              style={{
                marginTop: '3rem',
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="summary-price-label">Customized Package Price</div>
                <div className="summary-price-value" id="customizerTotalPrice" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)' }}>
                  ₹{total.toLocaleString()}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
              >
                <i className="fa-solid fa-cart-plus" style={{ marginRight: 8 }}></i> Add Tailored Kit to Cart
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
