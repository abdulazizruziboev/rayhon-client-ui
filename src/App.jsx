import React, { useState, useMemo } from 'react';
import foods from './foods.json';

export default function App() {
  const [selected, setSelected] = useState('Barchasi');
  const [query, setQuery] = useState('');
  const categories = useMemo(
    () => ['Barchasi', ...Array.from(new Set(foods.map(f => f.kategoriya)))],
    []
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return foods
      .filter(f => selected === 'Barchasi' || f.kategoriya === selected)
      .filter(f =>
        (
          (f.nomi || '') +
          ' ' +
          (f.tavsif || '') +
          ' ' +
          (f.kategoriya || '')
        ).toLowerCase().includes(q)
      );
  }, [selected, query]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 p-4 md:p-8 font-sans">
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar (chat-like category list) */}
        <aside className="bg-white rounded-xl shadow-sm p-3 sticky top-6 h-[calc(100vh-3rem)] overflow-auto">
          <div className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qidirish..."
              className="w-full px-3 py-2 rounded-lg border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <nav className="flex flex-col gap-1">
            {categories.map(cat => {
              const count = foods.filter(f => f.kategoriya === cat).length;
              const isActive = selected === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelected(cat)}
                  className={`text-left flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-primary border border-primary/10 hover:bg-primary/5'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                    {cat === 'Barchasi' ? foods.length : count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content: cards for selected category */}
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-semibold text-primary">
              {selected === 'Barchasi' ? "Barcha taomlar" : selected}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} ta natija
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d, i) => (
              <article
                key={d.id ?? i}
                className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-colors"
                aria-label={d.nomi}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-primary">{d.nomi}</h3>
                    {d.tarkibi && <p className="text-sm text-gray-500 mt-2 line-clamp-3">{d.tarkibi}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      {d.mavjudligi ? (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Mavjud</span>
                      ) : (
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">Mavjud emas</span>
                      )}
                      <span className="text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded">{d.kategoriya}</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end justify-center">
                    <div className="text-primary font-bold text-lg">
                      {(d.narxi ?? '—').toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center text-gray-500 py-12 rounded-lg bg-white shadow-sm">
              Hech narsa topilmadi. Kategoriyani yoki qidiruvni o'zgartiring.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}