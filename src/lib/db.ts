// Database Configuration Service
// This service provides a configurable database layer that can be switched between:
// - Supabase (current)
// - Custom REST API backend
// - Mock data (for development/demo)

import { supabase } from "@/integrations/supabase/client";

// Configuration from environment variables
const DB_CONFIG = {
  // Set to 'supabase', 'api', or 'mock'
  provider: import.meta.env.VITE_DB_PROVIDER || 'supabase',
  // Custom API base URL (when using 'api' provider)
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  // Gemini API Key
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
};

// Type definitions
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface DbClient {
  from: (table: string) => DbTable;
  functions?: {
    invoke: (name: string, options?: { body?: unknown }) => Promise<{ data: unknown; error: Error | null }>;
  };
}

export interface DbTable {
  select: (columns?: string) => DbQueryBuilder;
  insert: (data: unknown[]) => DbInsertBuilder;
  update: (data: Record<string, unknown>) => DbUpdateBuilder;
  delete: () => DbDeleteBuilder;
  eq: (column: string, value: unknown) => DbTable;
  order: (column: string, options?: { ascending?: boolean }) => DbTable;
  single: () => DbTable;
}

export interface DbQueryBuilder {
  order: (column: string, options?: { ascending?: boolean }) => DbQueryBuilder;
  eq: (column: string, value: unknown) => DbQueryBuilder;
  single: () => Promise<QueryResult<unknown>>;
  then: Promise<QueryResult<unknown[]>>['then'];
}

export interface DbInsertBuilder {
  then: Promise<{ error: Error | null }>['then'];
}

export interface DbUpdateBuilder {
  eq: (column: string, value: unknown) => DbUpdateBuilder;
  then: Promise<{ error: Error | null }>['then'];
}

export interface DbDeleteBuilder {
  eq: (column: string, value: unknown) => DbDeleteBuilder;
  then: Promise<{ error: Error | null }>['then'];
}

// Supabase client wrapper (current implementation)
const createSupabaseWrapper = (): DbClient => {
  return {
    from: (table: string) => {
      const query = supabase.from(table);
      return wrapSupabaseTable(query);
    },
    functions: {
      invoke: async (name: string, options?: { body?: unknown }) => {
        const result = await supabase.functions.invoke(name, options);
        return { data: result.data, error: result.error };
      }
    }
  };
};

// Wrapper for Supabase table operations
const wrapSupabaseTable = (query: any): DbTable => {
  return {
    select: (columns = '*') => {
      const newQuery = query.select(columns);
      return wrapSupabaseQuery(newQuery);
    },
    insert: (data: unknown[]) => {
      const newQuery = query.insert(data);
      return {
        then: (resolve: any, reject: any) => {
          newQuery.then((result: any) => {
            resolve({ error: result.error });
          }).catch((err: any) => reject(err));
        }
      };
    },
    update: (data: Record<string, unknown>) => {
      const newQuery = query.update(data);
      return {
        eq: (column: string, value: unknown) => {
          const filteredQuery = newQuery.eq(column, value);
          return {
            eq: (col: string, val: unknown) => wrapSupabaseUpdate(filteredQuery.eq(col, val)),
            then: (resolve: any, reject: any) => {
              filteredQuery.then((result: any) => {
                resolve({ error: result.error });
              }).catch((err: any) => reject(err));
            }
          };
        },
        then: (resolve: any, reject: any) => {
          newQuery.then((result: any) => {
            resolve({ error: result.error });
          }).catch((err: any) => reject(err));
        }
      };
    },
    delete: () => {
      return {
        eq: (column: string, value: unknown) => {
          const newQuery = query.delete().eq(column, value);
          return {
            eq: (col: string, val: unknown) => ({
              then: (resolve: any, reject: any) => {
                newQuery.eq(col, val).then((result: any) => {
                  resolve({ error: result.error });
                }).catch((err: any) => reject(err));
              }
            }),
            then: (resolve: any, reject: any) => {
              newQuery.then((result: any) => {
                resolve({ error: result.error });
              }).catch((err: any) => reject(err));
            }
          };
        },
        then: (resolve: any, reject: any) => {
          query.delete().then((result: any) => {
            resolve({ error: result.error });
          }).catch((err: any) => reject(err));
        }
      };
    },
    eq: (column: string, value: unknown) => {
      return wrapSupabaseTable(query.eq(column, value));
    },
    order: (column: string, options = {}) => {
      return wrapSupabaseTable(query.order(column, options));
    },
    single: () => {
      return wrapSupabaseTable(query.single());
    }
  };
};

// Wrapper for Supabase query operations
const wrapSupabaseQuery = (query: any): DbQueryBuilder => {
  return {
    order: (column: string, options = {}) => {
      return wrapSupabaseQuery(query.order(column, options));
    },
    eq: (column: string, value: unknown) => {
      return wrapSupabaseQuery(query.eq(column, value));
    },
    single: async () => {
      const result = await query.single();
      return { data: result.data, error: result.error };
    },
    then: (resolve: any, reject: any) => {
      query.then((result: any) => {
        resolve({ data: result.data, error: result.error });
      }).catch((err: any) => reject(err));
    }
  };
};

const wrapSupabaseUpdate = (query: any) => ({
  eq: (col: string, val: unknown) => ({
    eq: (c: string, v: unknown) => wrapSupabaseUpdate(query.eq(c, v)),
    then: (resolve: any, reject: any) => {
      query.then((result: any) => {
        resolve({ error: result.error });
      }).catch((err: any) => reject(err));
    }
  }),
  then: (resolve: any, reject: any) => {
    query.then((result: any) => {
      resolve({ error: result.error });
    }).catch((err: any) => reject(err));
  }
});

// Get the database client based on configuration
export const getDbClient = (): DbClient => {
  switch (DB_CONFIG.provider) {
    case 'supabase':
    default:
      return createSupabaseWrapper();
  }
};

// Export configuration
export const getDbConfig = () => DB_CONFIG;

// Export Gemini API key
export const getGeminiApiKey = () => DB_CONFIG.geminiApiKey;

// Helper to check if we're in demo mode (skipped auth)
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('climateai_skip_auth') === 'true';
};

// Default export
export const db = getDbClient();
