import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const orgId = "org_demo"

  // 1. Aseguramos que la organización exista
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      id: orgId,
      name: "Organización Valtek Demo",
      slug: "demo-org",
    },
  })
  
  // 2. Aseguramos que exista un usuario para la org (necesario para futuras ventas)
  const user = await prisma.user.upsert({
    where: { email: "admin@valtek.demo" },
    update: {},
    create: {
      id: "user_demo",
      email: "admin@valtek.demo",
      name: "Admin Demo",
      role: "ADMIN",
      organizationId: org.id,
    }
  })

  // 3. Insertamos 3 productos de prueba con nombres reales
  const products = [
    {
      sku: "VAL-1001",
      name: "Manguera Continental 1/2\"",
      description: "Manguera industrial de alta presión",
      priceUsd: 15.50,
      minStock: 20,
      currentStock: 150,
      organizationId: org.id,
    },
    {
      sku: "VAL-1002",
      name: "Acople Rápido Hidráulico 3/4\"",
      description: "Acople de acero inoxidable",
      priceUsd: 8.75,
      minStock: 50,
      currentStock: 300,
      organizationId: org.id,
    },
    {
      sku: "VAL-1003",
      name: "Válvula Esférica de Bronce 1\"",
      description: "Válvula de paso total",
      priceUsd: 22.10,
      minStock: 10,
      currentStock: 45,
      organizationId: org.id,
    }
  ]

  console.log(`Borrando productos anteriores de la org ${orgId}...`)
  await prisma.product.deleteMany({
    where: { organizationId: orgId }
  })

  console.log("Insertando nuevos productos...")
  for (const p of products) {
    const created = await prisma.product.create({
      data: p
    })
    console.log(`Creado producto: ${created.name} (SKU: ${created.sku})`)
  }

  console.log("¡Seed rápido completado!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
