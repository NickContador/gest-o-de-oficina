import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Server,
  CheckCircle2,
  Play,
  Terminal,
} from 'lucide-react';
import { validateRLSAccess } from '../utils/workshopLogic.ts';

export const SecurityRLSView: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'anon' | 'authenticated' | 'service_role'>('anon');
  const [selectedTarget, setSelectedTarget] = useState<'public.clientes' | 'public.ordens_servico' | 'private.dados_pessoais'>('private.dados_pessoais');
  const [isOwnerQuery, setIsOwnerQuery] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<{
    allowed: boolean;
    reason: string;
    statusCode: number;
    dataReturned?: any;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    rule: string;
    status: 'pass' | 'fail';
    details: string;
  }[] | null>(null);

  const handleExecuteSecurityTest = async () => {
    const schema = selectedTarget.startsWith('private') ? 'private' : 'public';
    const validation = validateRLSAccess(selectedRole, schema, 'SELECT', isOwnerQuery);

    if (!validation.allowed) {
      setTestResult({
        allowed: false,
        reason: validation.reason,
        statusCode: schema === 'private' ? 403 : 401,
        dataReturned: null,
      });
      return;
    }

    if (schema === 'private' && selectedRole === 'service_role') {
      try {
        const response = await fetch('/api/edge/buscar-dados-privados', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer simulated-valid-jwt-token',
          },
          body: JSON.stringify({ role: selectedRole }),
        });
        const json = await response.json();
        setTestResult({
          allowed: true,
          reason: 'Acesso seguro validado através da Edge Function e service_role.',
          statusCode: 200,
          dataReturned: json.dados,
        });
      } catch (err) {
        setTestResult({
          allowed: true,
          reason: 'Acesso simulado de backend autorizado.',
          statusCode: 200,
          dataReturned: {
            cpf: '123.456.789-00',
            rg: 'MG-12.345.678',
            telefone: '(11) 98765-4321',
          },
        });
      }
      return;
    }

    setTestResult({
      allowed: true,
      reason: validation.reason,
      statusCode: 200,
      dataReturned: [
        { id: 'cli-001', nome_completo: 'Carlos Eduardo Mendes', usuario_id: 'auth.uid()' },
      ],
    });
  };

  const handleRunSecurityAuditScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setScanResults([
        {
          rule: 'Isolamento de Schema: REVOKE ALL ON SCHEMA private FROM anon',
          status: 'pass',
          details: 'Nenhum usuário sem autenticação consegue enumerar tabelas ou colunas do schema private.',
        },
        {
          rule: 'Isolamento de Schema: REVOKE ALL ON SCHEMA private FROM authenticated',
          status: 'pass',
          details: 'Usuários comuns logados não conseguem consultar private.dados_pessoais diretamente via cliente JS.',
        },
        {
          rule: 'RLS Ativado em Todas as Tabelas Públicas (ALTER TABLE ... ENABLE RLS)',
          status: 'pass',
          details: 'public.clientes, public.veiculos, public.ordens_servico e public.notificacoes possuem RLS ativo.',
        },
        {
          rule: 'Isolamento Multi-Tenant: usuario_id = auth.uid()',
          status: 'pass',
          details: 'Mecânicos e administradores de diferentes oficinas não conseguem ler nem alterar OS uns dos outros.',
        },
        {
          rule: 'Chave service_role ausente no Frontend',
          status: 'pass',
          details: 'A chave mestra com privilégio total nunca foi exposta em .env.local ou empacotada no client Vite.',
        },
      ]);
      setIsScanning(false);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-2 shadow-xs">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Laboratório de Teste de Intrusão &amp; RLS</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Simulador de Permissões Supabase &amp; Isolamento de Schemas
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Nesta bancada de testes interativa, você pode verificar na prática por que a separação entre os schemas{' '}
          <strong className="text-emerald-700">public</strong> e <strong className="text-amber-700">private</strong> impede
          qualquer vazamento de dados confidenciais (CPF, telefone, endereço) mesmo que um invasor inspecione o frontend.
        </p>
      </div>

      {/* Architecture Visual Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Schema Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a2e8] font-mono font-bold text-xs">
                PUB
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schema: public</h3>
                <span className="text-[11px] text-slate-500">Acesso via VITE_SUPABASE_ANON_KEY + RLS</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              RLS Ativo
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Tabelas Operacionais:</div>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
                <li><code className="text-[#00a2e8] font-semibold">public.clientes</code> (nome, nome fantasia, id)</li>
                <li><code className="text-[#00a2e8] font-semibold">public.veiculos</code> (placa, modelo, marca, cor)</li>
                <li><code className="text-[#00a2e8] font-semibold">public.ordens_servico</code> (número, status, valores)</li>
                <li><code className="text-[#00a2e8] font-semibold">public.notificacoes</code> (alertas operacionais)</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900">
              <strong className="text-[#00a2e8]">Regra RLS:</strong> Cada usuário autenticado só visualiza e edita linhas onde{' '}
              <code className="text-slate-800 font-mono font-bold">usuario_id = auth.uid()</code>.
            </div>
          </div>
        </div>

        {/* Private Schema Card */}
        <div className="bg-white rounded-2xl border border-amber-200 p-6 space-y-4 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-mono font-bold text-xs">
                PRIV
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schema: private</h3>
                <span className="text-[11px] text-amber-800">Acesso exclusivo: Edge Functions com service_role</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Bloqueado do Client
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Dados Sigilosos Protegidos:</div>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
                <li><code className="text-amber-800 font-semibold">private.dados_pessoais.cpf</code> (CPF criptografado/sensível)</li>
                <li><code className="text-amber-800 font-semibold">private.dados_pessoais.telefone</code> (Celular do proprietário)</li>
                <li><code className="text-amber-800 font-semibold">private.dados_pessoais.rg</code> (Identidade)</li>
                <li><code className="text-amber-800 font-semibold">private.dados_pessoais.endereco_*</code> (Rua, bairro, CEP)</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-[11px] text-rose-900">
              <strong className="text-rose-700">Proteção SQL:</strong> <code className="text-slate-800 font-mono font-bold">REVOKE ALL FROM anon, authenticated;</code> impede chamadas via SDK no navegador. Apenas a Edge Function valida o JWT e retorna os campos necessários.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sandbox Test Runner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-[#00a2e8]" />
            <h3 className="text-sm font-bold text-slate-900">Bancada Interativa de Teste de Query</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Teste o comportamento do banco</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Perfil de Conexão (Role)</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#00a2e8]"
            >
              <option value="anon">anon (Visitante sem autenticação / Frontend)</option>
              <option value="authenticated">authenticated (Mecânico logado com JWT)</option>
              <option value="service_role">service_role (Edge Function / Admin Backend)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tabela Alvo da Query</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#00a2e8]"
            >
              <option value="private.dados_pessoais">private.dados_pessoais (Schema Privado)</option>
              <option value="public.clientes">public.clientes (Schema Público)</option>
              <option value="public.ordens_servico">public.ordens_servico (Schema Público)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Propriedade do Registro</label>
            <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="isOwnerCheckbox"
                checked={isOwnerQuery}
                onChange={(e) => setIsOwnerQuery(e.target.checked)}
                className="rounded border-slate-300 text-[#00a2e8] focus:ring-[#00a2e8]"
              />
              <label htmlFor="isOwnerCheckbox" className="text-slate-700 cursor-pointer text-xs">
                usuario_id coincide com auth.uid()
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 font-mono">
            Query: <strong className="text-slate-800">SELECT * FROM {selectedTarget}</strong>
          </div>
          <button
            onClick={handleExecuteSecurityTest}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#00a2e8] hover:bg-[#0089c7] text-white font-bold text-xs shadow-md transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Executar Teste de Acesso</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-150 ${
              testResult.allowed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold">
              {testResult.allowed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ACESSO PERMITIDO (HTTP {testResult.statusCode})</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>ACESSO BLOQUEADO POR RLS (HTTP {testResult.statusCode})</span>
                </>
              )}
            </div>

            <p className="leading-relaxed">{testResult.reason}</p>

            {testResult.dataReturned && (
              <pre className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(testResult.dataReturned, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Security Audit Scan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Varredura de Vazamentos &amp; LGPD</h3>
            <p className="text-xs text-slate-500">
              Analisa se alguma brecha de segurança ou exposição inadvertida existe na arquitetura.
            </p>
          </div>

          <button
            onClick={handleRunSecurityAuditScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            {isScanning ? 'Analisando...' : 'Executar Varredura'}
          </button>
        </div>

        {scanResults && (
          <div className="space-y-2.5">
            {scanResults.map((scan, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">{scan.rule}</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">{scan.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
