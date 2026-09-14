"use client";

import { useState } from "react";
import type { FaqItem, ProductConfig } from "@/lib/config/types";

interface ProductsEditorProps {
  initialProducts: ProductConfig[];
}

function linesToText(items: string[]): string {
  return items.join("\n");
}

function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function ProductsEditor({ initialProducts }: ProductsEditorProps) {
  const [products, setProducts] = useState<ProductConfig[]>(initialProducts);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateProduct(index: number, patch: Partial<ProductConfig>) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function updateFaq(productIndex: number, faqIndex: number, patch: Partial<FaqItem>) {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIndex ? { ...p, faq: p.faq.map((f, j) => (j === faqIndex ? { ...f, ...patch } : f)) } : p,
      ),
    );
  }

  function addFaq(productIndex: number) {
    setProducts((prev) =>
      prev.map((p, i) => (i === productIndex ? { ...p, faq: [...p.faq, { question: "", answer: "" }] } : p)),
    );
  }

  function removeFaq(productIndex: number, faqIndex: number) {
    setProducts((prev) =>
      prev.map((p, i) => (i === productIndex ? { ...p, faq: p.faq.filter((_, j) => j !== faqIndex) } : p)),
    );
  }

  function addProduct() {
    setProducts((prev) => [
      ...prev,
      {
        key: `PRODUTO_${prev.length + 1}` as ProductConfig["key"],
        displayName: "Novo produto",
        category: "acabamento_decoracao",
        shortDescription: "",
        useCases: [],
        benefits: [],
        neverSay: [],
        faq: [],
      },
    ]);
  }

  function removeProduct(index: number) {
    if (!confirm("Remover este produto da base de conhecimento?")) return;
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("value", JSON.stringify(products));
      const res = await fetch("/api/admin/config/PRODUCTS", { method: "POST", body: form });
      if (!res.ok) throw new Error("Falha ao salvar");
      window.location.href = "/admin/settings?saved=PRODUCTS";
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Produtos (molduras / painel monolítico)</h2>
          <p className="text-xs text-slate-400">Um item por linha nos campos de lista. As perguntas frequentes alimentam a IA diretamente.</p>
        </div>
        <button
          type="button"
          onClick={addProduct}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          + Adicionar produto
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {products.map((product, pi) => (
          <div key={pi} className="rounded-md border border-slate-200 p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex flex-col text-sm">
                  <span className="mb-1 text-slate-500">Nome exibido</span>
                  <input
                    className="select"
                    value={product.displayName}
                    onChange={(e) => updateProduct(pi, { displayName: e.target.value })}
                  />
                </label>
                <label className="flex flex-col text-sm">
                  <span className="mb-1 text-slate-500">Categoria</span>
                  <select
                    className="select"
                    value={product.category}
                    onChange={(e) => updateProduct(pi, { category: e.target.value as ProductConfig["category"] })}
                  >
                    <option value="acabamento_decoracao">Acabamento/decoração</option>
                    <option value="solucao_construtiva">Solução construtiva</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeProduct(pi)}
                className="mt-6 shrink-0 text-xs text-red-500 hover:underline"
              >
                Remover
              </button>
            </div>

            <label className="mb-2 flex flex-col text-sm">
              <span className="mb-1 text-slate-500">Descrição curta</span>
              <textarea
                className="select"
                rows={2}
                value={product.shortDescription}
                onChange={(e) => updateProduct(pi, { shortDescription: e.target.value })}
              />
            </label>

            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-slate-500">Aplicações (uma por linha)</span>
                <textarea
                  className="select"
                  rows={4}
                  value={linesToText(product.useCases)}
                  onChange={(e) => updateProduct(pi, { useCases: textToLines(e.target.value) })}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-slate-500">Benefícios (um por linha)</span>
                <textarea
                  className="select"
                  rows={4}
                  value={linesToText(product.benefits)}
                  onChange={(e) => updateProduct(pi, { benefits: textToLines(e.target.value) })}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-slate-500">Nunca afirmar (um por linha)</span>
                <textarea
                  className="select"
                  rows={4}
                  value={linesToText(product.neverSay)}
                  onChange={(e) => updateProduct(pi, { neverSay: textToLines(e.target.value) })}
                />
              </label>
            </div>

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-slate-400">Perguntas frequentes</span>
                <button type="button" onClick={() => addFaq(pi)} className="text-xs text-brand-600 hover:underline">
                  + Adicionar pergunta
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {product.faq.map((faq, fi) => (
                  <div key={fi} className="rounded border border-slate-100 bg-slate-50 p-2">
                    <div className="mb-1 flex items-center gap-2">
                      <input
                        className="select flex-1"
                        placeholder="Pergunta"
                        value={faq.question}
                        onChange={(e) => updateFaq(pi, fi, { question: e.target.value })}
                      />
                      <button type="button" onClick={() => removeFaq(pi, fi)} className="text-xs text-red-500 hover:underline">
                        Remover
                      </button>
                    </div>
                    <textarea
                      className="select"
                      rows={2}
                      placeholder="Resposta"
                      value={faq.answer}
                      onChange={(e) => updateFaq(pi, fi, { answer: e.target.value })}
                    />
                  </div>
                ))}
                {product.faq.length === 0 && <p className="text-xs text-slate-400">Nenhuma pergunta cadastrada ainda.</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Salvando..." : "Salvar produtos"}
      </button>
    </div>
  );
}
