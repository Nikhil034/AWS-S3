import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const emptyForm = { name: '', description: '', price: '' };

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load products.');
      setProducts(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createProduct(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const presignResponse = await fetch(`${API_URL}/api/uploads/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: image.type, size: image.size })
      });
      const presign = await presignResponse.json();
      if (!presignResponse.ok) throw new Error(presign.message || 'Could not prepare image upload.');

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': image.type },
        body: image
      });
      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.text();
        const code = errorBody.match(/<Code>([^<]+)<\/Code>/)?.[1];
        const message = errorBody.match(/<Message>([^<]+)<\/Message>/)?.[1];
        const details = [code, message].filter(Boolean).join(': ');
        throw new Error(
          `S3 image upload failed (${uploadResponse.status})${details ? ` — ${details}` : ''}`
        );
      }

      const productResponse = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price), imageKey: presign.imageKey })
      });
      const product = await productResponse.json();
      if (!productResponse.ok) throw new Error(product.message || 'Could not create product.');

      setForm(emptyForm);
      setImage(null);
      event.target.reset();
      setNotice('Product added to your catalog.');
      await loadProducts();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Fieldnotes home">
          <span className="brand-mark">f.</span>
          <span>fieldnotes</span>
        </a>
        <a className="top-link" href="#add-product">Add a product <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> THE EVERYDAY EDIT</p>
          <h1>Good things,<br /><em>well chosen.</em></h1>
          <p className="hero-description">A considered collection of objects made to be used, loved, and kept close.</p>
          <a className="text-link" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun"></div>
          <div className="arch arch-back"></div>
          <div className="arch arch-front"></div>
          <div className="art-caption">OBJECTS FOR SLOWER DAYS · NO. 01</div>
        </div>
        <div className="hero-index"><span>01</span><span className="index-line"></span><span>03</span></div>
      </section>

      <section className="collection" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION <span className="heading-count">{String(products.length).padStart(2, '0')} ITEMS</span></p>
            <h2>Made for <em>every day.</em></h2>
          </div>
          <span className="sort-label">A few of our favourites <span aria-hidden="true">↘</span></span>
        </div>

        {loading ? (
          <p className="feedback">Gathering the collection…</p>
        ) : error && products.length === 0 ? (
          <p className="feedback error-text">{error}</p>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✳</span>
            <h3>A little room for something lovely.</h3>
            <p>Your collection is waiting for its first find.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className={`product-image image-tone-${index % 4}`}>
                  <img src={product.imageUrl} alt={product.name} />
                  <span className="product-number">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="product-info">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                  </div>
                  <span className="product-price">${Number(product.price).toFixed(2)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
        {error && products.length > 0 && <p className="inline-error">{error}</p>}
      </section>

      <section className="add-section" id="add-product">
        <div className="add-intro">
          <p className="eyebrow">YOUR NEXT GOOD THING</p>
          <h2>Give it a<br /><em>place here.</em></h2>
          <p>Found something worth keeping? Add it to the collection.</p>
          <span className="add-index">F / 2026</span>
        </div>
        <form className="product-form" onSubmit={createProduct}>
          <div className="form-heading">
            <span className="form-step">01 — NEW ARRIVAL</span>
            <h3>Product details</h3>
          </div>
          <label>
            <span>Product name</span>
            <input name="name" value={form.name} onChange={updateField} maxLength="120" placeholder="e.g. Sunday ceramic mug" required />
          </label>
          <label>
            <span>A little about it</span>
            <textarea name="description" value={form.description} onChange={updateField} maxLength="2000" rows="3" placeholder="What makes this one special?" required />
          </label>
          <label>
            <span>Price <small>USD</small></span>
            <div className="price-input"><span>$</span><input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} placeholder="0.00" required /></div>
          </label>
          <label className="upload-label">
            <span>Product image</span>
            <input className="file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} required />
            <span className="upload-box">
              <span className="upload-icon">＋</span>
              <span>{image ? image.name : 'Choose an image'}<small>JPEG, PNG, WebP or GIF · up to 10 MB</small></span>
              <span className="upload-arrow">↗</span>
            </span>
          </label>
          {error && <p className="form-message error-text" role="alert">{error}</p>}
          {notice && <p className="form-message success-text" role="status">{notice}</p>}
          <button className="submit-button" type="submit" disabled={submitting || !image}>
            <span>{submitting ? 'Adding to collection…' : 'Add to the collection'}</span>
            <span aria-hidden="true">{submitting ? '…' : '↗'}</span>
          </button>
          <p className="form-note">Your image is uploaded securely to our private image library.</p>
        </form>
      </section>

      <footer className="footer">
        <a className="wordmark" href="#top"><span className="brand-mark">f.</span><span>fieldnotes</span></a>
        <span>GOOD THINGS, KEPT CLOSE.</span>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}

export default App;
