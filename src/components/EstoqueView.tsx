import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Tag,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { PecaEstoque, INITIAL_ESTOQUE } from '../data/mockData.ts';
import { formatCurrencyBRL } from '../utils/workshopLogic.ts';

export const EstoqueView: React.FC = () => {
  const [estoque, setEstoque] = useState<PecaEstoque[]>(INITIAL_ESTOQUE);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Part Form
  const [newCodigo, setNewCodigo] = useState('');
  const [newDescricao, setNewDescricao] = useState('');
  const [newCategoria, setNewCategoria] = useState<PecaEstoque['categoria']>('oleos');
  const [newQtd, setNewQtd] = useState(10);
  const [newQtdMin, setNewQtdMin] = useState(4);
  const [newPrecoCusto, setNewPrecoCusto] = useState(30);
  const [newPrecoVenda, setNewPrecoVenda] = useState(55);
  const [newFornecedor, setNewFornecedor] = useState('');
  const [newLocal, setNewLocal] = useState('');

  const filteredItems = estoque.filter((p) => {
    const matchesCat = categoryFilter === 'todos' || p.categoria === categoryFilter;
    const matchesSearch =
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalItemsCount = estoque.reduce((acc, curr) => acc + curr.quantidade, 0);
  const totalStockValueCost = estoque.reduce((acc, curr) => acc + curr.preco_custo * curr.quantidade, 0);
  const totalStockValueSale = estoque.reduce((acc, curr) => acc + curr.preco_venda * curr.quantidade, 0);
  const lowStockCount = estoque.filter((p) => p.quantidade <= p.estoque_minimo).length;

  const handleAdjustQuantity = (id: string, delta: number) => {
    setEstoque((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item
      )
    );
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodigo || !newDescricao) return;

    const newItem: PecaEstoque = {
      id: `peca-${Date.now()}`,
      codigo: newCodigo.toUpperCase(),
      descricao: newDescricao,
      categoria: newCategoria,
      quantidade: newQtd,
      estoque_minimo: newQtdMin,
      preco_custo: newPrecoCusto,
      preco_venda: newPrecoVenda,
      fornecedor: newFornecedor || 'Fornecedor Local',
      localizacao: newLocal || 'Prateleira Geral',
    };

    setEstoque((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNewCodigo('');
    setNewDescricao('');
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Itens em Estoque</span>
            <Package className="w-4 h-4 text-[#00a2e8]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {totalItemsCount} <span className="text-xs text-slate-400 font-normal">unidades</span>
          </div>
          <span className="text-[11px] text-[#00a2e8] font-medium">{estoque.length} produtos cadastrados</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Patrimônio a Preço de Custo</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {formatCurrencyBRL(totalStockValueCost)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Capital imobilizado</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Potencial de Venda</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
            {formatCurrencyBRL(totalStockValueSale)}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            Margem bruta: {Math.round(((totalStockValueSale - totalStockValueCost) / totalStockValueSale) * 100)}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Abaixo do Mínimo</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">
            {lowStockCount}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Reposição necessária</span>
        </div>
      </div>

      {/* Action and Filter Ribbon */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por código, descrição ou fornecedor..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00a2e8] focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Categoria:</span>
          {['todos', 'oleos', 'freios', 'filtros', 'motor', 'suspensao', 'eletrica'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'todos' ? 'Todas' : cat}
            </button>
          ))}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#00a2e8] hover:bg-[#008ecb] text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap flex items-center space-x-1 ml-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Cadastrar Peça</span>
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Descrição da Peça / Produto</th>
                <th className="py-3 px-4">Local</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4 text-right">Preço de Custo</th>
                <th className="py-3 px-4 text-right">Preço de Venda</th>
                <th className="py-3 px-4 text-right">Margem</th>
                <th className="py-3 px-4 text-center">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhuma peça encontrada no estoque.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantidade <= item.estoque_minimo;
                  const marginPercent = Math.round(
                    ((item.preco_venda - item.preco_custo) / item.preco_venda) * 100
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {item.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.descricao}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <span>Fornecedor: {item.fornecedor}</span>
                          <span>·</span>
                          <span className="capitalize">{item.categoria}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {item.localizacao}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded font-mono font-bold text-xs ${
                            isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-600 inline mr-1" />}
                          <span className="tabular-nums">{item.quantidade} un</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                        {formatCurrencyBRL(item.preco_custo)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrencyBRL(item.preco_venda)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 tabular-nums">
                        {marginPercent}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => handleAdjustQuantity(item.id, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300"
                            title="Dar baixa em 1 unidade"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjustQuantity(item.id, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300"
                            title="Adicionar 1 unidade"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastrar Nova Peça */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#00a2e8]" />
                <h3 className="text-base font-bold text-slate-900">Cadastrar Nova Peça no Estoque</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Código da Peça *</label>
                  <input
                    type="text"
                    required
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    placeholder="Ex: FL-5949"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Categoria *</label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="oleos">Óleos &amp; Lubrificantes</option>
                    <option value="freios">Freios &amp; Pastilhas</option>
                    <option value="filtros">Filtros Diversos</option>
                    <option value="motor">Motor &amp; Correias</option>
                    <option value="suspensao">Suspensão &amp; Amortecedores</option>
                    <option value="eletrica">Elétrica &amp; Baterias</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição do Item *</label>
                <input
                  type="text"
                  required
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  placeholder="Ex: Jogo de Pastilhas de Freio Dianteiro Bosch"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Preço de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrecoCusto}
                    onChange={(e) => setNewPrecoCusto(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrecoVenda}
                    onChange={(e) => setNewPrecoVenda(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-[#00a2e8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Qtd Inicial *</label>
                  <input
                    type="number"
                    required
                    value={newQtd}
                    onChange={(e) => setNewQtd(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estoque Mínimo *</label>
                  <input
                    type="number"
                    required
                    value={newQtdMin}
                    onChange={(e) => setNewQtdMin(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={newFornecedor}
                    onChange={(e) => setNewFornecedor(e.target.value)}
                    placeholder="Distribuidora SP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Localização</label>
                  <input
                    type="text"
                    value={newLocal}
                    onChange={(e) => setNewLocal(e.target.value)}
                    placeholder="Prateleira A1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00a2e8] hover:bg-[#008ecb] text-white font-bold"
                >
                  Salvar Peça no Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
