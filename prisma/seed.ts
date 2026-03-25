import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:./dev.db",
    },
  },
  log: ["query", "info", "warn", "error"],
});

async function main() {
  console.log("🌱 Iniciando seed de datos Valtek...");

  // ── 1. Organización Demo ─────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "valtek-demo" },
    update: {},
    create: {
      id: "demo-org-001",
      name: "Valtek Demo",
      slug: "valtek-demo",
    },
  });
  console.log("✅ Organización:", org.name);

  // ── 2. Usuario Admin ─────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@valtek.io" },
    update: {},
    create: {
      id: "demo-admin-001",
      email: "admin@valtek.io",
      name: "Admin Valtek",
      role: "ADMIN",
      organizationId: org.id,
    },
  });
  console.log("✅ Usuario:", admin.email);

  // ── 3. Categorías ────────────────────────────────────────────────────
  const categories = await Promise.all(
    [
      { name: "Electrónica", id: "cat-electronica" },
      { name: "Redes", id: "cat-redes" },
      { name: "Almacenamiento", id: "cat-storage" },
      { name: "Periféricos", id: "cat-perifericos" },
    ].map((cat) =>
      prisma.category.upsert({
        where: { name_organizationId: { name: cat.name, organizationId: org.id } },
        update: {},
        create: { id: cat.id, name: cat.name, organizationId: org.id },
      })
    )
  );
  console.log("✅ Categorías:", categories.map((c) => c.name).join(", "));

  // ── 4. Productos ─────────────────────────────────────────────────────
  const products = [
    {
      id: "prod-001",
      sku: "VTK-MEM-001",
      name: "Módulo de Memoria DDR5 16GB",
      description: "RAM DDR5 5600MHz CL36",
      priceUsd: 89.99,
      minStock: 10,
      currentStock: 6, // Stock bajo
      categoryId: "cat-electronica",
    },
    {
      id: "prod-002",
      sku: "VTK-SSD-001",
      name: "SSD NVMe 1TB Gen4",
      description: "PCIe Gen4, 7000MB/s lectura",
      priceUsd: 119.99,
      minStock: 5,
      currentStock: 0, // Crítico
      categoryId: "cat-storage",
    },
    {
      id: "prod-003",
      sku: "VTK-SW-001",
      name: "Switch Gestionado 24 Puertos",
      description: "24x PoE+, 2x SFP, 370W",
      priceUsd: 459.0,
      minStock: 3,
      currentStock: 8,
      categoryId: "cat-redes",
    },
    {
      id: "prod-004",
      sku: "VTK-RTR-001",
      name: "Router Empresarial 10GbE",
      description: "Dual WAN, VPN, QoS avanzado",
      priceUsd: 299.99,
      minStock: 2,
      currentStock: 12,
      categoryId: "cat-redes",
    },
    {
      id: "prod-005",
      sku: "VTK-KBD-001",
      name: "Teclado Mecánico Inalámbrico",
      description: "Cherry MX Brown, 75%, RGB",
      priceUsd: 129.0,
      minStock: 8,
      currentStock: 23,
      categoryId: "cat-perifericos",
    },
    {
      id: "prod-006",
      sku: "VTK-MON-001",
      name: 'Monitor IPS 27" 4K 144Hz',
      description: "USB-C 90W, HDR400, sRGB 99%",
      priceUsd: 499.0,
      minStock: 4,
      currentStock: 3, // Stock bajo
      categoryId: "cat-electronica",
    },
    {
      id: "prod-007",
      sku: "VTK-PWR-001",
      name: "UPS 1500VA Torre",
      description: "1000W real, 8 tomas protegidas",
      priceUsd: 189.0,
      minStock: 3,
      currentStock: 15,
      categoryId: "cat-electronica",
    },
    {
      id: "prod-008",
      sku: "VTK-CAB-001",
      name: "Cable Fibra OM3 LC-LC 10m",
      description: "Dúplex multimodo 10Gbps",
      priceUsd: 22.5,
      minStock: 20,
      currentStock: 47,
      categoryId: "cat-redes",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku_organizationId: { sku: product.sku, organizationId: org.id } },
      update: { currentStock: product.currentStock },
      create: { ...product, organizationId: org.id },
    });
  }
  console.log(`✅ Productos: ${products.length} upserted`);

  // ── 5. Tasa de Cambio ────────────────────────────────────────────────
  await prisma.exchangeRate.upsert({
    where: { currency_organizationId: { currency: "VES", organizationId: org.id } },
    update: { rateToUsd: 49.5, source: "manual" },
    create: {
      currency: "VES",
      rateToUsd: 49.5,
      source: "manual",
      organizationId: org.id,
    },
  });
  console.log("✅ Tasa de cambio: 1 USD = 49.50 VES");

  // ── 6. Logs de inventario de muestra ─────────────────────────────────
  const logsExist = await prisma.inventoryLog.count({
    where: { organizationId: org.id },
  });

  if (logsExist === 0) {
    await prisma.inventoryLog.createMany({
      data: [
        {
          type: "ENTRADA",
          quantity: 50,
          previousStock: 0,
          newStock: 50,
          note: "Carga inicial de inventario",
          productId: "prod-005",
          userId: admin.id,
          organizationId: org.id,
        },
        {
          type: "SALIDA",
          quantity: 27,
          previousStock: 50,
          newStock: 23,
          note: "Despacho a cliente Corporativo XYZ",
          productId: "prod-005",
          userId: admin.id,
          organizationId: org.id,
        },
        {
          type: "ENTRADA",
          quantity: 15,
          previousStock: 0,
          newStock: 15,
          note: "Reabastecimiento urgente",
          productId: "prod-007",
          userId: admin.id,
          organizationId: org.id,
        },
      ],
    });
    console.log("✅ Logs de inventario de muestra creados");
  }

  console.log("\n🎉 Seed completado exitosamente.");
  console.log("   → Org ID: demo-org-001");
  console.log("   → Admin:  admin@valtek.io");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
