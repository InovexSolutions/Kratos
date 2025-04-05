import { Decimal } from '@prisma/client/runtime/library'
import prisma from '~/lib/prisma'


async function seed() {
    // Create Data Centers
    // const [usWest, euCentral] = await Promise.all([
    // prisma.dataCenter.create({
    // data: {
    // name: 'US West',
    // location: 'San Francisco, CA'
    // }
    // }),
    // prisma.dataCenter.create({
    // data: {
    // name: 'EU Central',
    // location: 'Frankfurt, DE'
    // }
    // })
    // ])

    // Create Hosts
    // const [gameHost, vpsHost, dedicatedHost] = await Promise.all([
    // prisma.host.create({
    // data: {
    // hostname: 'game-eu-01',
    // dataCenterId: euCentral.id,
    // type: 'GAME_SERVER',
    // spec: {
    // cpu: 12,
    // ram: 32,
    // storage: 400
    // },
    // allocated: {
    // cpu: 32,
    // ram: 128,
    // storage: 200
    // },
    // status: 'AVAILABLE'
    // }
    // }),
    // prisma.host.create({
    // data: {
    // hostname: 'vps-lon-01',
    // dataCenterId: euCentral.id,
    // type: 'VPS',
    // spec: {
    // cpu: 64,
    // ram: 256,
    // storage: 50
    // },
    // allocated: {
    // cpu: 16,
    // ram: 64,
    // storage: 10
    // },
    // status: 'AVAILABLE'
    // }
    // }),
    // prisma.host.create({
    // data: {
    // hostname: 'dedicated-01',
    // dataCenterId: usWest.id,
    // type: 'DEDICATED_SERVER',
    // spec: {
    // cpu: 256,
    // ram: 1024,
    // storage: 5000
    // },
    // allocated: {
    // cpu: 64,
    // ram: 256,
    // storage: 1000
    // },
    // status: 'AVAILABLE'
    // }
    // })
    // ])

    // Create Users
    // const [adminUser, regularUser] = await Promise.all([
    // prisma.user.create({
    // data: {
    // email: 'admin@cloudhost.io',
    // name: 'Admin User',
    // passwordHash: 'hashed_password_placeholder',
    // isAdmin: true,
    // billingInfo: {
    // street: '123 Cloud Street',
    // city: 'San Francisco',
    // state: 'CA',
    // country: 'USA',
    // zipCode: '94105'
    // }
    // }
    // }),
    // prisma.user.create({
    // data: {
    // email: 'user@example.com',
    // name: 'Regular User',
    // passwordHash: 'hashed_password_placeholder',
    // billingInfo: {
    // street: '456 User Avenue',
    // city: 'New York',
    // state: 'NY',
    // country: 'USA',
    // zipCode: '10001'
    // }
    // }
    // })
    // ])

    // Create Pricing Plans
    await Promise.all([
        prisma.pricingPlan.create({
            data: {
                serviceType: 'GAME_SERVER',
                name: 'Minecraft',
                description: '',
                configTemplate: {
                    "eggs": [
                        {
                            "id": 3,
                            "name": "Vanilla"
                        },
                        {
                            "id": 1,
                            "name": "Paper Spigot"
                        },
                        {
                            "id": 4,
                            "name": "Forge"
                        }
                    ],
                    "game": "minecraft",
                    "nest": 1
                },
                priceMonthly: new Decimal(2.99),
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
    console.log('🌱 Database seeded successfully')
}

seed().then(async () => {
    await prisma.$disconnect()
})
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        // process.exit(1)
    })