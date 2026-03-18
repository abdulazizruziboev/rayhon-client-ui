import React, { useState, useMemo } from 'react';
import foods from './foods.json';

export default function App() {
  const [selected, setSelected] = useState('Barchasi');
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['Barchasi', ...Array.from(new Set(foods.map(f => f.kategoriya)))], []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return foods
      .filter(f => selected === 'Barchasi' || f.kategoriya === selected)
      .filter(f => ((f.nomi || '') + (f.kategoriya || '')).toLowerCase().startsWith(q));
  }, [selected, query]);

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-primary">Rayhon Oshxonasi Menyusi</h1>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white rounded-full px-4 py-2 border-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Taom nomi bo'yicha qidirish..."
              className="w-full outline-none text-sm bg-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-4 py-1 rounded-full text-sm transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
                  selected === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-primary border border-primary/20 hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d, i) => (
            <article key={d.id ?? i} className="bg-white rounded-2xl shadow-[0px_0px_1.5px_rgba(0,0,0,0.400)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">{d.nomi}</h3>
                  {d.tavsif && <p className="text-sm text-gray-500 mt-2 line-clamp-3">{d.tavsif}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    {d.mavjudligi ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border-1 border-gray-100 ">Mavjud</span>
                    ) : (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border-1 border-gray-100 ">Mavjud emas</span>
                    )}
                    <span className="text-xs bg-gray-50 border-1 border-gray-100 text-gray-700 px-2 py-0.5 rounded">{d.kategoriya}</span>
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

          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-16">
              Hech narsa topilmadi. Qidiruvni yoki kategoriyani o'zgartiring.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}