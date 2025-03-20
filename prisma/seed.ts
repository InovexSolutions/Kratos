import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '~/server/lib/prisma'


async function seed() {
  // Create Data Centers
  const [usWest, euCentral] = await Promise.all([
    prisma.dataCenter.create({
      data: {
        name: 'US West',
        location: 'San Francisco, CA'
      }
    }),
    prisma.dataCenter.create({
      data: {
        name: 'EU Central',
        location: 'Frankfurt, DE'
      }
    })
  ])

  // Create Hosts
  const [gameHost, vpsHost, dedicatedHost] = await Promise.all([
    prisma.host.create({
      data: {
        hostname: 'game-eu-01',
        dataCenterId: euCentral.id,
        type: 'GAME_SERVER',
        spec: {
          cpu: 12,
          ram: 32,
          storage: 400
        },
        allocated: {
          cpu: 32,
          ram: 128,
          storage: 200
        },
        status: 'AVAILABLE'
      }
    }),
    prisma.host.create({
      data: {
        hostname: 'vps-lon-01',
        dataCenterId: euCentral.id,
        type: 'VPS',
        spec: {
          cpu: 64,
          ram: 256,
          storage: 50
        },
        allocated: {
          cpu: 16,
          ram: 64,
          storage: 10
        },
        status: 'AVAILABLE'
      }
    }),
    prisma.host.create({
      data: {
        hostname: 'dedicated-01',
        dataCenterId: usWest.id,
        type: 'DEDICATED_SERVER',
        spec: {
          cpu: 256,
          ram: 1024,
          storage: 5000
        },
        allocated: {
          cpu: 64,
          ram: 256,
          storage: 1000
        },
        status: 'AVAILABLE'
      }
    })
  ])

  // Create Users
  const [adminUser, regularUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@cloudhost.io',
        name: 'Admin User',
        passwordHash: 'hashed_password_placeholder',
        isAdmin: true,
        billingInfo: {
          street: '123 Cloud Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          zipCode: '94105'
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Regular User',
        passwordHash: 'hashed_password_placeholder',
        billingInfo: {
          street: '456 User Avenue',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        }
      }
    })
  ])

  // Create Pricing Plans
  const [gamePlan, vpsPlan, dedicatedPlan] = await Promise.all([
    prisma.pricingPlan.create({
      data: {
        serviceType: 'GAME_SERVER',
        name: 'Minecraft',
        description: '',
        configTemplate: {
          game: 'minecraft',
          slots: 50,
          version: '1.20.1'
        },
        priceMonthly: new Decimal(30.00),
        specs: {
          minCpu: 2,
          maxCpu: 8,
          baseStorage: 100
        },
        pricingModel: {
          "basePrice": 0,
          "modifiers": [
            {
              "type": "per_unit",
              "unit": "gb",
              "field": "ram",
              "price": 2
            },
            {
              "type": "per_unit",
              "unit": "cores",
              "field": "cpu",
              "price": 2
            }
          ]
        }
      }
    }),
    prisma.pricingPlan.create({
      data: {
        serviceType: 'VPS',
        name: 'VPS Basic',
        configTemplate: {
          os: 'ubuntu',
          cpu: 4,
          ramGB: 8
        },
        priceMonthly: new Decimal(15.00),
        specs: {
          minCpu: 1,
          maxCpu: 4,
          baseStorage: 50
        }
      }
    }),
    prisma.pricingPlan.create({
      data: {
        serviceType: 'DEDICATED_SERVER',
        name: 'Enterprise Dedicated',
        configTemplate: {
          managed: true,
          supportLevel: '24/7'
        },
        priceMonthly: new Decimal(500.00),
        specs: {
          minCpu: 32,
          maxCpu: 256,
          baseStorage: 1000
        }
      }
    })
  ])

  // Create Services
  const [minecraftService, vpsService] = await Promise.all([
    prisma.service.create({
      data: {
        type: 'GAME_SERVER',
        userId: regularUser.id,
        hostId: gameHost.id,
        config: {
          game: 'minecraft',
          slots: 50,
          version: '1.20.1',
          mods: ['optifine']
        },
        renewedAt: new Date(),
        terminationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    }),
    prisma.service.create({
      data: {
        type: 'VPS',
        userId: regularUser.id,
        hostId: vpsHost.id,
        config: {
          os: 'ubuntu',
          cpu: 4,
          ramGB: 8,
          storageGB: 100
        },
        renewedAt: new Date(),
        terminationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  ])

  // Create Network Configs
  await Promise.all([
    prisma.networkConfig.create({
      data: {
        serviceId: minecraftService.id,
        ipv4: '192.168.1.100',
        ipv6: '2001:0db8:85a3::8a2e:0370:7334',
        ports: {
          tcp: [25565, 27015],
          udp: [27015]
        }
      }
    }),
    prisma.networkConfig.create({
      data: {
        serviceId: vpsService.id,
        ipv4: '203.0.113.5',
        ipv6: '2001:0db8:85a3::8a2e:0370:7335',
        ports: {
          tcp: [22, 80, 443]
        }
      }
    })
  ])

  // Create Orders and Invoices
  const order = await prisma.order.create({
    data: {
      status: 'ACTIVE',
      totalAmount: new Decimal(45.00),
      userId: regularUser.id,
      serviceId: minecraftService.id,
      planId: gamePlan.id,
      items: {
        create: {
          planId: gamePlan.id,
          configuration: {
            slots: 50,
            mods: ['optifine']
          },
          unitPrice: new Decimal(30.00),
          quantity: 1
        }
      }
    }
  })

  await prisma.invoice.create({
    data: {
      amount: new Decimal(45.00),
      status: 'PAID',
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(),
      userId: regularUser.id,
      orderId: order.id,
      serviceId: minecraftService.id
    }
  })

  // Create Cart with Items
  await prisma.cart.create({
    data: {
      userId: regularUser.id,
      items: {
        create: {
          planId: vpsPlan.id,
          configuration: {
            os: 'ubuntu',
            cpu: 2
          },
          quantity: 1,
          unitPrice: new Decimal(15.00)
        }
      }
    }
  })

  console.log('🌱 Database seeded successfully')
}

seed().then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

