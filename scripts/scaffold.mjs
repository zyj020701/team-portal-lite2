#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve(process.cwd());
function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}
function write(f, c) {
  ensureDir(join(f, '..'));
  writeFileSync(f, c, 'utf8');
}
function wj(f, o) {
  write(f, JSON.stringify(o, null, 2) + '\n');
}

// Root tsconfig.base.json
wj(join(root, 'tsconfig.base.json'), {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    jsx: 'react-jsx',
    strict: true,
    noImplicitAny: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
  },
  exclude: ['node_modules', 'dist'],
});

// .npmrc
write(join(root, '.npmrc'), 'shamefully-hoist=false\nstrict-peer-dependencies=false\n');

function makePkg(name, deps, isReact) {
  const p = {
    name: '@team-portal/' + name,
    version: '0.1.0',
    private: true,
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
    scripts: {
      build: 'tsc -p tsconfig.json',
      dev: 'tsc -p tsconfig.json --watch',
      lint: 'eslint src/',
      typecheck: 'tsc --noEmit',
      clean: 'rimraf dist',
    },
    dependencies: deps,
  };
  if (isReact) p.peerDependencies = { react: '^18.3.0' };
  return p;
}

function makeTsconfig(deps) {
  const paths = {};
  Object.keys(deps)
    .filter((d) => d.startsWith('@team-portal/'))
    .forEach((d) => {
      paths[d] = ['../' + d.replace('@team-portal/', '') + '/src'];
    });
  return {
    extends: '../../tsconfig.base.json',
    compilerOptions: { outDir: './dist', rootDir: './src', baseUrl: '.', paths },
    include: ['src/**/*'],
  };
}

function createPackage(name, deps, isReact, src) {
  const dir = join(root, 'packages', name);
  wj(join(dir, 'package.json'), makePkg(name, deps, isReact));
  wj(join(dir, 'tsconfig.json'), makeTsconfig(deps));
  write(join(dir, 'src', 'index.ts'), src);
  console.log('  ✓ packages/' + name);
}

// ─── 10 Packages ───
console.log('Creating 10 packages...');

createPackage(
  'types',
  {},
  false,
  [
    'export interface Ticket {',
    '  id: string; title: string;',
    "  status: 'pending' | 'in_progress' | 'resolved' | 'closed';",
    "  priority: 'low' | 'medium' | 'high' | 'urgent';",
    '  assigneeId: string; tenantId: string;',
    '  createdAt: string; updatedAt: string;',
    '}',
    "export interface User { id: string; name: string; email: string; tenantId: string; role: 'admin' | 'agent'; }",
    'export interface Tenant { id: string; name: string; primaryColor: string; }',
    "export interface Notification { id: string; type: 'ticket_assigned' | 'ticket_updated' | 'mention'; message: string; read: boolean; createdAt: string; }",
    "export type TicketStatus = Ticket['status'];",
  ].join('\n') + '\n',
);

createPackage(
  'utils',
  { '@team-portal/types': 'workspace:*' },
  false,
  [
    "import type { TicketStatus } from '@team-portal/types';",
    'export function formatDate(d: string | Date): string {',
    "  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d));",
    '}',
    'export function formatTicketStatus(s: TicketStatus): string {',
    "  const m: Record<TicketStatus, string> = { pending: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' };",
    '  return m[s];',
    '}',
    "export function cn(...classes: (string | undefined | false | null)[]): string { return classes.filter(Boolean).join(' '); }",
    'export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {',
    '  let t: ReturnType<typeof setTimeout>;',
    '  return ((...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }) as T;',
    '}',
  ].join('\n') + '\n',
);

createPackage(
  'design-tokens',
  {},
  false,
  [
    'export type ColorToken =',
    '  | `--color-primary-${50|100|200|300|400|500|600|700|800|900}`',
    '  | `--color-success-${50|100|200|300|400|500|600|700|800|900}`',
    '  | `--color-warning-${50|100|200|300|400|500|600|700|800|900}`',
    '  | `--color-error-${50|100|200|300|400|500|600|700|800|900}`',
    '  | `--color-info-${50|100|200|300|400|500|600|700|800|900}`',
    '  | `--color-neutral-${50|100|200|300|400|500|600|700|800|900}`;',
    'export type SpacingToken = `--spacing-${1|2|3|4|5|6|8|10|12|16|20|24|32}`;',
    "export type RadiusToken = `--radius-${'small'|'medium'|'large'|'full'}`;",
    "export type FontSizeToken = `--font-size-${'xs'|'sm'|'base'|'lg'|'xl'|'2xl'}`;",
    "export type ShadowToken = `--shadow-${'sm'|'md'|'lg'|'xl'}`;",
    "export type DurationToken = `--duration-${'fast'|'normal'|'slow'}`;",
    'export type DesignToken = ColorToken | SpacingToken | RadiusToken | FontSizeToken | ShadowToken | DurationToken;',
    'export type ThemeConfig = Record<DesignToken, string>;',
  ].join('\n') + '\n',
);

