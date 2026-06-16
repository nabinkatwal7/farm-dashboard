import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export const publicSiteImages = {
  homeHero:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80",
  aboutHero:
    "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=1600&q=80",
  farmsHero:
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80",
  productsHero:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
  drone:
    "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
  livestock:
    "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80",
  produce:
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
  soil:
    "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&w=1200&q=80",
} as const;

export const portalModules = [
  {
    title: "Operations dashboard",
    description:
      "Daily priorities, live health signals, weather guidance, and operational KPIs.",
    href: "/login",
  },
  {
    title: "Traceability portal",
    description:
      "Batch lookup, product origin, production history, and consumer verification.",
    href: "/login",
  },
  {
    title: "Inventory and products",
    description:
      "Stock control, product listings, low-stock alerts, and shop readiness.",
    href: "/login",
  },
  {
    title: "Weather and crop models",
    description:
      "Field-level weather, GDD accumulation, and crop stage forecasting.",
    href: "/login",
  },
  {
    title: "Livestock and RFID",
    description:
      "Animal records, RFID scans, health events, and compliance workflows.",
    href: "/login",
  },
  {
    title: "Drone and scouting",
    description:
      "Flight logs, orthomosaics, scouting observations, and issue tracking.",
    href: "/login",
  },
] as const;

export type PublicFarm = Awaited<ReturnType<typeof getPublicSiteData>>["farms"][number];
export type PublicProduct = Awaited<
  ReturnType<typeof getPublicSiteData>
>["products"][number];

const emptyPublicSiteData = {
  totals: {
    farms: 0,
    products: 0,
    animals: 0,
    acreage: 0,
    batches: 0,
    weatherStations: 0,
    droneFlights: 0,
  },
  farms: [],
  products: [],
  categories: [],
  isFallback: true,
} as const;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export async function getPublicSiteData() {
  try {
    const [
      totalFarms,
      totalProducts,
      totalAnimals,
      acreage,
      farms,
      products,
      categories,
      batchCount,
      weatherStationCount,
      droneFlightCount,
    ] = await Promise.all([
      prisma.farm.count(),
      prisma.product.count(),
      prisma.animal.count({
        where: { status: { notIn: ["sold", "deceased"] } },
      }),
      prisma.farm.aggregate({ _sum: { acreage: true } }),
      prisma.farm.findMany({
        take: 12,
        orderBy: [{ products: { _count: "desc" } }, { name: "asc" }],
        include: {
          _count: {
            select: {
              fields: true,
              animals: true,
              products: true,
              batches: true,
              weatherStations: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        take: 24,
        orderBy: [{ stock: "desc" }, { name: "asc" }],
        include: {
          farm: {
            select: {
              name: true,
              location: true,
              acreage: true,
            },
          },
        },
      }),
      prisma.product.groupBy({
        by: ["category"],
        _count: { _all: true },
        orderBy: { _count: { category: "desc" } },
      }),
      prisma.batchRecord.count(),
      prisma.weatherStation.count(),
      prisma.droneFlight.count(),
    ]);

    return {
      totals: {
        farms: totalFarms,
        products: totalProducts,
        animals: totalAnimals,
        acreage: acreage._sum.acreage ?? 0,
        batches: batchCount,
        weatherStations: weatherStationCount,
        droneFlights: droneFlightCount,
      },
      farms,
      products,
      categories,
      isFallback: false,
    };
  } catch {
    return emptyPublicSiteData;
  }
}
