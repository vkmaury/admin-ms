import { Request, Response } from 'express';
import { faker } from '@faker-js/faker';
import User from '../models/User';
import bcrypt from 'bcrypt';

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generatePhoneNumber(): string {
  const startDigit = ['6', '7', '8', '9'];
  // Get a random starting digit
  const firstDigit = startDigit[Math.floor(Math.random() * startDigit.length)];
  // Generate the remaining 9 digits (0-9)
  let remainingDigits = '';
  for (let i = 0; i < 9; i++) {
    remainingDigits += Math.floor(Math.random() * 10).toString();
  }
  return firstDigit + remainingDigits;
}

export const generateUserData = async (req: Request, res: Response) => {
  const { noOfUsers, role } = req.body;

  // Validate the number of users and role
  if (!noOfUsers || isNaN(noOfUsers)) {
    return res.status(400).json({
      message: 'Please provide a valid number of users.',
    });
  }

  if (!['user', 'seller'].includes(role)) {
    return res.status(400).json({
      message: 'Role must be either user or seller.',
    });
  }

  const users = [];

  for (let i = 0; i < noOfUsers; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}@gmail.com`;
    const phoneNumber = generatePhoneNumber();

    const countryCode = faker.location.countryCode();
    const dob = randomDate(new Date(1950, 0, 1), new Date(2000, 11, 31));
    
    const password = faker.internet.password();
    const hashedPassword = await bcrypt.hash(password, 10);

    const address = {
      houseNumber: faker.location.buildingNumber(),
      locality: faker.location.street(),
      nearBy: faker.location.secondaryAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country: faker.location.country(),
    };

    const user = {
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      email,
      countryCode,
      phoneNumber,
      password: hashedPassword,
      isVerified: true,
      role,
      dob,
      address,
      name: `${firstName} ${lastName}`,
      is2FAEnabled: false,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isBlocked: false,
      loginHistory: [],
      isRandomGenerated: true,
    };

    users.push(user);
  }

  try {
    await User.insertMany(users);
    res
      .status(201)
      .send({ message: `${noOfUsers} ${role} created successfully.` });
  } catch (error) {
    console.error('Error creating dummy users:', error);
    res.status(500).send({ error: 'Error creating dummy users' });
  }
};
