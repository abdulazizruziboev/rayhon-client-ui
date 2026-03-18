import React, { useState, useMemo } from 'react';
import foods from './foods.json';

// ...existing code...
export default function App() {
  const [selected, setSelected] = useState('Barchasi');
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['Barchasi', ...Array.from(new Set(foods.map(f => f.kategoriya)))], []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return foods
      .filter(f => selected === 'Barchasi' || f.kategoriya === selected)
      .filter(f => ((f.nomi || '') + (f.kategoriya || '')).toLowerCase().includes(q));
  }, [selected, query]);

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-rose-700">Rayhon Oshxonasi Menyusi</h1>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white rounded-full shadow-sm px-4 py-2 ">
            <svg className="w-5 h-5 opacity-[50%]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Taom nomi yoki tavsif bo'yicha qidirish..."
              className="w-full outline-none text-sm bg-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-4 py-1 rounded-full text-sm transition-colors cursor-pointer ${
                  selected === cat
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-red-600 border border-red-100 hover:bg-red-50'
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
            <article key={d.id ?? i} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-rose-700">{d.nomi}</h3>
                  {d.tavsif && <p className="text-sm text-gray-500 mt-2 line-clamp-3">{d.tavsif}</p>}
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
                  <div className="text-rose-600 font-bold text-lg">
                    {(d.narxi ?? '—').toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} UZS
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
// ...existing code...