createPackage(
  'icons',
  { react: '^18.3.0' },
  true,
  [
    "import type { SVGProps } from 'react';",
    'export function TicketIcon(p: SVGProps<SVGSVGElement>) {',
    "  return <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}><path d='M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z'/></svg>;",
    '}',
    'export function BellIcon(p: SVGProps<SVGSVGElement>) {',
    "  return <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}><path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/></svg>;",
    '}',
    'export function DashboardIcon(p: SVGProps<SVGSVGElement>) {',
    "  return <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}><rect width='7' height='9' x='3' y='3' rx='1'/><rect width='7' height='5' x='14' y='3' rx='1'/></svg>;",
    '}',
    'export function CheckIcon(p: SVGProps<SVGSVGElement>) {',
    "  return <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}><path d='M20 6 9 17l-5-5'/></svg>;",
    '}',
    'export function CloseIcon(p: SVGProps<SVGSVGElement>) {',
    "  return <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}><path d='M18 6 6 18'/><path d='m6 6 12 12'/></svg>;",
    '}',
  ].join('\n') + '\n',
);

createPackage(
  'hooks',
  { react: '^18.3.0', '@team-portal/utils': 'workspace:*' },
  true,
  [
    "'use client';",
    "import { useState, useEffect, useCallback, useRef } from 'react';",
    'export function useDebounce<T>(value: T, delay: number): T {',
    '  const [d, setD] = useState(value);',
    '  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);',
    '  return d;',
    '}',
    'export function useLocalStorage<T>(key: string, init: T): [T, (v: T) => void] {',
    '  const [v, setV] = useState<T>(() => { try { const i = window.localStorage.getItem(key); return i ? (JSON.parse(i) as T) : init; } catch { return init; } });',
    '  const set = useCallback((n: T) => { setV(n); window.localStorage.setItem(key, JSON.stringify(n)); }, [key]);',
    '  return [v, set];',
    '}',
    'export function useClickOutside<T extends HTMLElement>(h: () => void) {',
    '  const r = useRef<T>(null);',
    "  useEffect(() => { const l = (e: MouseEvent) => { if (!r.current?.contains(e.target as Node)) h(); }; document.addEventListener('mousedown', l); return () => document.removeEventListener('mousedown', l); }, [h]);",
    '  return r;',
    '}',
  ].join('\n') + '\n',
);

createPackage(
  'ui',
  {
    react: '^18.3.0',
    '@team-portal/design-tokens': 'workspace:*',
    '@team-portal/utils': 'workspace:*',
    '@team-portal/icons': 'workspace:*',
  },
  true,
  [
    "'use client';",
    "import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, useEffect } from 'react';",
    "import { cn } from '@team-portal/utils';",
    "import { CloseIcon } from '@team-portal/icons';",
    '',
    "type BtnVariant = 'primary' | 'secondary' | 'ghost';",
    "type BtnSize = 'sm' | 'md' | 'lg';",
    '',
    "export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {",
    "  const base = 'inline-flex items-center justify-center font-medium rounded-medium transition-colors duration-fast focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';",
    "  const variants: Record<BtnVariant, string> = { primary: 'bg-primary-500 text-white hover:bg-primary-600', secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200', ghost: 'text-neutral-900 hover:bg-neutral-100' };",
    "  const sizes: Record<BtnSize, string> = { sm: 'px-2 py-1 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' };",
    '  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;',
    '}',
    '',
    'export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {',
    "  return <input className={cn('flex h-10 w-full rounded-medium border border-neutral-200 bg-white px-3 py-2 text-base placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50', className)} {...props} />;",
    '}',
    '',
    'export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {',
    "  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; if (open) document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [open, onClose]);",
    '  if (!open) return null;',
    "  return (<div className='fixed inset-0 z-50 flex items-center justify-center' role='dialog' aria-modal='true'><div className='fixed inset-0 bg-black/50' onClick={onClose} /><div className='relative z-10 w-full max-w-lg rounded-large bg-white p-6 shadow-lg'><div className='flex items-center justify-between mb-4'><h2 className='text-lg font-semibold'>{title}</h2><button onClick={onClose} className='text-neutral-500 hover:text-neutral-900' aria-label='关闭'><CloseIcon /></button></div>{children}</div></div>);",
    '}',
    '',
    'export function Table<T>({ columns, data }: { columns: { key: string; header: string; render?: (row: T) => ReactNode }[]; data: T[] }) {',
    "  return (<div className='w-full overflow-auto'><table className='w-full text-left'><thead className='border-b border-neutral-200 bg-neutral-50'><tr>{columns.map(c => <th key={c.key} className='px-4 py-3 font-medium text-neutral-900'>{c.header}</th>)}</tr></thead><tbody>{data.map((row, i) => <tr key={i} className='border-b border-neutral-100 hover:bg-neutral-50'>{columns.map(c => <td key={c.key} className='px-4 py-3'>{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}</td>)}</tr>)}</tbody></table></div>);",
    '}',
  ].join('\n') + '\n',
);

