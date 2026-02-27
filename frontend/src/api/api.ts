import axios from "axios";
import type { Item, Company, Category, CompanyRole, Vessel, User } from "../types";

const api = axios.create({ baseURL: "http://localhost:8000" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type ItemFilter = {
  search?: string;
  category_id?: number;
  manufacturer_id?: number;
  supplier_id?: number;
  page?: number;
  page_size?: number;
  show_inactive?: string;
  show_vessel_inactive?: string;
};

export const fetchItems = async (filter?: ItemFilter): Promise<Paginated<Item>> => {
  const res = await api.get("/items/", { params: filter });
  return res.data;
};

export type CompanyFilter = {
  role?: CompanyRole;
  search?: string;
  page?: number;
  page_size?: number;
};

export const fetchCompanies = async (filter?: CompanyFilter): Promise<Paginated<Company>> => {
  const res = await api.get("/companies", { params: filter });
  return res.data;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get("/categories");
  return res.data;
};

export const setItemVesselActive = (id: number, active: boolean) =>
  api.patch(`/items/${id}/vessel-active`, { is_active: active });

export const setItemActive = (id: number, active: boolean) =>
  api.patch(`/items/${id}/active`, { is_active: active });

export type VesselRegisterData = {
  name: string;
  imo_number?: string;
  email?: string;
  flag?: string;
  vessel_type?: string;
  captain_username: string;
  captain_full_name: string;
  captain_password: string;
};

export const registerVessel = async (data: VesselRegisterData): Promise<Vessel> => {
  const res = await api.post("/vessels/register", data);
  return res.data;
};

export const fetchVessels = async (): Promise<Vessel[]> => {
  const res = await api.get("/vessels/");
  return res.data;
};

export const fetchVessel = async (id: number): Promise<Vessel> => {
  const res = await api.get(`/vessels/${id}`);
  return res.data;
};

export type CrewCreateData = {
  username: string;
  full_name?: string;
  password: string;
  role: "crew" | "captain";
};

export const fetchMe = async (): Promise<User> => {
  const res = await api.get("/users/me");
  return res.data;
};

export const fetchCrew = async (): Promise<User[]> => {
  const res = await api.get("/users/");
  return res.data;
};

export const createCrew = async (data: CrewCreateData): Promise<User> => {
  const res = await api.post("/users/", data);
  return res.data;
};

export const updateCrew = async (id: string, data: Partial<CrewCreateData & { is_active: boolean }>): Promise<User> => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const deactivateCrew = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const uploadCompanyLogo = async (companyId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/companies/${companyId}/logo`, formData);
};

export const deleteCompanyLogo = async (companyId: number) => {
  return api.delete(`/companies/${companyId}/logo`);
};