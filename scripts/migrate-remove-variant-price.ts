/**
 * Migration Script: Remove price field from product variants
 *
 * This script removes the 'price' field from all variants in existing products.
 * Run this after deploying the code changes that remove price from variants.
 *
 * Usage:
 *   ts-node scripts/migrate-remove-variant-price.ts
 */

import { connect, connection } from 'mongoose';

// Database connection URI - update with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function migrateRemoveVariantPrice() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    const db = connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const productsCollection = db.collection('products');

    console.log('📊 Checking products with variant prices...');

    // Find all products that have variants with price field
    const productsWithPrices = await productsCollection.countDocuments({
      'variants.price': { $exists: true }
    });

    console.log(`Found ${productsWithPrices} products with variant prices\n`);

    if (productsWithPrices === 0) {
      console.log('✅ No products found with variant prices. Migration not needed.');
      await connection.close();
      return;
    }

    console.log('🔄 Removing price field from all variants...');

    // Remove the price field from all variants in all products
    const result = await productsCollection.updateMany(
      { 'variants.price': { $exists: true } },
      {
        $unset: {
          'variants.$[].price': ''
        }
      }
    );

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   - Matched documents: ${result.matchedCount}`);
    console.log(`   - Modified documents: ${result.modifiedCount}`);

    // Verify the migration
    const remainingPrices = await productsCollection.countDocuments({
      'variants.price': { $exists: true }
    });

    if (remainingPrices > 0) {
      console.warn(`\n⚠️  Warning: ${remainingPrices} products still have variant prices!`);
    } else {
      console.log(`\n✅ Verification: All variant prices have been removed successfully`);
    }

    // Show sample of updated products
    console.log('\n📋 Sample of updated products:');
    const samples = await productsCollection
      .find({})
      .limit(3)
      .project({
        name: 1,
        code: 1,
        basePrice: 1,
        'variants.sku': 1,
        'variants.size': 1,
        'variants.color': 1,
        'variants.stock': 1
      })
      .toArray();

    samples.forEach((product: any, index: number) => {
      console.log(`\n${index + 1}. ${product.name} (${product.code})`);
      console.log(`   Base Price: $${product.basePrice}`);
      console.log(`   Variants (${product.variants.length}):`);
      product.variants.forEach((v: any) => {
        console.log(`     - ${v.size}/${v.color}: stock=${v.stock}, sku=${v.sku}`);
      });
    });

    await connection.close();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await connection.close();
    process.exit(1);
  }
}

// Run the migration
migrateRemoveVariantPrice();
