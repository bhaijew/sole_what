import { Metadata } from "next";
import { getPublicStoresDirectory } from "@/lib/store-service";
import DukaanClient from "./dukaan-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Mohallay Ki Dukaanein | Online Dukaan Directory - SoleWhat",
    description: "Apne shehr aur mohallay ki verified dukaano se fresh sauda salaf, milk, bakery, meat aur grocery direct WhatsApp par mangwayein.",
    openGraph: {
        title: "SoleWhat Dukaan - Mohallay Ki Dukaanein",
        description: "Select your location and order directly from your local neighborhood store via WhatsApp.",
        type: "website"
    }
};

export default async function DukaanDirectoryPage() {
    const data = await getPublicStoresDirectory();

    return (
        <DukaanClient
            initialStores={data.stores}
            initialCities={data.cities}
            initialAreas={data.areas}
            totalCount={data.totalCount}
        />
    );
}
