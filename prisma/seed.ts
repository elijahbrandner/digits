/* eslint-disable no-await-in-loop */
/* eslint-disable no-template-curly-in-string */
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';
import config from '../config/settings.development.json';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding the database...');

  const password = await hash('changeme', 10);

  // Seed default accounts
  for (const account of config.defaultAccounts) {
    const role: Role = account.role === 'ADMIN' ? 'ADMIN' : 'USER';
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        password,
        role,
      },
    });
    console.log(`✅ Created user: ${account.email} (${role})`);
  }

  // Seed default contacts and notes
  for (const [index, contact] of config.defaultContacts.entries()) {
    const createdContact = await prisma.contact.upsert({
      where: { id: index + 1 },
      update: {},
      create: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        address: contact.address,
        image: contact.image,
        description: contact.description,
        owner: contact.owner,
      },
    });
    console.log(`📇 Added contact: ${contact.firstName} ${contact.lastName}`);

    // Add a sample note for the contact
    await prisma.note.create({
      data: {
        contactId: createdContact.id,
        note: `This is a sample note for ${contact.firstName}.`,
        owner: contact.owner,
      },
    });
    console.log(`📝 Added note for: ${contact.firstName} ${contact.lastName}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
