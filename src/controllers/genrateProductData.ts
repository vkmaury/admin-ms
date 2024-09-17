import { Request, Response } from 'express';
import { faker } from '@faker-js/faker';
import Product from '../models/productSchema';
import { Types } from 'mongoose';

// Mapping categories to specific products
const categoryMap: {
  [key: string]: { brands: string[]; descriptionTemplate: string };
} = {
  'Bluetooth Speaker': {
    brands: ['JBL', 'Bose', 'Sony', 'Tribit', 'Boat'],
    descriptionTemplate:
      'Portable Bluetooth speakers for high-quality sound on the go.',
  },
  'Digital Camera': {
    brands: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'],
    descriptionTemplate:
      'Capture stunning photos with our range of professional and consumer-grade digital cameras.',
  },
  'Fitness Tracker': {
    brands: ['Dizo', 'Realme', 'samsung', 'Apple', 'boat'],
    descriptionTemplate:
      'Track your daily activities and fitness goals with advanced fitness trackers.',
  },
  'Gaming Console': {
    brands: ['PlayStation', 'Xbox', 'Nintendo', 'Valve', 'Sega'],
    descriptionTemplate:
      'Discover the latest gaming consoles for an immersive gaming experience.',
  },
  'Gaming Mouse': {
    brands: ['Logitech', 'Razer', 'SteelSeries', 'Corsair', 'HyperX'],
    descriptionTemplate:
      'Get the precision and speed you need with high-performance gaming mice.',
  },
  'Home Theater System': {
    brands: ['Bose', 'Sony', 'Yamaha', 'LG', 'JBL'],
    descriptionTemplate:
      'Enhance your entertainment experience with premium home theater systems.',
  },
  Laptops: {
    brands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus'],
    descriptionTemplate: 'All Brands of laptops are listed here.',
  },
  'Smart TV': {
    brands: ['Samsung', 'LG', 'Sony', 'Vizio', 'TCL'],
    descriptionTemplate:
      'Get the best deals on high-definition Smart TVs from top brands.',
  },
  Tablet: {
    brands: ['Apple', 'Samsung', 'Amazon', 'Microsoft', 'Lenovo'],
    descriptionTemplate:
      'Browse through our collection of tablets for all your mobile computing needs.',
  },
  'Wireless Charger': {
    brands: ['boat', 'realme', 'Samsung', 'Apple', 'xiaomi'],
    descriptionTemplate:
      'Charge your devices quickly and conveniently with wireless chargers.',
  },
  'Wireless Earbuds': {
    brands: ['Apple', 'Sony', 'Jabra', 'Samsung', 'Anker'],
    descriptionTemplate:
      'Experience seamless music with top-notch wireless earbuds.',
  },
  earphones: {
    brands: ['Sony', 'Sennheiser', 'JBL', 'Beats', 'Bose'],
    descriptionTemplate: 'All Brands of earphones are listed here.',
  },
  'power bank': {
    brands: ['Ambrane', 'Xiaomi', 'RAVPower', 'Samsung', 'realme'],
    descriptionTemplate: 'All Brands of power banks are listed here.',
  },
  'smart watch': {
    brands: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei'],
    descriptionTemplate: 'All Brands of smart watches are listed here.',
  },
  smartphone: {
    brands: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Google'],
    descriptionTemplate: 'All Brands of smartphones are listed here.',
  },
};

// Generate product names and descriptions based on the category
const generateProductNameAndDescription = (
  categoryName: string,
  index: number
) => {
  const categoryData = categoryMap[categoryName] || {
    brands: [],
    descriptionTemplate: '',
  };

  let name: string;
  let description: string;

  if (categoryData.brands.length > 0) {
    const brand = categoryData.brands[index % categoryData.brands.length];
    name = `${brand} ${categoryName} ${index + 1}`;
    description = categoryData.descriptionTemplate;
  } else {
    // Fallback to generic product generation if the category is not mapped
    name = faker.commerce.productName();
    description = faker.commerce.productDescription();
  }

  return { name, description };
};

export const generateProductData = async (req: Request, res: Response) => {
  const { noOfProducts, sellerId, categoryId, categoryName } = req.body;

  // Input validation
  if (!noOfProducts || isNaN(noOfProducts)) {
    return res.status(400).json({ message: 'Invalid number of products.' });
  }
  if (!Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ message: 'Invalid seller ID.' });
  }
  if (!Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }
  if (!categoryName || !categoryMap[categoryName]) {
    return res
      .status(400)
      .json({ message: 'Invalid or unsupported category name.' });
  }

  const sellerObjectId = new Types.ObjectId(sellerId);
  const categoryObjectId = new Types.ObjectId(categoryId);
  const products = [];

  for (let i = 0; i < noOfProducts; i++) {
    // Generate product name and description based on the category name
    const { name, description } = generateProductNameAndDescription(
      categoryName,
      i
    );

    const MRP = parseFloat(
      faker.commerce.price({ min: 1000, max: 20000, dec: 0 })
    );
    const sellerDiscountApplied = faker.number.int({ min: 0, max: 50 });
    const sellerDiscounted = MRP - (MRP * sellerDiscountApplied) / 100;
    const quantity = faker.number.int({ min: 10, max: 500 });
    const adminDiscount = 0;
    const discountId = null;
    const isActive = true;
    const isBlocked = false;
    const isDeleted = false;
    const blockedBy = null;

    const product = {
      name,
      description,
      MRP,
      sellerDiscounted,
      quantity,
      sellerDiscountApplied,
      adminDiscount,
      discountId,
      categoryId: categoryObjectId,
      sellerId: sellerObjectId,
      isActive,
      isBlocked,
      isDeleted,
      blockedBy,
      createdBy: sellerObjectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    products.push(product);
  }

  try {
    // Bulk insert the generated products into the database
    await Product.insertMany(products);
    res.status(201).json({
      message: `${noOfProducts} dummy products for ${categoryName} created successfully.`,
    });
  } catch (error) {
    console.error('Error creating dummy products:', error);
    res.status(500).json({ message: 'Error creating dummy products.' });
  }
};