export interface Product {
  id: number;
  name: string;
  description?: string;
  download_link: string;
  image_url?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_id: string;
  claim_status: 'claimed' | 'unclaimed' | 'available';
  claim_timestamp?: string;
  claim_count: number;
  expiration_date?: string;
  one_time_use: boolean;
  created_by?: string;
  created_at: string;
  products?: Product[]; // Added for joined queries
  product_names?: string;
  product_ids?: string;
}

export interface OrderProduct {
  id: number;
  order_id: number;
  product_id: number;
  created_at: string;
  product?: Product; // Added for joined queries
}

export interface Settings {
  default_expiration_days: string;
  one_time_use_enabled: string;
  admin_username: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  products?: Product[];
  download_links?: string[];
  claim_count?: number;
}

export interface Admin {
  id: number;
  username: string;
  created_at: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  download_link: string;
  image_url?: string;
}

export interface JwtAdminPayload {
  userId: number;
  // Add other properties if they exist in your JWT payload
}
