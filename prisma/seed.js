const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const memberPassword = await bcrypt.hash("Member1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@teamtask.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@teamtask.local",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@teamtask.local" },
    update: {},
    create: {
      name: "Member User",
      email: "member@teamtask.local",
      passwordHash: memberPassword,
      role: "MEMBER",
    },
  });

  const seedProjects = [
    {
      name: "Website redesign",
      description: "Refresh the public site with stronger messaging and a cleaner conversion flow.",
      dueDate: daysFromNow(12),
    },
    {
      name: "Customer onboarding",
      description: "Improve signup, first-run guidance, and the first success milestone.",
      dueDate: daysFromNow(18),
    },
  ];

  for (let index = 0; index < seedProjects.length; index += 1) {
    const projectData = seedProjects[index];
    const slug = `${slugify(projectData.name)}-${index + 1}`;

    const project = await prisma.project.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: projectData.name,
        description: projectData.description,
        dueDate: projectData.dueDate,
        ownerId: admin.id,
        members: {
          create: [{ userId: admin.id }, { userId: member.id }],
        },
      },
    });

    const existingTaskCount = await prisma.task.count({ where: { projectId: project.id } });

    if (existingTaskCount === 0) {
      await prisma.task.createMany({
        data: [
          {
            projectId: project.id,
            title: index === 0 ? "Review hero copy" : "Write first-run email copy",
            description: "Make the user journey clearer and more persuasive.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromNow(4),
            assigneeId: member.id,
            creatorId: admin.id,
          },
          {
            projectId: project.id,
            title: index === 0 ? "Ship responsive header" : "Add onboarding checklist",
            description: "Keep the first interaction crisp on mobile and desktop.",
            status: index === 0 ? "REVIEW" : "TODO",
            priority: "MEDIUM",
            dueDate: daysFromNow(7),
            assigneeId: admin.id,
            creatorId: admin.id,
          },
        ],
      });
    }
  }

  console.log("Seed complete. Admin: admin@teamtask.local / Admin1234!");
  console.log("Seed complete. Member: member@teamtask.local / Member1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });