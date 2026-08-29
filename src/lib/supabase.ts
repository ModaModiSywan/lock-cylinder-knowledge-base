import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. 核心枚举与数据表 TypeScript 类型定义
// ==========================================

export type CncAxisType =
  | 'matrix_combination'
  | 'process'
  | 'material_cutting'
  | 'cnc_programming'
  | 'tooling_fixture'
  | 'tech_tool';

export interface FAQItem {
  q: string;
  a: string;
}

export interface KnowledgeEntry {
  id?: number | string;
  slug: string;
  axis_type: CncAxisType;
  category_slug: string;
  title: string;
  meta_title?: string | null;
  meta_description?: string | null;
  short_definition?: string | null;
  content_markdown: string;
  specs_data?: Record<string, string> | null;
  faqs_data?: FAQItem[] | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      knowledge_entries: {
        Row: KnowledgeEntry;
        Insert: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// ==========================================
// 2. 环境变量读取与校验
// ==========================================

const supabaseUrl =
  import.meta.env.SUPABASE_URL ||
  import.meta.env.PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined);

const supabaseAnonKey =
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Warning: Supabase credentials are missing. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are defined in your environment variables.'
  );
}

// ==========================================
// 3. 创建并导出 Supabase 客户端单例
// ==========================================

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);