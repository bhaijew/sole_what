import { redirect } from "next/navigation";

export default async function DashboardStoreRedirectPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const search = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, val]) => {
            if (typeof val === "string") {
                search.set(key, val);
            } else if (Array.isArray(val)) {
                val.forEach(v => search.append(key, v));
            }
        });
    }
    const query = search.toString();
    redirect(`/store-dashboard${query ? `?${query}` : ""}`);
}
