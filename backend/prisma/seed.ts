import "dotenv/config";
import prisma from "../src/config/prisma";
import { hashPassword } from "../src/utils/password";

async function main() {
  const demoPassword = "password123";
  const passwordHash = await hashPassword(demoPassword);

  const jashim = await prisma.user.upsert({
    where: {
      email: "jashim@teslapool.local",
    },
    update: {
      name: "Jashim",
      role: "DRIVER",
      passwordHash,
    },
    create: {
      name: "Jashim",
      email: "jashim@teslapool.local",
      passwordHash,
      role: "DRIVER",
    },
  });

  await prisma.vehicle.upsert({
    where: {
      driverId: jashim.id,
    },
    update: {
      name: "Bullet",
      capacity: 3,
      isOnline: false,
    },
    create: {
      name: "Bullet",
      capacity: 3,
      isOnline: false,
      driverId: jashim.id,
    },
  });

  const passengers = [
    {
      name: "Nusrat",
      email: "nusrat@teslapool.local",
    },
    {
      name: "Rafiq",
      email: "rafiq@teslapool.local",
    },
    {
      name: "Shirin",
      email: "shirin@teslapool.local",
    },
  ];

  for (const passenger of passengers) {
    await prisma.user.upsert({
      where: {
        email: passenger.email,
      },
      update: {
        name: passenger.name,
        role: "PASSENGER",
        passwordHash,
      },
      create: {
        name: passenger.name,
        email: passenger.email,
        passwordHash,
        role: "PASSENGER",
      },
    });
  }

  console.log("Seed completed successfully.");
  console.log("Demo password for all users:", demoPassword);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
