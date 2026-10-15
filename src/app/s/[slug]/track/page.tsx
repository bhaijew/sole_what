import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getStoreBySlugOrDomain } from "@/lib/store-service";
import TrackOrderClient from "./track-client";

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const store = await getStoreBySlugOrDomain(slug);
    if (!store) return { title: "Track Order" };
    return {
        title: `Order Tracking - ${store.name}`,
        description: `Track your live delivery status for ${store.name}`
    };
}

export default async function TrackPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const sParams = await searchParams;
    const initialQuery = typeof sParams.order === "string" ? sParams.order : "";

    const store = await getStoreBySlugOrDomain(slug);
    if (!store) notFound();

    return (
        <TrackOrderClient
            store={{
                id: store.id,
                name: store.name,
                slug: store.slug,
                phone: store.phone,
                logoUrl: store.logoUrl,
                currencySymbol: store.currencySymbol,
                estimatedDeliveryTime: store.estimatedDeliveryTime,
                city: store.city
            }}
            initialQuery={initialQuery}
        />
    );
}