createPackage(
  'api-client',
  { '@team-portal/types': 'workspace:*' },
  false,
  [
    "const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';",
    'export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }',
    'export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {',
    "  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json', ...init?.headers }, ...init });",
    '  if (!res.ok) throw new ApiError(res.status, await res.text());',
    '  return res.json() as Promise<T>;',
    '}',
    'export const api = {',
    '  get: <T>(p: string) => apiRequest<T>(p),',
    "  post: <T>(p: string, body: unknown) => apiRequest<T>(p, { method: 'POST', body: JSON.stringify(body) }),",
    "  put: <T>(p: string, body: unknown) => apiRequest<T>(p, { method: 'PUT', body: JSON.stringify(body) }),",
    "  patch: <T>(p: string, body: unknown) => apiRequest<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),",
    "  delete: <T>(p: string) => apiRequest<T>(p, { method: 'DELETE' }),",
    '};',
  ].join('\n') + '\n',
);

createPackage(
  'config-store',
  { react: '^18.3.0', zustand: '^4.5.0', '@team-portal/design-tokens': 'workspace:*' },
  true,
  [
    "'use client';",
    "import { create } from 'zustand';",
    "import type { ThemeConfig } from '@team-portal/design-tokens';",
    'interface ThemeState { tenantId: string; setTenantTheme: (id: string, config: ThemeConfig) => void; }',
    'export const useThemeStore = create<ThemeState>((set) => ({',
    "  tenantId: 'default',",
    '  setTenantTheme: (id, config) => {',
    '    const root = document.documentElement;',
    '    Object.entries(config).forEach(([k, v]) => root.style.setProperty(k, v));',
    "    root.setAttribute('data-theme', id);",
    '    set({ tenantId: id });',
    '  },',
    '}));',
  ].join('\n') + '\n',
);

createPackage(
  'i18n',
  {},
  false,
  [
    "export type Locale = 'zh-CN' | 'en-US';",
    'type Dict = Record<string, string>;',
    'const dictionaries: Record<Locale, Dict> = {',
    "  'zh-CN': { 'app.title': '工单管理系统', 'ticket.list': '工单列表', 'ticket.detail': '工单详情', 'ticket.status.pending': '待处理', 'ticket.status.in_progress': '处理中', 'ticket.status.resolved': '已解决', 'ticket.status.closed': '已关闭', 'common.search': '搜索', 'common.confirm': '确认', 'common.cancel': '取消' },",
    "  'en-US': { 'app.title': 'Ticket Management', 'ticket.list': 'Ticket List', 'ticket.detail': 'Ticket Detail', 'ticket.status.pending': 'Pending', 'ticket.status.in_progress': 'In Progress', 'ticket.status.resolved': 'Resolved', 'ticket.status.closed': 'Closed', 'common.search': 'Search', 'common.confirm': 'Confirm', 'common.cancel': 'Cancel' },",
    '};',
    "export function getDictionary(locale: Locale): Dict { return dictionaries[locale] ?? dictionaries['zh-CN']; }",
    'export function t(locale: Locale, key: string): string { return dictionaries[locale]?.[key] ?? key; }',
  ].join('\n') + '\n',
);

createPackage(
  'config-tailwind',
  {},
  false,
  [
    "import type { Config } from 'tailwindcss';",
    'export const tailwindPreset: Partial<Config> = {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    "        primary: { 50: 'var(--color-primary-50)', 500: 'var(--color-primary-500)', 600: 'var(--color-primary-600)', 700: 'var(--color-primary-700)' },",
    "        success: { 500: 'var(--color-success-500)' },",
    "        warning: { 500: 'var(--color-warning-500)' },",
    "        error: { 500: 'var(--color-error-500)' },",
    "        info: { 500: 'var(--color-info-500)' },",
    "        neutral: { 50: 'var(--color-neutral-50)', 100: 'var(--color-neutral-100)', 500: 'var(--color-neutral-500)', 900: 'var(--color-neutral-900)' },",
    '      },',
    "      spacing: { 1: 'var(--spacing-1)', 2: 'var(--spacing-2)', 4: 'var(--spacing-4)', 8: 'var(--spacing-8)' },",
    "      borderRadius: { small: 'var(--radius-small)', medium: 'var(--radius-medium)', large: 'var(--radius-large)' },",
    "      fontSize: { sm: 'var(--font-size-sm)', base: 'var(--font-size-base)', lg: 'var(--font-size-lg)' },",
    "      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },",
    "      transitionDuration: { fast: 'var(--duration-fast)', normal: 'var(--duration-normal)', slow: 'var(--duration-slow)' },",
    '    },',
    '  },',
    '};',
  ].join('\n') + '\n',
);

