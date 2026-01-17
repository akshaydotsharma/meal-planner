import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default user profile if none exists
  const existingProfile = await prisma.userProfile.findFirst()

  if (!existingProfile) {
    await prisma.userProfile.create({
      data: {
        pantryText: `salt
pepper
olive oil
garlic
onions
butter
flour
sugar
eggs
milk
rice
pasta
soy sauce
vinegar
vegetable oil`,
        utensilsText: `knife
cutting board
frying pan
saucepan
pot
baking sheet
mixing bowls
spatula
whisk
tongs
measuring cups
measuring spoons
colander`,
      },
    })
    console.log('Created default user profile')
  } else {
    console.log('User profile already exists')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
