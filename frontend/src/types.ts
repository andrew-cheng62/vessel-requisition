export type Vessel = {
  id: number;
  name: string;
  imo_number?: string;
  flag?: string;
  email?: string;
  vessel_type?: string;
  is_active: boolean;
  created_at: string;
  user_count?: number;
  item_count?: number;
  requisition_count?: number;
};

export type User = {
  id: string;
  username: string;
  full_name?: string;
  role: "super_admin" | "captain" | "crew";
  is_active: boolean;
  vessel_id?: number;
  created_at?: string;
};

export type Company = {
  id: number;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  is_manufacturer?: boolean;
  is_supplier?: boolean;
  comments?: string;
  logo_path?: string;
  is_active: boolean;
};

export type CompanyCreate = {
  name: string;
  is_supplier: boolean;
  is_manufacturer: boolean;
  logo_path?: string;
};

export type Item = {
  id: number;
  name: string;
  desc_short?: string;
  catalogue_nr?: string;
  unit: string;
  manufacturer?: Company | null;
  supplier?: Company;
  category?: Category;
  image_path?: string;
  created_at: string;
  desc_long?: string;
  is_active: boolean;       // global (super_admin controls)
  vessel_active?: boolean;  // vessel-level (captain controls)
};

export type ItemCreate = {
  name: string;
  description?: string;
  catalogue_nr?: string;
  manufacturer?: number;
  unit: string;
};

export type RequisitionLine = {
  item_id: number;
  name: string;
  unit: string;
  quantity: number;
};

export type RequisitionItem = {
  id: number;
  quantity: number;
  received_qty: number;
  item: { id: number; name: string; unit: string };
};

export type Requisition = {
  id: number;
  status: string;
  notes: string;
  created_at: string;
  supplier?: Company;
  items: RequisitionItem[];
  is_active: boolean;
};

export type RequisitionEditLine = {
  item_id: number;
  name: string;
  unit: string;
  quantity: number;
};

export type Supplier = { id: number; name: string };
export type Manufacturer = { id: number; name: string };
export type Category = { id: number; name: string };
export type CompanyRole = "supplier" | "manufacturer";