// ─── 5 Apps ───
console.log('Creating 5 apps...');

function createApp(name, deps, isNext, src) {
  const dir = join(root, 'apps', name);
  const p = {
    name: '@team-portal/' + name,
    version: '0.1.0',
    private: true,
    scripts: {
      build: isNext ? 'next build' : 'tsc -p tsconfig.json',
      dev: isNext
        ? 'next dev -p ' +
          (name === 'web-app'
            ? '3000'
            : name === 'admin-app'
              ? '3001'
              : name === 'mobile-app'
                ? '3002'
                : '3003')
        : 'tsc --watch',
      lint: 'eslint .',
      typecheck: 'tsc --noEmit',
      clean: 'rimraf dist .next',
    },
    dependencies: deps,
  };
  wj(join(dir, 'package.json'), p);
  const paths = {};
  Object.keys(deps)
    .filter((d) => d.startsWith('@team-portal/'))
    .forEach((d) => {
      paths[d] = ['../../packages/' + d.replace('@team-portal/', '') + '/src'];
    });
  wj(join(dir, 'tsconfig.json'), {
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      outDir: './dist',
      rootDir: '.',
      baseUrl: '.',
      paths,
      ...(isNext ? { jsx: 'preserve', plugins: [{ name: 'next' }] } : {}),
    },
    include: isNext ? ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts'] : ['src/**/*'],
  });
  if (isNext) {
    write(
      join(dir, 'next.config.js'),
      "/** @type {import('next').NextConfig} */\nconst nextConfig = { transpilePackages: ['@team-portal/ui','@team-portal/icons','@team-portal/hooks','@team-portal/config-store'] };\nmodule.exports = nextConfig;\n",
    );
  }
  write(join(dir, isNext ? 'app/page.tsx' : 'src/index.ts'), src);
  console.log('  ✓ apps/' + name);
}

createApp(
  'web-app',
  {
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    '@team-portal/ui': 'workspace:*',
    '@team-portal/icons': 'workspace:*',
    '@team-portal/hooks': 'workspace:*',
    '@team-portal/utils': 'workspace:*',
    '@team-portal/types': 'workspace:*',
    '@team-portal/api-client': 'workspace:*',
    '@team-portal/config-store': 'workspace:*',
    '@team-portal/i18n': 'workspace:*',
  },
  true,
  [
    "import { Button } from '@team-portal/ui';",
    "export default function Home() { return (<main className='p-8'><h1 className='text-2xl font-bold mb-4'>Team Portal Lite — Web App</h1><Button>提交工单</Button></main>); }",
  ].join('\n') + '\n',
);

createApp(
  'admin-app',
  {
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    '@team-portal/ui': 'workspace:*',
    '@team-portal/icons': 'workspace:*',
    '@team-portal/utils': 'workspace:*',
    '@team-portal/types': 'workspace:*',
  },
  true,
  [
    "import { Table } from '@team-portal/ui';",
    "export default function AdminHome() { return (<main className='p-8'><h1 className='text-2xl font-bold mb-4'>Admin Dashboard</h1><Table columns={[{key:'id',header:'ID'},{key:'name',header:'名称'}]} data={[{id:'1',name:'租户A'}]} /></main>); }",
  ].join('\n') + '\n',
);

createApp(
  'mobile-app',
  {
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    '@team-portal/ui': 'workspace:*',
    '@team-portal/utils': 'workspace:*',
  },
  true,
  [
    "import { Button } from '@team-portal/ui';",
    "export default function MobileHome() { return (<main className='p-4 max-w-md mx-auto'><h1 className='text-xl font-bold mb-4'>Mobile</h1><Button size='sm'>移动端</Button></main>); }",
  ].join('\n') + '\n',
);

createApp(
  'landing-app',
  {
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    '@team-portal/ui': 'workspace:*',
  },
  true,
  [
    "export default function Landing() { return (<main className='min-h-screen flex items-center justify-center'><h1 className='text-3xl font-bold'>Team Portal Lite</h1></main>); }",
  ].join('\n') + '\n',
);

createApp(
  'storybook',
  {
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    '@team-portal/ui': 'workspace:*',
    '@team-portal/icons': 'workspace:*',
    '@team-portal/design-tokens': 'workspace:*',
  },
  false,
  [
    '// Storybook app entry',
    '// Run: pnpm --filter @team-portal/storybook storybook dev -p 6006',
    "export const storybookVersion = '0.1.0';",
  ].join('\n') + '\n',
);

console.log('\n✅ Scaffold complete! 10 packages + 5 apps created.');
console.log('Run: pnpm install && pnpm build');
