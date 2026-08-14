import type { Metadata } from "next";
import AdminDashboard from "./admin-dashboard";

export const metadata: Metadata = { title: "커뮤니티 어드민 | NP Signals" };
export default function AdminPage(){return <AdminDashboard/>}
