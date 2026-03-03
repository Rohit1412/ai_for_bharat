/> <reference types="vite/client" />

interface ImportMetaEnv {
  // Database Configuration
  readonly VITE_DATABASE_URL: string;
  readonly VITE_DB_PROVIDER: 'supabase' | 'api' | 'mock';
  readonly VITE_API_BASE_URL: string;

  // AI API Keys
  readonly VITE_GEMINI_API_KEY: string;

  // AWS Configuration
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_API_URL: string;
  readonly VITE_BEDROCK_MODEL_ID: string;
  readonly VITE_DYNAMODB_TABLE_FARMS: string;
  readonly VITE_DYNAMODB_TABLE_ALERTS: string;
  readonly VITE_DYNAMODB_TABLE_INTERVENTIONS: string;
  readonly VITE_S3_BUCKET_DATA: string;
  readonly VITE_S3_BUCKET_PDFS: string;
  readonly VITE_S3_PUBLIC_URL: string;
  readonly VITE_SNS_TOPIC_ALERTS: string;
  readonly VITE_AWS_USER_POOLS_ID: string;
  readonly VITE_AWS_USER_POOLS_WEB_CLIENT_ID: string;
  readonly VITE_AWS_COGNITO_REGION: string;
  readonly VITE_MAPBOX_TOKEN: string;

  // Legacy Supabase (kept for compatibility but not used)
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
