import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getStoreBySlugOrDomain } from "@/lib/store-service";
import StorefrontClient from "./storefront-client";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const store = await getStoreBySlugOrDomain(slug);

    if (!store) {
        return {
            title: "Store Not Found",
            description: "The requested online store does not exist."
        };
    }

    const title = `${store.name} - Online Dukaan`;
    const description = store.description || store.tagline || `Ghar bethay ${store.name} se online order karein direct WhatsApp par.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: store.logoUrl ? [{ url: store.logoUrl }] : []
        }
    };
}

export default async function StorePage({ params }: Props) {
    const { slug } = await params;
    const store = await getStoreBySlugOrDomain(slug);

    if (!store) {
        notFound();
    }

    return (
        <StorefrontClient
            store={{
                id: store.id,
                name: store.name,
                slug: store.slug,
                tagline: store.tagline,
                description: store.description,
                logoUrl: store.logoUrl,
                bannerUrl: store.bannerUrl,
                phone: store.phone,
                address: store.address,
                city: store.city,
                currency: store.currency,
                currencySymbol: store.currencySymbol,
                deliveryFee: store.deliveryFee,
                minOrderAmount: store.minOrderAmount,
                freeDeliveryAbove: store.freeDeliveryAbove,
                estimatedDeliveryTime: store.estimatedDeliveryTime,
                openingHours: store.openingHours,
                noticeMessage: store.noticeMessage,
                isOpen: store.isOpen,
                customDomain: store.customDomain,
                categories: store.categories.map(c => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    icon: c.icon
                })),
                products: store.products.map(p => ({
                    id: p.id,
                    categoryId: p.categoryId,
                    name: p.name,
                    slug: p.slug,
                    description: p.description,
                    price: p.price,
                    compareAtPrice: p.compareAtPrice,
                    unit: p.unit,
                    image: p.image,
                    inStock: p.inStock
                }))
            }}
        />
    );
}
