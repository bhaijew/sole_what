import { redirect } from "next/navigation";

export default async function AddProductRedirectPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const storeId = params?.storeId;
    const query = storeId ? `?storeId=${storeId}` : "";
    redirect(`/dashboard/store/products/new${query}`);
}
